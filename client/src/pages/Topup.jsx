import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

function Topup() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [checkoutPkg, setCheckoutPkg] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");

  // State mới cho giao diện thanh toán chi tiết
  const [paymentMethod, setPaymentMethod] = useState("qr"); // 'qr', 'manual', 'momo'
  const [timeLeft, setTimeLeft] = useState(900); // Đếm ngược 15 phút (900s)

  useEffect(() => {
    axiosClient.get("/payment/packages")
      .then(res => setPackages(res.data.packages))
      .catch(err => console.error(err));
  }, []);

  const handleSelectPackage = async (pkg) => {
    setCheckoutPkg(pkg);
    setLoading(true);
    try {
      const response = await axiosClient.post(`/payment/create?amount_vnd=${pkg.price}&tokens_to_add=${pkg.tokens}`);
      setPaymentInfo(response.data);
      setStatus("waiting");
      setTimeLeft(900); // Reset timer
    } catch (error) {
      alert("Lỗi tạo hóa đơn: " + (error.response?.data?.detail || "Vui lòng thử lại"));
      setCheckoutPkg(null);
    } finally { setLoading(false); }
  };

  // Logic Polling quét SePay
  useEffect(() => {
    let intervalId;
    if (status === "waiting" && paymentInfo?.payment_id) {
      intervalId = setInterval(async () => {
        try {
          const res = await axiosClient.get(`/payment/status/${paymentInfo.payment_id}`);
          if (res.data.status === "completed") {
            setStatus("success");
            clearInterval(intervalId);
            setTimeout(() => { navigate("/dashboard"); window.location.reload(); }, 2000);
          }
        } catch (error) {}
      }, 3000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [status, paymentInfo, navigate]);

  // Logic Đếm ngược thời gian
  useEffect(() => {
    let timerId;
    if (status === "waiting" && timeLeft > 0) {
      timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && status === "waiting") {
      setStatus("expired");
    }
    return () => { if (timerId) clearInterval(timerId); };
  }, [status, timeLeft]);

  const handleMockPayment = async () => {
    if (!window.confirm("Sử dụng quyền Dev để bỏ qua thanh toán?")) return;
    try { await axiosClient.post(`/payment/mock-success/${paymentInfo.payment_id}`); } catch (error) { alert("Lỗi giả lập"); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Đã sao chép: " + text);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ==========================================
  // GIAO DIỆN THANH TOÁN CHI TIẾT (CHECKOUT)
  // ==========================================
  if (checkoutPkg) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <button onClick={() => { setCheckoutPkg(null); setStatus("idle"); }} className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
            <span>←</span> Quay lại bảng giá
          </button>

          {status === "expired" ? (
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-xl border border-rose-100 dark:border-rose-900/30">
                <div className="text-6xl mb-4">⏱️</div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Hóa đơn đã hết hạn</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Thời gian thanh toán 15 phút đã kết thúc. Vui lòng tạo hóa đơn mới.</p>
                <button onClick={() => { setCheckoutPkg(null); setStatus("idle"); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">Thử lại</button>
             </div>
          ) : status === "success" ? (
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">✓</div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Thanh toán thành công!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Bạn đã mua thành công gói <strong>{checkoutPkg.name}</strong>. Dữ liệu đang được đồng bộ...</p>
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* CỘT TRÁI: PHƯƠNG THỨC THANH TOÁN */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-800 p-8">
                  <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Thanh toán an toàn</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Chọn phương thức thanh toán phù hợp với bạn</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Thời gian còn lại</p>
                        <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg font-mono font-bold text-lg animate-pulse">
                          {formatTime(timeLeft)}
                        </div>
                     </div>
                  </div>

                  {/* CHỌN PHƯƠNG THỨC */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <button onClick={() => setPaymentMethod("qr")} className={`p-4 rounded-2xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${paymentMethod === "qr" ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                      <span className="text-2xl">📱</span> Quét mã QR
                    </button>
                    <button onClick={() => setPaymentMethod("manual")} className={`p-4 rounded-2xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${paymentMethod === "manual" ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                      <span className="text-2xl">🏦</span> Chuyển thủ công
                    </button>
                    <button disabled className="p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600 font-bold text-sm flex flex-col items-center gap-2 cursor-not-allowed relative overflow-hidden">
                      <span className="text-2xl opacity-50">💳</span> Thẻ Quốc tế
                      <div className="absolute top-2 right-2 bg-slate-200 dark:bg-slate-700 text-[8px] px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">SẮP CÓ</div>
                    </button>
                  </div>

                  {/* HIỂN THỊ DỮ LIỆU THEO PHƯƠNG THỨC */}
                  {paymentMethod === "qr" && paymentInfo && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-700/50 flex flex-col items-center animate-in fade-in">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 text-center">Mở ứng dụng ngân hàng hoặc ví điện tử (MoMo, ZaloPay, VNPay...) và quét mã bên dưới để thanh toán tự động.</p>
                      <div className="bg-white p-4 rounded-3xl shadow-sm border-2 border-dashed border-indigo-100 dark:border-slate-600 relative">
                        <img src={paymentInfo.qr_url} alt="VietQR" className="w-56 h-56 rounded-xl" />
                        {/* Lớp Overlay Scan */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50 rounded-full blur-[2px] animate-[scan_2s_ease-in-out_infinite]"></div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "manual" && paymentInfo && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-700/50 animate-in fade-in">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngân hàng</p>
                            <p className="font-black text-slate-800 dark:text-white">VCB VIETCOMBANK</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số tài khoản</p>
                            <p className="font-black text-indigo-600 dark:text-indigo-400 text-lg tracking-wider">1031506356</p>
                          </div>
                          <button onClick={() => copyToClipboard("0123456789")} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">📋 Copy</button>
                        </div>
                        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chủ tài khoản</p>
                            <p className="font-black text-slate-800 dark:text-white">BANKNOTE AI</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
                          <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Nội dung chuyển khoản (Bắt buộc)</p>
                            <p className="font-black text-rose-500 font-mono text-lg">{paymentInfo.content}</p>
                          </div>
                          <button onClick={() => copyToClipboard(paymentInfo.content)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm">Sao chép</button>
                        </div>
                      </div>
                      <p className="text-xs text-rose-500 mt-4 italic font-medium text-center">⚠️ Lưu ý: Ghi CHÍNH XÁC nội dung chuyển khoản để hệ thống tự động cộng Token sau 30 giây.</p>
                    </div>
                  )}

                  <div className="mt-8 flex items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400 text-sm font-bold bg-indigo-50 dark:bg-indigo-900/10 py-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                    <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div> 
                    Đang chờ nhận tiền...
                  </div>
                  
                  {/* NÚT MOCK THANH TOÁN CHO ĐỒ ÁN */}
                  <div className="mt-4 text-center">
                    <button onClick={handleMockPayment} className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white underline transition-colors">
                      [Dev] Bỏ qua bước thanh toán thực tế
                    </button>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-800 p-8 sticky top-28">
                   <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Tóm tắt đơn hàng</h3>
                   
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-2xl shadow-inner">📦</div>
                      <div>
                         <p className="font-bold text-slate-800 dark:text-white text-lg">Gói {checkoutPkg.name}</p>
                         <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">+{checkoutPkg.tokens} Token</p>
                      </div>
                   </div>

                   <div className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                      <div className="flex justify-between">
                         <span>Tạm tính</span>
                         <span className="text-slate-900 dark:text-white">{paymentInfo?.amount.toLocaleString("vi-VN")}₫</span>
                      </div>
                      <div className="flex justify-between">
                         <span>Thuế VAT (0%)</span>
                         <span className="text-slate-900 dark:text-white">0₫</span>
                      </div>
                      <div className="flex justify-between">
                         <span>Phí giao dịch</span>
                         <span className="text-emerald-500">Miễn phí</span>
                      </div>
                   </div>

                   <div className="flex justify-between items-end mb-8">
                      <span className="font-bold text-slate-500 dark:text-slate-400">Tổng cộng</span>
                      <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                         {paymentInfo?.amount.toLocaleString("vi-VN")}₫
                      </span>
                   </div>

                   {/* Badges Bảo mật */}
                   <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 flex flex-col gap-3 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                         <span className="text-emerald-500">🔒</span> Mã hóa SSL 256-bit
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                         <span className="text-emerald-500">🛡️</span> Thanh toán bảo mật VietQR
                      </div>
                   </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* THÊM CSS CHO HIỆU ỨNG QUÉT MÃ QR */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scan {
            0% { top: 0; }
            50% { top: 100%; }
            100% { top: 0; }
          }
        `}} />
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN BẢNG GIÁ (PRICING GRID)
  // ==========================================
  return (
    <div className="py-20 font-sans bg-[#F9FAFB] dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Tiêu đề */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Nâng cấp hiệu suất</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Hệ thống giám định chạy trên cụm Server AI độc lập. Mua Token một lần, sử dụng vĩnh viễn không giới hạn thời gian.
          </p>
          
          {/* Nút Toggle giả lập tháng/năm cho ngầu */}
          <div className="mt-8 flex justify-center">
            <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-full inline-flex">
               <button className="bg-white dark:bg-slate-600 text-slate-900 dark:text-white px-6 py-2 rounded-full font-bold text-sm shadow-sm">Thanh toán 1 lần</button>
               <button disabled className="text-slate-500 dark:text-slate-400 px-6 py-2 rounded-full font-bold text-sm cursor-not-allowed opacity-50 flex items-center gap-1">Trả góp <span className="bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded text-[8px] uppercase">Khóa</span></button>
            </div>
          </div>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-stretch">
            {packages.map((pkg, index) => {
              const featureList = pkg.features ? pkg.features.split(",") : [];
              const isPopular = pkg.popular;
              return (
                <div key={pkg._id} style={{ animationDelay: `${index * 150}ms` }} className={`rounded-[2.5rem] p-8 flex flex-col h-full relative transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 ${
                    isPopular
                      ? "bg-slate-900 text-white shadow-2xl shadow-indigo-900/20 md:-translate-y-4 dark:bg-slate-900 dark:border-2 dark:border-indigo-500" 
                      : "bg-white text-slate-800 border border-slate-200 shadow-lg dark:bg-slate-900 dark:text-white dark:border-slate-800"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-0 w-full flex justify-center transform -translate-y-1/2">
                      <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-1.5 text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-500/30">⭐ Khuyên Dùng</span>
                    </div>
                  )}

                  <h3 className={`text-2xl font-black tracking-tight mt-4 ${isPopular ? "text-white" : "text-slate-900 dark:text-white"}`}>{pkg.name}</h3>
                  <p className={`text-sm mt-2 font-medium ${isPopular ? "text-slate-400" : "text-slate-500"}`}>Gói tiêu chuẩn cho mọi nhu cầu.</p>

                  <div className="my-8">
                    <span className={`text-5xl font-black tracking-tighter ${isPopular ? "text-white" : "text-slate-900 dark:text-white"}`}>{pkg.price.toLocaleString("vi-VN")}₫</span>
                  </div>

                  <button onClick={() => handleSelectPackage(pkg)} className={`w-full py-4 rounded-2xl font-black text-lg mb-8 transition-all shadow-md active:scale-95 ${
                      isPopular 
                        ? "bg-white text-slate-900 hover:bg-slate-100" 
                        : "bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500"
                    }`}>
                    Bắt đầu nâng cấp
                  </button>

                  <div className="flex-1">
                    <div className={`flex items-center gap-4 mb-8 p-4 rounded-2xl ${isPopular ? "bg-slate-800/80 border border-slate-700" : "bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${isPopular ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"}`}>🪙</div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isPopular ? "text-slate-400" : "text-slate-400"}`}>Cộng ngay vào ví</p>
                        <p className={`font-black text-lg leading-none tracking-tight ${isPopular ? "text-white" : "text-slate-800 dark:text-white"}`}>{pkg.tokens} TOKEN</p>
                      </div>
                    </div>
                    
                    <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isPopular ? "text-slate-400" : "text-slate-400"}`}>Bao gồm các tính năng:</p>
                    <ul className="space-y-4">
                      {featureList.map((feat, i) => (
                        <li key={i} className={`flex items-start gap-3 font-medium text-sm ${isPopular ? "text-slate-300" : "text-slate-600 dark:text-slate-400"}`}>
                          <div className={`rounded-full p-0.5 mt-0.5 ${isPopular ? "text-indigo-400" : "text-emerald-500"}`}>
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                          {feat}
                        </li>
                      ))}
                    </ul>
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

export default Topup;