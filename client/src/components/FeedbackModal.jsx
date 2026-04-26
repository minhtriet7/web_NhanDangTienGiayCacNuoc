import React, { useState } from "react";

export default function FeedbackModal({ isOpen, onClose, onSubmit, aiResultText }) {
  const [correction, setCorrection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!correction.trim()) {
      alert("Vui lòng nhập nội dung đính chính để giúp AI học hỏi!");
      return;
    }
    
    setIsSubmitting(true);
    await onSubmit(correction);
    setIsSubmitting(false);
    setCorrection(""); // Clear input sau khi gửi
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-rose-500/10 text-7xl">👎</div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center text-xl shadow-md">
              💡
            </div>
            <div>
              <h3 className="font-black text-rose-700 text-xl">Báo cáo kết quả sai</h3>
              <p className="text-xs text-rose-500 font-medium mt-0.5">Giúp AI thông minh hơn ở những lần sau</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-rose-400 hover:bg-rose-200/50 w-8 h-8 flex items-center justify-center rounded-full transition-colors relative z-10"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Kết luận hiện tại của AI:</span>
            <p className="text-sm text-slate-600 line-clamp-2">{aiResultText || "Không rõ..."}</p>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">
              Theo bạn, kết quả đúng phải là gì? <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder="VD: Đây là tờ 5000 VNĐ và 2000 VNĐ, không phải tiền Nepal..."
              className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none bg-slate-50 focus:bg-white min-h-[120px] shadow-inner"
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md hover:shadow-rose-500/30 transition-all flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang gửi...
              </>
            ) : (
              <>
                <span>📤</span> Gửi đính chính
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}