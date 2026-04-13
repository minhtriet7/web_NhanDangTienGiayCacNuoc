import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Nhập Email, 2: Nhập OTP & Pass mới
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // BƯỚC 1: YÊU CẦU GỬI OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await axiosClient.post("/auth/forgot-password", { email });
      setStep(2);
      alert("Đã tạo mã OTP! Vui lòng xem ở màn hình Terminal Backend (Màn hình code đen).");
    } catch (err) {
      setError(err.response?.data?.detail || "Có lỗi xảy ra");
    } finally { setLoading(false); }
  };

  // BƯỚC 2: XÁC NHẬN ĐỔI MẬT KHẨU
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if(newPassword.length < 6) return setError("Mật khẩu phải có ít nhất 6 ký tự");
    
    setLoading(true); setError(null);
    try {
      await axiosClient.post("/auth/reset-password", { email, otp, new_password: newPassword });
      alert("🎉 Đổi mật khẩu thành công! Hãy đăng nhập lại.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Mã OTP sai");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50 items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🔐</div>
          <h2 className="text-3xl font-extrabold text-slate-900">Khôi phục mật khẩu</h2>
          <p className="text-slate-500 font-medium mt-2">Hệ thống sẽ cấp lại quyền truy cập cho bạn</p>
        </div>

        {error && <div className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-xl font-bold text-sm">⚠️ {error}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email tài khoản của bạn</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="nguyenvana@gmail.com" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg">{loading ? "Đang xử lý..." : "Gửi mã xác nhận"}</button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-right duration-300">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mã OTP (Xem ở Terminal)</label>
              <input type="text" required value={otp} onChange={e=>setOtp(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-center font-black tracking-widest text-lg focus:border-indigo-500" placeholder="123456" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu mới</label>
              <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg">{loading ? "Đang xác thực..." : "Xác nhận đổi mật khẩu"}</button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="text-slate-500 font-bold hover:text-indigo-600">← Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;