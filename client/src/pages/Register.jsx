import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      return setError("Mật khẩu nhập lại không khớp!");
    }
    if (formData.password.length < 6) {
      return setError("Mật khẩu phải có ít nhất 6 ký tự!");
    }

    setLoading(true);
    try {
      await axiosClient.post("/auth/register", {
        full_name: formData.full_name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      alert("🎉 Đăng ký thành công! Bạn được tặng 5 Token.");
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Đăng ký thất bại, vui lòng thử lại!",
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
      alert("Không thể kết nối với Google.");
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="min-h-screen flex font-sans bg-white overflow-hidden animate-slide-in-right">
        {/* CỘT TRÁI - GIAO DIỆN THƯƠNG HIỆU (ĐẢO CHIỀU VỚI LOGIN) */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 items-center justify-center relative overflow-hidden p-12">
          {/* Hiệu ứng nền khác màu một chút */}
          <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-[120px] transform -translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-indigo-600/20 to-blue-600/20 rounded-full blur-[100px] transform translate-x-1/3 translate-y-1/3"></div>

          <div className="relative z-10 w-full max-w-lg">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl shadow-lg flex items-center justify-center text-4xl mb-8 transform rotate-6">
                🎁
              </div>
              <h3 className="text-4xl font-black text-white mb-4 leading-tight">
                Khởi tạo <br />
                <span className="text-emerald-300">Không gian làm việc</span>
              </h3>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                Tham gia mạng lưới Banknote AI ngay hôm nay. Trải nghiệm sức
                mạnh của 3 siêu trí tuệ nhân tạo quy tụ trong một hệ thống duy
                nhất.
              </p>

              <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-xl text-xl font-black">
                  5
                </div>
                <div>
                  <p className="text-white font-bold">Quà tặng Tân thủ</p>
                  <p className="text-slate-400 text-sm">
                    Nhận ngay 5 Token giám định
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI - FORM ĐĂNG KÝ */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
          <div className="w-full max-w-lg">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
                Tạo tài khoản mới
              </h2>
              <p className="text-slate-500 font-medium text-lg">
                Chỉ mất 30 giây để bắt đầu
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
              Đăng ký nhanh bằng Google
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-white px-2">
                Hoặc dùng Email
              </span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                    placeholder="nguyenvana"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nhập lại mật khẩu
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black text-white tracking-wide transition-all duration-300 mt-4 ${
                  loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-xl shadow-emerald-500/30 hover:-translate-y-1"
                }`}
              >
                {loading ? "ĐANG KHỞI TẠO..." : "TẠO TÀI KHOẢN"}
              </button>
            </form>

            <p className="mt-8 text-center text-slate-500 font-medium">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="text-indigo-600 font-black hover:underline px-1"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Register;
