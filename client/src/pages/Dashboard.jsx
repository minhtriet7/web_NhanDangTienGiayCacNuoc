import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import axiosClient from "../api/axiosClient";
import { jsPDF } from "jspdf";
import { toJpeg } from "html-to-image";
import FeedbackModal from "../components/FeedbackModal";
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
  const [feedbackConfig, setFeedbackConfig] = useState({
    isOpen: false,
    aiResultText: "",
    taskId: "",
  });
  const [loadingText, setLoadingText] = useState("Đang khởi tạo hệ thống...");
  const pollIntervalRef = useRef(null);
  const reportRef = useRef();

  // <--- THÊM ĐOẠN NÀY ĐỂ QUẢN LÝ FEEDBACK MODAL --->

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

  useEffect(() => {
    let interval;
    if (loading) {
      const steps = [
        "Khởi động hệ thống Đa tác nhân (Multi-Agent)...",
        "👁️ Chuyên gia Tổng quan: Đang phân tích màu sắc và nghệ thuật...",
        "🔍 Chuyên gia Chi tiết: Đang đọc chữ siêu nhỏ và bảo an...",
        "🛡️ Chuyên gia Phản biện: Đang tìm kiếm điểm bất thường...",
        "⚡ Các AI đang tiến hành đối chiếu và tranh biện chéo...",
        "⚖️ Trọng tài: Đang tổng hợp báo cáo cuối cùng...",
      ];
      let i = 0;
      setLoadingText(steps[0]);
      interval = setInterval(() => {
        i++;
        if (i < steps.length) {
          setLoadingText(steps[i]);
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

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
    } catch (err) {
      alert("Lỗi xuất: " + err.message);
    } finally {
      if (btn) btn.innerHTML = "📥 Lưu PDF";
    }
  };

  const handleFeedback = async (isCorrect, aiResultText) => {
    try {
      if (isCorrect) {
        // Nếu chọn "Rất Chuẩn", gửi API ngay lập tức như cũ
        await axiosClient.post("/analyze/feedback", {
          task_id: taskId || "unknown",
          ai_result: aiResultText,
          is_correct: true,
        });
        alert("Cảm ơn bạn đã xác nhận!");
      } else {
        // ĐÃ FIX: Không dùng prompt() cùi bắp nữa, mà bật cái Feedback Modal tuyệt đẹp lên
        setFeedbackConfig({
          isOpen: true,
          aiResultText: aiResultText,
          taskId: taskId || "unknown",
        });
      }
    } catch (error) {
      console.error("Lỗi gửi feedback", error);
    }
  };

  // Hàm này sẽ được gọi khi người dùng bấm nút "Gửi đính chính" bên trong Modal
  const submitCorrection = async (correctionText) => {
    try {
      await axiosClient.post("/analyze/feedback", {
        task_id: feedbackConfig.taskId,
        ai_result: feedbackConfig.aiResultText,
        is_correct: false,
        user_correction: correctionText,
      });
      // Tắt modal và báo thành công
      setFeedbackConfig({ ...feedbackConfig, isOpen: false });
      alert("Cảm ơn bạn! Đã ghi nhận đóng góp để cải thiện hệ thống AI.");
    } catch (error) {
      console.error("Lỗi gửi đính chính", error);
      alert("Có lỗi xảy ra khi gửi dữ liệu.");
    }
  };

  const formatCurrency = (amountString) => {
    if (
      !amountString ||
      amountString === "N/A" ||
      amountString === "Không xác định"
    )
      return amountString || "N/A";
    const str = String(amountString);
    const numericMatch = str.match(/\d+/g);
    const textMatch = str.match(/[A-Za-z₫$€¥£]+/g);
    if (!numericMatch) return str;
    const numericAmount = parseInt(numericMatch.join(""), 10);
    const formattedNumber = new Intl.NumberFormat("vi-VN").format(
      numericAmount,
    );
    const currencyCode = textMatch ? textMatch.join("") : "";
    return currencyCode
      ? `${formattedNumber} ${currencyCode}`
      : formattedNumber;
  };

  // HÀM CHỐNG CRASH KHI PARSE JSON (Rất an toàn)
  const safeParseArray = (jsonString) => {
    if (!jsonString) return [];
    try {
      const parsed =
        typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      // Nếu lỗi JSON, tạo ra 1 object chứa lỗi để Card hiển thị rõ lỗi của AI
      console.error("Lỗi khi parse JSON từ AI:", e);
      return [{ error: `Dữ liệu lỗi từ AI:\n${jsonString}` }];
    }
  };

  // VẼ THẺ BÀI CHUYÊN GIA
  const renderExpertCard = (title, dotColor, data) => {
    if (!data)
      return (
        <div className="p-4 border rounded-xl text-slate-400 text-sm">
          Trống
        </div>
      );

    // Nếu AI trả về lỗi Debate (ví dụ: bị chặn 429) -> In màu đỏ
    if (data.error) {
      return (
        <div className="border border-rose-200 rounded-[2rem] p-6 bg-rose-50/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm animate-pulse"></div>
            <h4 className="font-bold text-rose-700 text-lg">{title}</h4>
          </div>
          <div className="text-rose-600 text-xs font-mono whitespace-pre-wrap overflow-hidden">
            {data.error}
          </div>
        </div>
      );
    }

    const dotColors = {
      emerald: "bg-emerald-400",
      purple: "bg-purple-400",
      orange: "bg-orange-400",
    };

    return (
      <div className="border border-slate-200 rounded-[2rem] p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-4 h-4 rounded-full ${dotColors[dotColor] || "bg-indigo-400"} shadow-sm`}
          ></div>
          <h4 className="font-bold text-slate-800 text-lg">{title}</h4>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="text-blue-500 text-base">🌎</span> QUỐC GIA
            </span>
            <span className="text-slate-800 font-medium text-right w-1/2 break-words">
              {data.quoc_gia || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="text-emerald-500 text-base">💵</span> MỆNH GIÁ
            </span>
            <span className="text-indigo-600 font-bold text-right w-1/2 break-words">
              {formatCurrency(data.menh_gia)}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="text-indigo-400 text-base">🗓️</span> NĂM
            </span>
            <span className="text-slate-800 font-medium">
              {data.nam_phat_hanh || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="text-amber-500 text-base">🏷️</span> CHẤT LIỆU
            </span>
            <span className="text-slate-800 font-medium text-right w-1/2 break-words">
              {data.chat_lieu || "N/A"}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Lập luận phân tích:
          </h5>
          <p className="text-xs text-slate-600 mb-2 leading-relaxed">
            <strong className="text-slate-800">Mặt trước:</strong>{" "}
            {data.mat_truoc}
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Mặt sau:</strong> {data.mat_sau}
          </p>
        </div>
      </div>
    );
  };

  // ĐÃ FIX TẬN GỐC TẠI ĐÂY: Hàm bóc vỏ dữ liệu thông minh
  const getFilesResults = () => {
    if (!analysisData) return [];

    // Nếu Backend trả về dạng Mảng [ {final_report, chuyen_gia...} ]
    if (Array.isArray(analysisData)) return analysisData;

    // Nếu Backend bọc trong biến "results"
    if (analysisData.results) {
      return Array.isArray(analysisData.results)
        ? analysisData.results
        : [analysisData.results];
    }

    // Nếu Backend bọc trong biến "data"
    if (analysisData.data) {
      return Array.isArray(analysisData.data)
        ? analysisData.data
        : [analysisData.data];
    }

    // Nếu là dạng Object phẳng { final_report, chuyen_gia... }
    return [analysisData];
  };

  return (
    <div className="font-sans text-slate-800 bg-[#F8FAFC] min-h-screen transition-colors duration-300 pb-16">
      <OnboardingModal />
      <ReportBugModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
      />
      {/* <--- NHÚNG FEEDBACK MODAL VÀO ĐÂY ---> */}
      <FeedbackModal
        isOpen={feedbackConfig.isOpen}
        onClose={() => setFeedbackConfig({ ...feedbackConfig, isOpen: false })}
        onSubmit={submitCorrection}
        aiResultText={feedbackConfig.aiResultText}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Giám định AI
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Hệ thống phân tích và nhận diện tự động
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
            <button
              onClick={() => setIsBugModalOpen(true)}
              className="px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-xl font-bold text-sm transition-colors flex items-center gap-1"
            >
              <span>⚠️</span> Hỗ trợ
            </button>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="px-4 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                Số dư khả dụng
              </p>
              <p className="text-xl font-black text-slate-800 leading-none">
                {tokenBalance}{" "}
                <span className="text-sm font-bold text-amber-500">🪙</span>
              </p>
            </div>
            <Link
              to="/topup"
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md text-sm hover:-translate-y-0.5"
            >
              Nạp Thêm
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl mb-8 flex items-center gap-4 animate-in fade-in">
            <span className="text-2xl">⚠️</span>
            <div className="text-rose-700 font-medium text-sm">{error}</div>
          </div>
        )}

        {/* TRẠNG THÁI LOADING & UPLOAD */}
        {!analysisData && (
          <div className="mb-12 animate-in fade-in duration-500">
            <label
              className={`w-full rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${loading ? "border-2 border-slate-200 bg-slate-50 cursor-default" : "border-2 border-dashed border-slate-300 bg-white hover:bg-indigo-50/50 shadow-sm hover:shadow-md cursor-pointer"}`}
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
                  <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 text-4xl transition-transform group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-500">
                    📸
                  </div>
                  <span className="text-slate-800 font-black text-2xl tracking-tight mb-2">
                    Tải ảnh mẫu vật lên
                  </span>
                  <p className="text-slate-500 text-sm font-medium">
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
                          className={`h-56 w-auto object-contain rounded-2xl shadow-xl border-4 border-white bg-white transition-all ${loading ? "opacity-75 grayscale-[30%]" : "hover:scale-105"}`}
                        />
                        {loading && (
                          <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl animate-pulse"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {loading && (
                    <div className="mt-8 text-center animate-in slide-in-from-bottom-4 w-full max-w-2xl">
                      <div className="bg-slate-900 text-emerald-400 font-mono text-sm px-6 py-4 rounded-2xl shadow-lg border border-slate-700 flex items-center justify-start gap-4">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-left w-full truncate">
                          {loadingText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-3">
                        Tiến trình ID: {taskId?.split("-")[0]} - Không cần làm
                        mới trang.
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

        {/* HIỂN THỊ BÁO CÁO */}
        {analysisData && (
          <div className="animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-end mb-4">
              <button
                id="btn-export-pdf"
                onClick={exportPDF}
                className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm hover:-translate-y-1 transition-all shadow-lg flex items-center gap-2"
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
                </svg>
                Lưu PDF
              </button>
            </div>

            <div
              ref={reportRef}
              className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden relative mb-10 p-8 md:p-14"
            >
              <div className="border-b border-slate-100 pb-8 mb-10 text-center">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                  CHỨNG THƯ GIÁM ĐỊNH
                </h2>
                <p className="text-slate-500 font-medium mt-3">
                  Xác thực bởi Trí tuệ Nhân tạo đa tác nhân.
                </p>
              </div>

              <div className="mb-12 text-center">
                <div className="flex gap-4 flex-wrap items-center justify-center">
                  {previews.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`Mẫu vật ${idx + 1}`}
                      className="max-h-64 w-auto object-contain rounded-2xl shadow-sm border border-slate-100 bg-slate-50 p-2"
                    />
                  ))}
                </div>
              </div>

              {/* QUÉT QUA TỪNG FILE ĐƯỢC XỬ LÝ */}
              {getFilesResults().map((fileData, fileIndex) => {
                // Lọc dữ liệu tránh trường hợp backend bọc thêm class 'analysis'
                const actualData = fileData.analysis
                  ? fileData.analysis
                  : fileData;
                const finalReportStr = actualData.final_report || "";

                // Chuyển string của 3 chuyên gia thành Array
                const exp1Array = safeParseArray(
                  actualData.chuyen_gia_1 || actualData.gemini,
                );
                const exp2Array = safeParseArray(
                  actualData.chuyen_gia_2 || actualData.openrouter,
                );
                const exp3Array = safeParseArray(
                  actualData.chuyen_gia_3 || actualData.groq,
                );

                // Xem AI đếm được bao nhiêu tờ tiền (Lấy mảng dài nhất)
                const maxLength = Math.max(
                  exp1Array.length,
                  exp2Array.length,
                  exp3Array.length,
                );

                return (
                  <div
                    key={fileIndex}
                    className="mb-16 border-b-4 border-slate-100 pb-16 last:border-0 last:pb-0"
                  >
                    {/* BÁO CÁO CỦA TRỌNG TÀI TỔNG HỢP CHO FILE NÀY */}
                    {finalReportStr && (
                      <div className="bg-emerald-50/50 border border-emerald-100 p-10 rounded-[2rem] mb-12 relative shadow-inner">
                        <h4 className="text-emerald-700 font-black text-lg mb-6 flex items-center gap-3">
                          <span className="text-2xl">⚖️</span> KẾT LUẬN CHÍNH
                          THỨC (TỪ TRỌNG TÀI)
                        </h4>
                        <div className="prose prose-slate max-w-none text-slate-800 font-medium leading-relaxed">
                          <ReactMarkdown>{finalReportStr}</ReactMarkdown>
                        </div>

                        <div
                          className="mt-8 pt-6 border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4"
                          data-html2canvas-ignore
                        >
                          <span className="text-sm font-bold text-emerald-800 italic">
                            🤖 Kết quả tổng hợp này có chính xác không?
                          </span>
                          <div className="flex gap-3">
                            <button
                              onClick={() =>
                                handleFeedback(true, finalReportStr)
                              }
                              className="px-5 py-2.5 bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold shadow-sm border border-emerald-200 transition-all"
                            >
                              👍 Rất Chuẩn
                            </button>
                            <button
                              onClick={() =>
                                handleFeedback(false, finalReportStr)
                              }
                              className="px-5 py-2.5 bg-white text-rose-500 hover:bg-rose-50 rounded-xl font-bold shadow-sm border border-rose-200 transition-all"
                            >
                              👎 Bị Sai Rồi
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VÒNG LẶP IN CHI TIẾT TỪNG TỜ TIỀN CỦA 3 CHUYÊN GIA */}
                    <div className="mt-12">
                      <h4 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <span>⚡</span> Chi tiết báo cáo độc lập từng đối tượng
                      </h4>

                      {maxLength === 0 ? (
                        <p className="text-slate-500 italic p-4 bg-slate-50 rounded-xl">
                          Không có dữ liệu chi tiết. Vui lòng quét lại.
                        </p>
                      ) : (
                        [...Array(maxLength)].map((_, i) => {
                          const data1 = exp1Array[i] || null;
                          const data2 = exp2Array[i] || null;
                          const data3 = exp3Array[i] || null;

                          return (
                            <div
                              key={i}
                              className="mb-16 last:mb-0 border-b-2 border-slate-100 border-dashed pb-12 last:border-0 last:pb-0"
                            >
                              <div className="inline-flex bg-indigo-50 border border-indigo-100 text-indigo-700 font-black px-6 py-3 rounded-2xl mb-8 text-sm items-center gap-2">
                                <span>💵</span> ĐỐI TƯỢNG GIÁM ĐỊNH #{i + 1}
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {renderExpertCard(
                                  "Chuyên gia Tổng quan",
                                  "emerald",
                                  data1,
                                )}
                                {renderExpertCard(
                                  "Chuyên gia Chi tiết",
                                  "purple",
                                  data2,
                                )}
                                {renderExpertCard(
                                  "Chuyên gia Phản biện",
                                  "orange",
                                  data3,
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={handleReset}
                className="px-10 py-5 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:shadow-indigo-500/20 border-2 border-indigo-50 hover:-translate-y-1 transition-all flex items-center gap-3 text-lg"
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
