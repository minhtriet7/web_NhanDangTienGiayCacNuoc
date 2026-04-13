import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({ full_name: "", username: "", email: "", token_balance: 0, role: "user", avatar_url: "" });
  const [imgError, setImgError] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Trong Header.jsx
  useEffect(() => {
    const fetchUserData = () => {
      axiosClient.get("/auth/me")
        .then(res => setUser(res.data))
        .catch(err => console.log(err));
    };

    // Gọi lần đầu khi mới load web
    fetchUserData();

    // Lắng nghe loa thông báo từ Dashboard
    window.addEventListener("token_updated", fetchUserData);

    // Dọn dẹp khi rời đi
    return () => {
      window.removeEventListener("token_updated", fetchUserData);
    };
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/dashboard" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 tracking-tight flex items-center gap-2">
          <span className="text-3xl">🔮</span> Banknote AI
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-bold text-slate-600 dark:text-slate-300">
          <Link to="/dashboard" className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${location.pathname === '/dashboard' ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>Giám định</Link>
          <Link to="/history" className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${location.pathname === '/history' ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>Lịch sử</Link>
          <Link to="/topup" className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${location.pathname === '/topup' ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>Bảng giá</Link>
          
          {user.role === "admin" && (
            <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-700/50 rounded-full hover:bg-yellow-100 transition-colors shadow-sm">
              <span>👑</span> Quản trị
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-6">
          <button onClick={toggleTheme} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xl">
            {isDark ? "🌙" : "☀️"}
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
            <span className="text-sm font-bold text-slate-500 dark:text-indigo-300/70">Số dư:</span>
            <span className="font-black text-indigo-700 dark:text-indigo-400">{user.token_balance} 🪙</span>
          </div>
          
          <div className="flex items-center gap-4 group relative cursor-pointer">
            <Link to="/profile" className="flex items-center gap-3">
              {/* ĐÃ THÊM PHẦN HIỂN THỊ TÊN VÀ USERNAME Ở ĐÂY */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none mb-1">
                  {user.full_name || "Người dùng"}
                </p>
                <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium leading-none">
                  @{user.username}
                </p>
              </div>

              {user.avatar_url && !imgError ? (
                <img src={user.avatar_url} alt="Avatar" onError={() => setImgError(true)} className="w-10 h-10 rounded-full border-2 border-indigo-200 dark:border-indigo-600 shadow-md hover:scale-110 transition-transform object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md hover:scale-110 transition-transform">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </Link>
            <button onClick={handleLogout} className="text-sm font-bold text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">Đăng xuất</button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;