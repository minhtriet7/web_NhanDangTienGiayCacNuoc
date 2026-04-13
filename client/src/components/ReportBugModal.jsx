import { useState } from "react";
import axiosClient from "../api/axiosClient";

export default function ReportBugModal({ isOpen, onClose }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Lấy thông tin thiết bị ngầm
    const deviceInfo = `${navigator.userAgent} | Độ phân giải: ${window.screen.width}x${window.screen.height}`;

    try {
      await axiosClient.post("/support/ticket", {
        subject,
        description,
        device_log: deviceInfo
      });
      alert("Đã gửi báo cáo lỗi tới Admin!");
      onClose();
    } catch (err) {
      alert("Lỗi khi gửi báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-lg shadow-xl">
        <h2 className="text-2xl font-black mb-4 dark:text-white">🛠️ Báo cáo sự cố</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">Vấn đề bạn gặp phải</label>
            <input required value={subject} onChange={e => setSubject(e.target.value)} placeholder="VD: App bị văng khi tải ảnh..." className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">Mô tả chi tiết</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} rows="4" placeholder="Mô tả kỹ thao tác bạn vừa làm..." className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800"></textarea>
          </div>
          <p className="text-xs text-slate-400 italic">Hệ thống sẽ tự động đính kèm thông tin Trình duyệt và Máy tính của bạn để Admin xử lý nhanh hơn.</p>
          
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Hủy</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl">{loading ? "Đang gửi..." : "Gửi báo cáo"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}