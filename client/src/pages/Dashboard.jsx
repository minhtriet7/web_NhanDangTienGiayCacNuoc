import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import axiosClient from "../api/axiosClient";
import Sidebar from "../components/Sidebar";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function Dashboard() {
  const [images, setImages] = useState([]); // Đổi thành mảng chứa nhiều file
  const [previews, setPreviews] = useState([]); // Đổi thành mảng chứa nhiều URL ảnh
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);

  const reportRef = useRef();

  const handleImageChange = (e) => {
    // KHÓA: Không cho phép thao tác đổi ảnh nếu hệ thống đang phân tích
    if (loading) return;

    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages(files);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews(newPreviews);
      setAnalysisData(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;

    // Đảm bảo xóa kết quả cũ và bật trạng thái chờ
    setAnalysisData(null);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    images.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await axiosClient.post("/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalysisData(response.data);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.detail || "❌ Lỗi kết nối đến máy chủ!";
      setError(`⚠️ Máy chủ báo lỗi: ${errorMessage}`);
    } finally {
      // BẮT BUỘC: Luôn tắt trạng thái loading dù thành công hay thất bại
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    const element = reportRef.current;

    // Tạm thời thay đổi style để html2canvas chụp không bị lỗi cuộn (scroll)
    const originalOverflow = element.style.overflow;
    element.style.overflow = "visible";

    const canvas = await html2canvas(element, {
      scale: 2, // Giữ nguyên độ nét cao
      useCORS: true,
      backgroundColor: "#ffffff",
      windowHeight: element.scrollHeight, // Đảm bảo chụp hết chiều dài thực tế
    });

    // Trả lại style cũ
    element.style.overflow = originalOverflow;

    const imgData = canvas.toDataURL("image/png");

    // Khởi tạo PDF khổ A4
    const pdf = new jsPDF("p", "mm", "a4");

    // Lấy kích thước chuẩn của A4 (Rộng ~210mm, Dài ~297mm)
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Tính toán chiều cao của bức ảnh khi thu phóng vừa với chiều rộng A4
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0; // Tọa độ Y để dán ảnh

    // Dán phần đầu tiên lên trang 1
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;

    // Vòng lặp: Nếu ảnh vẫn còn dư chiều cao, tạo thêm trang mới
    while (heightLeft > 0) {
      position = heightLeft - imgHeight; // Dịch chuyển tọa độ Y lên trên để in phần tiếp theo
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`BAO-CAO-${Date.now()}.pdf`);
  };

  const renderJsonData = (jsonString) => {
    if (!jsonString) return <p>Không có dữ liệu</p>;
    try {
      const data =
        typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      if (data.error)
        return (
          <div style={{ color: "#ef4444", fontWeight: "bold" }}>
            ⚠️ {data.error}
          </div>
        );
      return (
        <div className="parsed-data">
          <div className="data-row">
            <strong>🌍 Quốc gia:</strong>{" "}
            <span>{data.quoc_gia || "Không rõ"}</span>
          </div>
          <div className="data-row">
            <strong>💵 Mệnh giá:</strong>{" "}
            <span>{data.menh_gia || "Không rõ"}</span>
          </div>
          <div className="data-row">
            <strong>📅 Năm:</strong>{" "}
            <span>{data.nam_phat_hanh || "Không rõ"}</span>
          </div>
          <div className="data-row">
            <strong>🏷️ Chất liệu:</strong>{" "}
            <span>{data.chat_lieu || "Không rõ"}</span>
          </div>
        </div>
      );
    } catch (e) {
      console.error("Lỗi phân tích JSON:", e);
      return (
        <pre
          className="json-code"
          style={{ fontSize: "11px", whiteSpace: "pre-wrap" }}
        >
          {jsonString}
        </pre>
      );
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-content">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h1 style={{ color: "#1e293b", margin: 0 }}>
            🔍 Giám định tiền tệ AI
          </h1>
          {analysisData && (
            <button onClick={exportPDF} style={customStyles.pdfBtn}>
              📥 Xuất Chứng Thư PDF
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "30px",
            flexDirection: "column",
          }}
        >
          <label
            className="upload-area"
            style={{
              flex: 1,
              pointerEvents: loading ? "none" : "auto", // Ngăn click khi load
              opacity: loading ? 0.6 : 1, // Làm mờ khi load
            }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={loading} // Vô hiệu hóa thẻ input khi load
              onChange={handleImageChange}
              onClick={(e) => (e.target.value = null)}
              style={{ display: "none" }}
            />

            {previews.length === 0 ? (
              <div>
                <span style={{ fontSize: "40px", display: "block" }}>📁</span>
                <span style={{ color: "#cbd5e1" }}>
                  Nhấn để chọn một hoặc nhiều ảnh
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {previews.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Preview ${idx}`}
                    style={{
                      height: "120px",
                      borderRadius: "8px",
                      objectFit: "contain",
                      border: "1px solid #475569",
                    }}
                  />
                ))}
              </div>
            )}
          </label>

          {previews.length > 0 && (
            <button
              className="btn-run"
              onClick={handleAnalyze}
              disabled={loading}
              style={{
                alignSelf: "flex-end",
                width: "100%",
                padding: "15px 0",
              }}
            >
              {loading
                ? "⏳ ĐANG PHÂN TÍCH VÀ TRANH BIỆN..."
                : `🚀 GIÁM ĐỊNH ${previews.length} ẢNH`}
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              background: "#7f1d1d",
              color: "#fca5a5",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="waiting-state">
            <h2 style={{ color: "#3b82f6" }}>
              ⏳ Đang cắt ảnh & AI đang phân tích chéo...
            </h2>
          </div>
        )}

        <div
          ref={reportRef}
          style={{
            backgroundColor: "#fff",
            borderRadius: analysisData ? "16px" : "0",
          }}
        >
          {analysisData && (
            <div style={{ padding: "30px" }}>
              <div style={customStyles.pdfHeader}>
                <div
                  style={{
                    borderBottom: "2px solid #1e293b",
                    paddingBottom: "10px",
                    marginBottom: "20px",
                  }}
                >
                  <h2 style={{ margin: 0, color: "#1e293b" }}>
                    CHỨNG THƯ GIÁM ĐỊNH TIỀN TỆ
                  </h2>
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <p>
                    <strong>Ngày giám định:</strong>{" "}
                    {new Date().toLocaleString("vi-VN")}
                  </p>
                  <p style={{ color: "#047857" }}>
                    <strong>Đã xử lý:</strong>{" "}
                    {analysisData.total_files_uploaded} ảnh (Phát hiện{" "}
                    <strong>{analysisData.total_detected}</strong> tờ tiền)
                  </p>
                </div>
              </div>
              {/* === THÊM KHỐI NÀY ĐỂ HIỂN THỊ ẢNH GỐC VÀO PDF === */}
              {previews && previews.length > 0 && (
                <div
                  style={{
                    marginTop: "15px",
                    marginBottom: "30px",
                    padding: "20px",
                    backgroundColor: "#f0fdf4", // Màu xanh nhạt hợp với theme của bạn
                    borderRadius: "12px",
                    display: "flex",
                    gap: "15px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    border: "1px dashed #cbd5e1",
                  }}
                >
                  {previews.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`Ảnh gốc ${idx + 1}`}
                      style={{
                        maxHeight: "250px", // Khống chế chiều cao để PDF không bị quá dài
                        maxWidth: "100%",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        objectFit: "contain",
                      }}
                    />
                  ))}
                </div>
              )}

              {analysisData.results.map((resultItem, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "40px",
                    paddingBottom: "20px",
                    borderBottom:
                      index < analysisData.results.length - 1
                        ? "2px dashed #cbd5e1"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#eff6ff",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      marginBottom: "20px",
                      display: "inline-block",
                    }}
                  >
                    <h2 style={{ color: "#2563eb", margin: 0 }}>
                      💵 Đối tượng thứ {index + 1}
                    </h2>
                  </div>

                  <div className="result-master">
                    <h3 style={{ color: "#047857", marginTop: 0 }}>
                      ⚖️ KẾT LUẬN CHÍNH THỨC
                    </h3>
                    <div
                      style={{
                        color: "#1e293b",
                        fontSize: "16px",
                        lineHeight: "1.6",
                      }}
                    >
                      <ReactMarkdown>{resultItem.final_report}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="ai-grid">
                    <div className="ai-box nemo">
                      <h4 style={{ color: "#059669", margin: "0 0 10px 0" }}>
                        🟢 Logic
                      </h4>
                      {renderJsonData(resultItem.groq)}
                    </div>
                    <div className="ai-box qwen">
                      <h4 style={{ color: "#7c3aed", margin: "0 0 10px 0" }}>
                        🟣 Ngôn ngữ
                      </h4>
                      {renderJsonData(resultItem.openrouter)}
                    </div>
                    <div className="ai-box gemini">
                      <h4 style={{ color: "#d97706", margin: "0 0 10px 0" }}>
                        🟠 Mỹ thuật
                      </h4>
                      {renderJsonData(resultItem.gemini)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const customStyles = {
  pdfBtn: {
    padding: "10px 20px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  pdfHeader: { marginBottom: "20px" },
};

export default Dashboard;
