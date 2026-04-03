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
        const sortedData = response.data.history.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        );
        setHistoryData(sortedData);
      } catch (err) {
        console.error("Lỗi tải lịch sử:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar />
      <div className="flex-1 p-6 md:p-12 max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center gap-4 tracking-tight">
            <span className="text-4xl">🗄️</span> Lịch sử Giám định
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Toàn bộ dữ liệu được mã hóa và lưu trữ an toàn
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white rounded-[2rem] shadow-sm border border-slate-100">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <div className="text-slate-500 font-semibold animate-pulse">
              Đang đồng bộ dữ liệu...
            </div>
          </div>
        ) : historyData.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center">
            <span className="text-6xl mb-4 grayscale opacity-50">📂</span>
            <h3 className="text-xl font-bold text-slate-700">
              Chưa có dữ liệu nào
            </h3>
            <p className="text-slate-500 mt-2">
              Hãy quét tờ tiền đầu tiên của bạn ở mục Giám Định.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {historyData.map((item, index) => {
              const dateObj = new Date(item.timestamp);
              const isNewFormat =
                item.results && Array.isArray(item.results.results);

              return (
                <div
                  key={index}
                  className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Header của thẻ lịch sử */}
                  <div className="bg-slate-50/50 p-6 md:px-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-xl group-hover:scale-110 transition-transform">
                        📄
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 line-clamp-1">
                          {Array.isArray(item.filenames)
                            ? item.filenames.join(", ")
                            : item.filename || "Tệp không tên"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm font-medium text-slate-500">
                          <span className="flex items-center gap-1">
                            <span className="text-indigo-400">📅</span>{" "}
                            {dateObj.toLocaleDateString("vi-VN")}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{dateObj.toLocaleTimeString("vi-VN")}</span>
                        </div>
                      </div>
                    </div>

                    {isNewFormat && (
                      <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-sm font-bold shadow-sm whitespace-nowrap">
                        🔍 Tìm thấy {item.results.total_detected} vật chứng
                      </div>
                    )}
                  </div>

                  {/* Nội dung kết quả */}
                  <div className="p-6 md:p-8">
                    {isNewFormat ? (
                      <div className="flex flex-col gap-6">
                        {item.results.results.map((toTien, idx) => (
                          <div
                            key={idx}
                            className="p-6 bg-slate-50 rounded-2xl border border-slate-100"
                          >
                            <h4 className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-lg border border-slate-200 text-emerald-700 font-bold text-sm mb-4 shadow-sm">
                              <span>💵</span> Tờ tiền #{idx + 1}
                            </h4>
                            <div className="prose prose-slate prose-sm max-w-none text-slate-600 font-medium leading-relaxed prose-strong:text-slate-800">
                              <ReactMarkdown>
                                {toTien.final_report ||
                                  "*Không có dữ liệu văn bản báo cáo.*"}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="prose prose-slate prose-sm max-w-none text-slate-600 font-medium leading-relaxed prose-strong:text-slate-800">
                        <ReactMarkdown>
                          {item.results?.final_report ||
                            "*Không có dữ liệu văn bản báo cáo.*"}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
