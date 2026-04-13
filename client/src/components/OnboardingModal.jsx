import { useState, useEffect } from "react";

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Kiểm tra xem user đã xem hướng dẫn chưa
    const hasSeen = localStorage.getItem("has_seen_onboarding");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("has_seen_onboarding", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative">
        
        {/* Nút bỏ qua */}
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm">Bỏ qua</button>

        <div className="p-8 text-center min-h-[300px] flex flex-col justify-center items-center">
          {step === 1 && (
            <div className="animate-in slide-in-from-right-8">
              <div className="text-6xl mb-4">☀️</div>
              <h3 className="text-2xl font-black mb-2 dark:text-white">Ánh sáng là tất cả</h3>
              <p className="text-slate-500">Hãy chụp tờ tiền ở nơi có đủ ánh sáng, tránh để bóng râm đổ lên bề mặt tiền làm AI bối rối nhé.</p>
            </div>
          )}
          {step === 2 && (
            <div className="animate-in slide-in-from-right-8">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-2xl font-black mb-2 dark:text-white">Góc chụp thẳng</h3>
              <p className="text-slate-500">Giữ điện thoại song song với mặt bàn. Một bức ảnh vuông vức sẽ giúp hệ thống quét chính xác 99%.</p>
            </div>
          )}
          {step === 3 && (
            <div className="animate-in slide-in-from-right-8">
              <div className="text-6xl mb-4">⬛</div>
              <h3 className="text-2xl font-black mb-2 dark:text-white">Nền chụp gọn gàng</h3>
              <p className="text-slate-500">Đặt tờ tiền trên mặt bàn trống, trơn màu. Tránh để lẫn lộn với chìa khóa hay các vật dụng khác.</p>
            </div>
          )}
        </div>

        {/* Nút điều hướng */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <div className="flex gap-2">
            <span className={`w-2 h-2 rounded-full ${step === 1 ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}></span>
            <span className={`w-2 h-2 rounded-full ${step === 2 ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}></span>
            <span className={`w-2 h-2 rounded-full ${step === 3 ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}></span>
          </div>
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Tiếp tục</button>
          ) : (
            <button onClick={handleClose} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold">Bắt đầu ngay</button>
          )}
        </div>
      </div>
    </div>
  );
}