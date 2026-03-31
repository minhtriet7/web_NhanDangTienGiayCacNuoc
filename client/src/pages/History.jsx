import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import axiosClient from "../api/axiosClient";
import Sidebar from "../components/Sidebar";

function History() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axiosClient.get("/history");
        // Đảo ngược mảng để lịch sử mới nhất lên đầu tiên
        setHistoryData(response.data.history.reverse());
      } catch (err) {
        console.error("Lỗi tải lịch sử:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-content">
        <h1 style={{ color: "#1e293b", marginBottom: "30px" }}>
          🗄️ Lịch sử giám định của bạn
        </h1>

        {loading ? (
          <div className="waiting-state">
            ⏳ Đang tải dữ liệu từ Database...
          </div>
        ) : historyData.length === 0 ? (
          <div className="waiting-state">Bạn chưa quét tờ tiền nào.</div>
        ) : (
          historyData.map((item, index) => {
            const dateObj = new Date(item.timestamp);

            // KIỂM TRA ĐỊNH DẠNG:
            // Nếu item.results có chứa mảng 'results' bên trong -> Đây là dữ liệu kiểu MỚI (nhiều tờ tiền)
            // Ngược lại -> Đây là dữ liệu kiểu CŨ (1 tờ tiền)
            const isNewFormat =
              item.results && Array.isArray(item.results.results);

            return (
              <div
                key={index}
                className="history-card"
                style={{
                  marginBottom: "25px",
                  padding: "20px",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  className="history-header"
                  style={{
                    borderBottom: "2px solid #f1f5f9",
                    paddingBottom: "15px",
                    marginBottom: "15px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3
                      className="history-title"
                      style={{
                        margin: "0 0 5px 0",
                        color: "#2563eb",
                        fontSize: "18px",
                      }}
                    >
                      📄 File:{" "}
                      {Array.isArray(item.filenames)
                        ? item.filenames.join(", ")
                        : item.filename || "Không rõ"}
                    </h3>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      ⏱️ {dateObj.toLocaleDateString("vi-VN")} -{" "}
                      {dateObj.toLocaleTimeString("vi-VN")}
                    </span>
                  </div>

                  {/* Nếu là định dạng mới, hiển thị badge số lượng tờ tiền */}
                  {isNewFormat && (
                    <span
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#d1fae5",
                        color: "#047857",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      Phát hiện {item.results.total_detected} tờ tiền
                    </span>
                  )}
                </div>

                <div style={{ fontSize: "15px", color: "#334155" }}>
                  {isNewFormat ? (
                    // RENDER KIỂU MỚI: Lặp qua từng tờ tiền để hiển thị
                    item.results.results.map((toTien, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginTop: "15px",
                          padding: "15px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <h4
                          style={{
                            color: "#047857",
                            margin: "0 0 10px 0",
                            fontSize: "16px",
                          }}
                        >
                          💵 Tờ tiền thứ {idx + 1}
                        </h4>
                        <div style={{ lineHeight: "1.6" }}>
                          <ReactMarkdown>
                            {toTien.final_report || "Không có báo cáo"}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))
                  ) : (
                    // RENDER KIỂU CŨ: Hiển thị thẳng báo cáo duy nhất
                    <div style={{ lineHeight: "1.6" }}>
                      <ReactMarkdown>
                        {item.results?.final_report || "Không có báo cáo"}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default History;
