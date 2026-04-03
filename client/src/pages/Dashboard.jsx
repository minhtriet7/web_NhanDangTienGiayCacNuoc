import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import axiosClient from "../api/axiosClient";
import Sidebar from "../components/Sidebar";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function Dashboard() {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);

  const reportRef = useRef();

  const handleImageChange = (e) => {
    if (loading) return;
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      previews.forEach((url) => URL.revokeObjectURL(url));
      setImages(files);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews(newPreviews);
      setAnalysisData(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
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
      let errorMessage = "❌ Lỗi kết nối đến máy chủ!";
      if (err.response && err.response.data && err.response.data.detail) {
        errorMessage =
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : JSON.stringify(err.response.data.detail);
      }
      setError(`⚠️ Máy chủ báo lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    const element = reportRef.current;
    const originalOverflow = element.style.overflow;
    element.style.overflow = "visible";

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowHeight: element.scrollHeight,
    });

    element.style.overflow = originalOverflow;

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`CHUNG-THU-GIAM-DINH-${Date.now()}.pdf`);
  };

  const renderJsonData = (jsonString) => {
    if (!jsonString)
      return (
        <p className="text-slate-400 text-sm italic text-center py-4">
          Không có dữ liệu
        </p>
      );
    try {
      const data =
        typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      if (data.error)
        return (
          <div className="text-rose-600 font-semibold p-3 bg-rose-50 rounded-xl border border-rose-100 text-sm flex items-center gap-2">
            ⚠️ <span>{data.error}</span>
          </div>
        );

      return (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
              🌍 Quốc gia
            </span>
            <span className="text-slate-800 font-semibold">
              {data.quoc_gia || "Không rõ"}
            </span>
          </div>
          <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
              💵 Mệnh giá
            </span>
            <span className="text-indigo-600 font-bold text-base">
              {data.menh_gia || "Không rõ"}
            </span>
          </div>
          <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
              📅 Năm
            </span>
            <span className="text-slate-800 font-semibold">
              {data.nam_phat_hanh || "Không rõ"}
            </span>
          </div>
          <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
              🏷️ Chất liệu
            </span>
            <span className="text-slate-800 font-semibold">
              {data.chat_lieu || "Không rõ"}
            </span>
          </div>
        </div>
      );
    } catch (e) {
      return (
        <pre className="text-xs bg-slate-100 p-3 rounded-xl text-slate-600 whitespace-pre-wrap break-words border border-slate-200">
          {jsonString}
        </pre>
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar />
      <div className="flex-1 p-6 md:p-12 overflow-y-auto max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 tracking-tight flex items-center gap-3">
              <span className="text-4xl">🔮</span> Giám định Tiền tệ AI
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Hệ thống phân tích đa tác nhân thông minh
            </p>
          </div>
          {analysisData && (
            <button
              onClick={exportPDF}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Xuất Chứng Thư PDF
            </button>
          )}
        </div>

        {/* UPLOAD AREA */}
        <div className="mb-10 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col gap-6">
          <label
            className={`w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
              loading
                ? "opacity-60 pointer-events-none border-slate-300 bg-slate-50"
                : "border-indigo-300 bg-indigo-50/30 hover:bg-indigo-50/80 hover:border-indigo-500"
            }`}
            style={{ minHeight: "220px" }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={loading}
              onChange={handleImageChange}
              onClick={(e) => (e.target.value = null)}
              className="hidden"
            />

            {previews.length === 0 ? (
              <div className="text-center p-10 z-10">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl text-indigo-500">📸</span>
                </div>
                <span className="text-slate-700 font-bold text-lg block">
                  Nhấn hoặc kéo thả ảnh vào đây
                </span>
                <p className="text-slate-400 text-sm mt-2 font-medium">
                  Hỗ trợ PNG, JPG • Quét nhiều ảnh cùng lúc
                </p>
              </div>
            ) : (
              <div className="flex gap-4 flex-wrap justify-center p-8 w-full z-10">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative group/img">
                    <img
                      src={src}
                      alt={`Preview ${idx}`}
                      className="h-36 w-auto object-contain rounded-xl shadow-sm border-2 border-white bg-slate-50 p-1 transform transition-transform group-hover/img:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}
          </label>

          {previews.length > 0 && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex justify-center items-center gap-3 shadow-lg
                ${
                  loading
                    ? "bg-slate-200 text-slate-500 shadow-none cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0"
                }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-6 w-6 text-indigo-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  ĐANG PHÂN TÍCH CHUYÊN SÂU...
                </>
              ) : (
                `🚀 BẮT ĐẦU GIÁM ĐỊNH ${previews.length} ẢNH`
              )}
            </button>
          )}
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl mb-10 flex items-start gap-4 shadow-sm">
            <div className="bg-white p-2 rounded-full shadow-sm">
              <span className="text-xl">⚠️</span>
            </div>
            <div className="text-rose-700 font-medium pt-1 leading-relaxed">
              {error}
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white border border-indigo-100 rounded-3xl p-10 mb-10 text-center shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-50/50 animate-pulse"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm animate-bounce">
                🤖
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
                Hội đồng AI đang làm việc...
              </h2>
              <p className="text-slate-500 font-medium max-w-md mx-auto">
                Các chuyên gia đang phân tích ảnh, trích xuất dữ liệu và tranh
                biện để đưa ra kết quả chính xác nhất.
              </p>
            </div>
          </div>
        )}

        {/* REPORT SECTION (PDF TARGET) */}
        {analysisData && (
          <div
            ref={reportRef}
            className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="p-8 md:p-14">
              {/* PDF Header */}
              <div className="border-b-[3px] border-slate-800 pb-6 mb-8 flex justify-between items-end">
                <div>
                  <p className="text-indigo-600 font-bold tracking-wider text-sm mb-2 uppercase">
                    Hệ Thống Giám Định Tự Động
                  </p>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-widest leading-none">
                    CHỨNG THƯ GIÁM ĐỊNH
                  </h2>
                </div>
                <div className="text-right hidden sm:block text-slate-400">
                  <svg
                    className="w-12 h-12 inline-block opacity-20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 mb-10 text-sm bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-xs">
                    Thời gian cấp
                  </span>
                  <span className="text-slate-800 font-bold text-base">
                    {new Date().toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="hidden sm:block w-px bg-slate-200"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-xs">
                    Tổng số vật chứng
                  </span>
                  <span className="text-emerald-700 font-bold text-base">
                    {analysisData.total_files_uploaded || 1} ảnh (Phát hiện{" "}
                    {analysisData.total_detected ||
                      analysisData.total_objects_detected ||
                      0}{" "}
                    đối tượng)
                  </span>
                </div>
              </div>

              {/* Original Images Grid */}
              {previews && previews.length > 0 && (
                <div className="mb-12 p-8 bg-slate-50 rounded-3xl flex flex-wrap justify-center gap-6 border border-slate-100">
                  {previews.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`Ảnh gốc ${idx + 1}`}
                      className="max-h-64 max-w-full rounded-2xl shadow-sm object-contain bg-white p-2 border border-slate-200"
                    />
                  ))}
                </div>
              )}

              {/* AI Results */}
              {(analysisData.results || analysisData.data || []).map(
                (item, index) => {
                  const resultItem = item.analysis ? item.analysis : item;
                  const isLast =
                    index ===
                    (analysisData.results || analysisData.data).length - 1;

                  return (
                    <div
                      key={index}
                      className={`pb-12 ${!isLast ? "border-b border-slate-200 mb-12" : ""}`}
                    >
                      <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2 rounded-xl font-bold text-lg mb-6 border border-indigo-100 shadow-sm">
                        <span className="text-xl">💵</span> Đối tượng giám định
                        #{index + 1}
                      </div>

                      {/* Final Report (Markdown) */}
                      <div className="mb-8 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-8 rounded-3xl border border-emerald-100/60 shadow-sm">
                        <h3 className="text-emerald-800 font-extrabold text-xl mb-5 flex items-center gap-3 uppercase tracking-wide">
                          <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                            ⚖️
                          </span>{" "}
                          KẾT LUẬN CHÍNH THỨC
                        </h3>
                        <div className="text-slate-700 leading-relaxed font-medium prose prose-emerald max-w-none">
                          <ReactMarkdown>
                            {resultItem.final_report}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* 3 AI Agents Grid */}
                      <h4 className="text-slate-800 font-bold text-lg mb-6 flex items-center gap-2">
                        <span className="text-slate-400">⚡</span> Chi tiết báo
                        cáo độc lập
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Logic Box */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group">
                          <h4 className="text-slate-800 font-bold text-md mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <span className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-lg flex items-center justify-center">
                              🟢
                            </span>
                            Chuyên gia Logic
                          </h4>
                          {renderJsonData(resultItem.groq)}
                        </div>

                        {/* Lang Box */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-violet-300 transition-all group">
                          <h4 className="text-slate-800 font-bold text-md mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <span className="bg-violet-100 text-violet-600 w-8 h-8 rounded-lg flex items-center justify-center">
                              🟣
                            </span>
                            Chuyên gia Ngôn ngữ
                          </h4>
                          {renderJsonData(resultItem.openrouter)}
                        </div>

                        {/* Art Box */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group">
                          <h4 className="text-slate-800 font-bold text-md mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <span className="bg-amber-100 text-amber-600 w-8 h-8 rounded-lg flex items-center justify-center">
                              🟠
                            </span>
                            Chuyên gia Mỹ thuật
                          </h4>
                          {renderJsonData(resultItem.gemini)}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
