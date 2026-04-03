import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // FastAPI thường nhận dữ liệu form-urlencoded cho tính năng Login
      const params = new URLSearchParams();
      params.append("username", formData.username);
      params.append("password", formData.password);

      const response = await axiosClient.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // Lưu Token và Tên user vào LocalStorage
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("username", formData.username);
      
      // Chuyển hướng vào trang chính
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Sai tên đăng nhập hoặc mật khẩu!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50 font-sans p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4 text-3xl shadow-inner">
              🔐
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Đăng Nhập</h2>
            <p className="text-slate-500 mt-2">Chào mừng trở lại Hệ thống Giám định AI</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-r-lg text-sm font-medium animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tên đăng nhập</label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                placeholder="Nhập username của bạn..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white tracking-wide transition-all duration-300 shadow-lg ${
                loading
                  ? "bg-indigo-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-indigo-500/30 active:translate-y-0"
              }`}
            >
              {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-slate-600 font-medium">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-indigo-600 font-bold hover:underline hover:text-indigo-800 transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;