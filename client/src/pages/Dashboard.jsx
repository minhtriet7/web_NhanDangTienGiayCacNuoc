import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import axiosClient from "../api/axiosClient";
import { jsPDF } from "jspdf";
import { toJpeg } from "html-to-image";

import OnboardingModal from "../components/OnboardingModal";
import ReportBugModal from "../components/ReportBugModal";

function Dashboard() {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [tokenBalance, setTokenBalance] = useState("...");

  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const pollIntervalRef = useRef(null);
  const reportRef = useRef();

  useEffect(() => {
    axiosClient
      .get("/auth/me")
      .then((res) => setTokenBalance(res.data.token_balance))
      .catch((err) => setTokenBalance(0));

    const savedTaskId = localStorage.getItem("current_analyze_task_id");
    if (savedTaskId) {
      setTaskId(savedTaskId);
      setLoading(true);
      pollTaskStatus(savedTaskId);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);
const pollTaskStatus = (id) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await axiosClient.get(`/analyze/status/${id}`);
        const data = res.data;
        
        if (data.status === "done") {
          clearInterval(pollIntervalRef.current);
          localStorage.removeItem("current_analyze_task_id");
          setTaskId(null);
          setAnalysisData(data.data);
          
          // ĐÃ SỬA: Lấy số dư mới và phát loa thông báo cập nhật Header
          axiosClient.get("/auth/me").then((r) => {
            setTokenBalance(r.data.token_balance);
            window.dispatchEvent(new Event("token_updated"));
          });
          
          setLoading(false);
        } else if (data.status === "failed") {
          clearInterval(pollIntervalRef.current);
          localStorage.removeItem("current_analyze_task_id");
          setTaskId(null);
          setError(`⚠️ AI báo lỗi: ${data.detail}`);
          setLoading(false);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          clearInterval(pollIntervalRef.current);
          localStorage.removeItem("current_analyze_task_id");
          setTaskId(null);
          setError("⚠️ Tiến trình bị gián đoạn.");
          setLoading(false);
        }
      }
    }, 3000);
  };

  const handleImageChange = (e) => {
    if (loading) return;
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      previews.forEach((url) => URL.revokeObjectURL(url));
      setImages(files);
      setPreviews(files.map((file) => URL.createObjectURL(file)));
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
    images.forEach((file) => formData.append("files", file));
    try {
      const response = await axiosClient.post("/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newTaskId = response.data.task_id;
      localStorage.setItem("current_analyze_task_id", newTaskId);
      setTaskId(newTaskId);
      pollTaskStatus(newTaskId);
    } catch (err) {
      setError(
        `⚠️ Lỗi: ${err.response?.data?.detail || "Không thể kết nối máy chủ"}`,
      );
      setLoading(false);
    }
  };

  const handleReset = () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setImages([]);
    setPreviews([]);
    setAnalysisData(null);
    setError(null);
    setTaskId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportPDF = async () => {
    const element = reportRef.current;
    if (!element) return;
    const btn = document.getElementById("btn-export-pdf");
    if (btn) btn.innerHTML = "⏳ Đang tạo PDF...";
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      element.classList.remove("dark:bg-slate-900", "dark:border-slate-800");
      element.classList.add("bg-white");
      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const doc = new (typeof jsPDF === "function" ? jsPDF : jsPDF.jsPDF)(
        "p",
        "mm",
        "a4",
      );
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => (img.onload = res));
      const imgHeight = (img.height * pdfWidth) / img.width;
      let heightLeft = imgHeight;
      let position = 0;
      doc.addImage(dataUrl, "JPEG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(dataUrl, "JPEG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      doc.save(`CHUNG-THU-AI-${Date.now()}.pdf`);
      element.classList.add("dark:bg-slate-900", "dark:border-slate-800");
    } catch (err) {
      alert("Lỗi xuất: " + err.message);
    } finally {
      if (btn) btn.innerHTML = "📥 Lưu PDF";
    }
  };

  const handleFeedback = async (isCorrect, aiResultText) => {
    try {
      if (isCorrect) {
        await axiosClient.post("/analyze/feedback", {
          task_id: taskId || "unknown",
          ai_result: aiResultText,
          is_correct: true,
        });
        alert("Cảm ơn bạn đã xác nhận!");
      } else {
        const correction = prompt(
          "Vui lòng nhập kết quả đúng (VD: 50000 VND - Việt Nam):",
        );
        if (correction) {
          await axiosClient.post("/analyze/feedback", {
            task_id: taskId || "unknown",
            ai_result: aiResultText,
            is_correct: false,
            user_correction: correction,
          });
          alert("Đã ghi nhận đóng góp của bạn để cải thiện AI!");
        }
      }
    } catch (error) {
      console.error("Lỗi gửi feedback", error);
    }
  };

  // =========================================================
  // MỚI: HÀM THÔNG MINH FORMAT MỆNH GIÁ VÀ TỰ ĐỘNG GẮN ĐƠN VỊ TIỀN TỆ
  // =========================================================
  // =========================================================
  // HÀM FORMAT TIỀN TỆ QUỐC TẾ (ĐỌC TỪ KẾT QUẢ CỦA BACKEND)
  // =========================================================
  const formatCurrency = (amountString) => {
    if (!amountString || amountString === "N/A" || amountString === "Không xác định") return amountString || "N/A";
    
    const str = String(amountString);
    
    // 1. Tách riêng phần Số và phần Chữ (Mã tiền tệ) do AI trả về
    const numericMatch = str.match(/\d+/g); 
    const textMatch = str.match(/[A-Za-z₫$€¥£]+/g); 

    if (!numericMatch) return str; // Nếu không có số, in nguyên văn
    
    // 2. Format số chấm hàng nghìn (10000 -> 10.000)
    const numericAmount = parseInt(numericMatch.join(""), 10);
    const formattedNumber = new Intl.NumberFormat('vi-VN').format(numericAmount);
    
    // 3. Lấy cái chữ AI trả về (VD: VND, JPY) ghép vào sau
    const currencyCode = textMatch ? textMatch.join("") : "";
    
    return currencyCode ? `${formattedNumber} ${currencyCode}` : formattedNumber;
  };

  const renderJsonData = (jsonString) => {
    if (!jsonString)
      return (
        <p className="text-slate-500 text-sm italic py-4">Đang phân tích...</p>
      );
    try {
      const parsed =
        typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      if (parsed.error || (Array.isArray(parsed) && parsed[0]?.error))
        return (
          <div className="text-rose-400 font-mono p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl text-sm">
            {parsed.error || parsed[0].error}
          </div>
        );

      const dataArray = Array.isArray(parsed) ? parsed : [parsed];
      return (
        <div className="flex flex-col gap-4">
          {dataArray.map((data, idx) => (
            <div
              key={idx}
              className="bg-slate-900 text-slate-300 p-6 rounded-2xl border-t-4 border-indigo-500 shadow-xl font-sans text-sm dark:bg-slate-950 dark:border-slate-800 transition-all hover:shadow-indigo-500/20"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-800/30 p-3 rounded-xl">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Quốc gia
                  </span>
                  <span className="text-emerald-400 font-black">
                    {data.quoc_gia || "N/A"}
                  </span>
                </div>

                {/* ĐÃ ÁP DỤNG HÀM FORMAT TIỀN TỆ Ở ĐÂY */}
                <div className="flex justify-between items-center bg-slate-800/30 p-3 rounded-xl">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Mệnh giá
                  </span>
                  <span className="text-amber-400 font-black text-lg">
                    {formatCurrency(data.menh_gia, data.quoc_gia)}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-800/30 p-3 rounded-xl">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Năm in
                  </span>
                  <span className="text-cyan-400 font-bold">
                    {data.nam_phat_hanh || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/30 p-3 rounded-xl">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Chất liệu
                  </span>
                  <span className="text-pink-400 font-medium">
                    {data.chat_lieu || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto">
          <pre className="text-xs text-slate-300 font-mono">{jsonString}</pre>
        </div>
      );
    }
  };

  return (
    <div className="font-sans text-slate-800 dark:text-white transition-colors duration-300 pb-16">
      <OnboardingModal />
      <ReportBugModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              Giám định AI
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Hệ thống phân tích và nhận diện tự động
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm transition-colors">
            <button
              onClick={() => setIsBugModalOpen(true)}
              className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl font-bold text-sm transition-colors flex items-center gap-1"
            >
              <span>⚠️</span> Hỗ trợ
            </button>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div className="px-4 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                Số dư khả dụng
              </p>
              <p className="text-xl font-black text-slate-800 dark:text-white leading-none">
                {tokenBalance}{" "}
                <span className="text-sm font-bold text-indigo-500">🪙</span>
              </p>
            </div>
            <Link
              to="/topup"
              className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md text-sm hover:-translate-y-0.5"
            >
              Nạp Thêm
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-5 rounded-2xl mb-8 flex items-center gap-4 animate-in fade-in">
            <span className="text-2xl">⚠️</span>
            <div className="text-rose-700 dark:text-rose-400 font-medium text-sm">
              {error}
            </div>
          </div>
        )}

        {/* NẾU CHƯA CÓ KẾT QUẢ -> HIỂN THỊ Ô TẢI ẢNH VÀ TRẠNG THÁI LOADING */}
        {!analysisData && (
          <div className="mb-12 animate-in fade-in duration-500">
            <label
              className={`w-full rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${loading ? "border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 cursor-default" : "border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-slate-800/80 shadow-sm hover:shadow-md cursor-pointer"}`}
              style={{ minHeight: "360px" }}
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
                <div className="text-center p-10 flex flex-col items-center group">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 text-4xl text-slate-400 dark:text-slate-500 transition-transform group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 dark:group-hover:text-indigo-400">
                    📸
                  </div>
                  <span className="text-slate-800 dark:text-white font-black text-2xl tracking-tight mb-2">
                    Tải ảnh mẫu vật lên
                  </span>
                  <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                    Hỗ trợ định dạng JPG, PNG. Có thể quét nhiều tờ tiền cùng
                    lúc.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full h-full p-8">
                  {loading && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 animate-[pulse_1.5s_ease-in-out_infinite] z-20"></div>
                  )}
                  <div className="flex gap-6 flex-wrap justify-center items-center relative w-full flex-1">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={src}
                          alt="Preview"
                          className={`h-56 w-auto object-contain rounded-2xl shadow-xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-800 transition-all ${loading ? "opacity-75 grayscale-[30%]" : "hover:scale-105"}`}
                        />
                        {loading && (
                          <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl animate-pulse"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  {loading && (
                    <div className="mt-8 text-center animate-in slide-in-from-bottom-4">
                      <div className="inline-flex bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-6 py-3 rounded-full font-bold shadow-lg items-center gap-3 border border-slate-100 dark:border-slate-700">
                        <div className="w-5 h-5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        Đang phân tích cấu trúc...
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-3">
                        Tiến trình: {taskId?.split("-")[0]} - Bạn có thể chuyển
                        trang, hệ thống vẫn đang chạy.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </label>

            {previews.length > 0 && !loading && (
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleAnalyze}
                  className="px-10 py-4 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/30 hover:-translate-y-1 transition-all flex items-center gap-3 text-lg"
                >
                  <span>🚀</span> TIẾN HÀNH PHÂN TÍCH ({previews.length} ẢNH)
                </button>
              </div>
            )}
          </div>
        )}

        {/* NẾU CÓ KẾT QUẢ -> HIỂN THỊ BÁO CÁO VÀ NÚT LÀM MỚI */}
        {analysisData && (
          <div className="animate-in slide-in-from-bottom-8 duration-700">
            <div
              ref={reportRef}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative mb-10"
            >
              <button
                id="btn-export-pdf"
                onClick={exportPDF}
                className="absolute top-8 right-8 px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-xl text-sm z-10 hover:-translate-y-1 transition-all shadow-lg flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  ></path>
                </svg>{" "}
                Lưu PDF
              </button>

              <div className="p-8 md:p-14 lg:p-20">
                <div className="border-b-2 border-slate-100 dark:border-slate-800 pb-10 mb-12">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    CHỨNG THƯ GIÁM ĐỊNH
                  </h2>
                  <p className="text-slate-500 font-medium mt-3">
                    Xác thực bởi Trí tuệ Nhân tạo đa tác nhân.
                  </p>
                </div>

                {/* HIỂN THỊ LẠI ẢNH MẪU VẬT ĐỂ LƯU VÀO PDF */}
                <div className="mb-12">
                  <h4 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span>📸</span> Hình ảnh Mẫu vật
                  </h4>
                  <div className="flex gap-4 flex-wrap items-center">
                    {previews.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`Mẫu vật ${idx + 1}`}
                        className="max-h-64 w-auto object-contain rounded-2xl shadow-md border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2"
                      />
                    ))}
                  </div>
                </div>

                {(analysisData.results || analysisData.data || []).map(
                  (item, index) => {
                    const resultItem = item.analysis ? item.analysis : item;
                    return (
                      <div key={index} className="mb-20 last:mb-0">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-10 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/50 mb-10 relative shadow-md">
                          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                          <h4 className="text-indigo-900 dark:text-indigo-300 font-black text-sm uppercase mb-6 tracking-widest flex items-center gap-3">
                            KẾT LUẬN CHÍNH THỨC
                          </h4>
                          <div className="prose prose-lg dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                            <ReactMarkdown>
                              {resultItem.final_report}
                            </ReactMarkdown>
                          </div>

                          <div className="mt-10 pt-6 border-t border-indigo-200/50 dark:border-indigo-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 italic">
                              🤖 Kết quả này có chính xác không?
                            </span>
                            <div className="flex gap-3">
                              <button
                                onClick={() =>
                                  handleFeedback(true, resultItem.final_report)
                                }
                                className="px-5 py-2.5 bg-white dark:bg-slate-900 text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold shadow-sm border border-emerald-100 dark:border-emerald-800 transition-all"
                              >
                                👍 Rất Chuẩn
                              </button>
                              <button
                                onClick={() =>
                                  handleFeedback(false, resultItem.final_report)
                                }
                                className="px-5 py-2.5 bg-white dark:bg-slate-900 text-rose-500 hover:bg-rose-50 rounded-xl font-bold shadow-sm border border-rose-100 dark:border-rose-800 transition-all"
                              >
                                👎 Bị Sai Rồi
                              </button>
                            </div>
                          </div>
                        </div>

                        <h4 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <span>🛠️</span> Dữ liệu thô (Raw Data)
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div>
                            <div className="bg-slate-800 text-slate-200 text-xs py-3 px-5 rounded-t-2xl font-bold font-mono">
                              Trọng tài Logic
                            </div>
                            {renderJsonData(resultItem.groq)}
                          </div>
                          <div>
                            <div className="bg-slate-800 text-slate-200 text-xs py-3 px-5 rounded-t-2xl font-bold font-mono">
                              Chuyên gia Ngữ nghĩa
                            </div>
                            {renderJsonData(resultItem.openrouter)}
                          </div>
                          <div>
                            <div className="bg-slate-800 text-slate-200 text-xs py-3 px-5 rounded-t-2xl font-bold font-mono">
                              Phân tích Vật lý
                            </div>
                            {renderJsonData(resultItem.gemini)}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* NÚT LÀM MỚI (SCAN TIẾP) SAU KHI CÓ KẾT QUẢ */}
            <div className="flex justify-center mt-8">
              <button
                onClick={handleReset}
                className="px-10 py-5 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-black rounded-2xl shadow-xl hover:shadow-indigo-500/20 border-2 border-indigo-100 dark:border-indigo-900/50 hover:-translate-y-1 transition-all flex items-center gap-3 text-lg"
              >
                <span className="text-2xl">📸</span> GIÁM ĐỊNH ẢNH MỚI
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default Dashboard;
