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
      const params = new URLSearchParams();
      params.append("username", formData.username);
      params.append("password", formData.password);

      const response = await axiosClient.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("username", response.data.username);

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Sai tên đăng nhập hoặc mật khẩu!",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await axiosClient.get("/auth/google/login");
      window.location.href = response.data.url;
    } catch (error) {
      alert("Không thể kết nối với Google lúc này.");
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-left { animation: slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="min-h-screen flex font-sans bg-white overflow-hidden animate-slide-in-left">
        {/* CỘT TRÁI - FORM ĐĂNG NHẬP */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 text-3xl mb-6 shadow-inner">
                👋
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
                Mừng bạn trở lại
              </h2>
              <p className="text-slate-500 font-medium text-lg">
                Đăng nhập để tiếp tục quản lý chứng thư
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-bold flex items-center gap-3 animate-pulse shadow-sm">
                <span className="text-xl">⚠️</span> {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              className="w-full mb-8 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 text-slate-700 font-bold py-4 px-4 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm active:scale-95 group"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5 group-hover:scale-110 transition-transform"
              />
              Tiếp tục với Google
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-white px-2">
                Hoặc tài khoản
              </span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Email / Tên đăng nhập
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                  placeholder="Nhập thông tin của bạn..."
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Mật khẩu
                  </label>
                  {/* GIỮ LẠI NÚT QUÊN MẬT KHẨU TẠI ĐÂY */}
                  <Link
                    to="/forgot-password"
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black text-white tracking-wide transition-all duration-300 mt-2 ${
                  loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-xl shadow-indigo-500/30 hover:-translate-y-1"
                }`}
              >
                {loading ? "ĐANG XÁC THỰC..." : "ĐĂNG NHẬP"}
              </button>
            </form>

            <p className="mt-10 text-center text-slate-500 font-medium">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-indigo-600 font-black hover:underline px-1"
              >
                Tạo mới ngay
              </Link>
            </p>
          </div>
        </div>

        {/* CỘT PHẢI - GIAO DIỆN THƯƠNG HIỆU */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 items-center justify-center relative overflow-hidden p-12">
          {/* Hiệu ứng nền */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-600/30 to-purple-600/30 rounded-full blur-[120px] transform translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/20 to-blue-600/20 rounded-full blur-[100px] transform -translate-x-1/3 translate-y-1/3"></div>

          <div className="relative z-10 w-full max-w-lg">
            {/* Thẻ Glassmorphism mờ mờ */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-cyan-400 rounded-2xl shadow-lg flex items-center justify-center text-4xl mb-8 transform -rotate-6">
                🛡️
              </div>
              <h3 className="text-4xl font-black text-white mb-4 leading-tight">
                An toàn <br />
                <span className="text-indigo-300">Bảo mật tuyệt đối</span>
              </h3>
              <p className="text-slate-300 text-lg leading-relaxed">
                Hệ thống Banknote AI sử dụng cơ chế mã hóa đầu cuối. Mọi dữ liệu
                hình ảnh giám định của bạn được bảo vệ nghiêm ngặt trên nền tảng
                đám mây.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-slate-800"></div>
                  <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-slate-800"></div>
                  <div className="w-10 h-10 rounded-full bg-slate-400 border-2 border-slate-800"></div>
                </div>
                <p className="text-sm font-bold text-slate-400">
                  Hơn 5,000+ chuyên gia tin dùng
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
