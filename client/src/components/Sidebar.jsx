import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ role: "user", full_name: "Đang tải...", username: "...", avatar_url: "" });
  const [imgError, setImgError] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 1. Kích hoạt Dark Mode từ localStorage
    if (localStorage.getItem('theme') === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    // 2. Lấy thông tin User và Avatar
    axiosClient.get("/auth/me")
      .then(res => {
        setUser(res.data);
        localStorage.setItem("username", res.data.username);
      })
      .catch(err => console.log("Lỗi tải thông tin user"));
  }, []);

  // 3. Hàm xử lý nút bấm Sáng/Tối
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
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("username");
      navigate("/");
    }
  };

  const menuItems = [
    { path: "/dashboard", name: "Giám định AI", icon: "🔮" },
    { path: "/history", name: "Hồ sơ Dữ liệu", icon: "🗄️" },
    { path: "/topup", name: "Nạp Token", icon: "💳" },
  ];

  return (
    // Giao diện Sáng là Trắng, Tối là Đen sẫm
    <div className="w-64 bg-white dark:bg-slate-950 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 shadow-xl z-20 transition-colors duration-300">
      
      {/* PHẦN TRÊN: LOGO VÀ MENU */}
      <div>
        <div className="h-24 flex items-center justify-center border-b border-slate-200 dark:border-slate-800/50 px-6">
          <Link to="/dashboard" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 tracking-wider flex items-center gap-2 transition-all hover:scale-105">
            <span className="text-3xl">🏦</span> Banknote
          </Link>
        </div>

        <div className="p-4 flex flex-col gap-2 mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${
                  isActive 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transform translate-x-1" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span className="text-xl">{item.icon}</span> {item.name}
              </Link>
            );
          })}
          
          {/* NÚT QUẢN TRỊ VIÊN */}
          {user.role === "admin" && (
            <Link 
              to="/admin" 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 mt-4 border ${
                location.pathname === "/admin" 
                ? "bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/30" 
                : "border-yellow-200 dark:border-yellow-500/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
              }`}
            >
              <span className="text-xl">👑</span> Quản trị viên
            </Link>
          )}
        </div>
      </div>

      {/* PHẦN DƯỚI: ĐỔI MÀU, PROFILE VÀ LOGOUT */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-md">
        
        {/* Nút Đổi Sáng/Tối */}
        <button 
          onClick={toggleTheme} 
          className="w-full flex items-center justify-between px-4 py-3 mb-4 rounded-xl font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
        >
          <span>Chế độ giao diện</span>
          <span className="text-xl">{isDark ? "🌙" : "☀️"}</span>
        </button>

        {/* Profile User */}
        <Link to="/profile" className="flex items-center gap-3 px-3 py-3 mb-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm">
          
          {/* Xử lý ảnh Avatar 3 lớp (URL -> Gravatar -> Chữ cái) */}
          {user.avatar_url && !imgError ? (
             <img 
               src={user.avatar_url} 
               alt="Avatar" 
               onError={() => setImgError(true)} 
               className="w-10 h-10 rounded-full border-2 border-indigo-200 dark:border-indigo-500/50 shadow-md group-hover:scale-110 transition-transform" 
             />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-inner group-hover:scale-110 transition-transform">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </div>
          )}

          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.full_name}</p>
            <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium hover:underline truncate">@{user.username}</p>
          </div>
        </Link>

        {/* Nút Đăng xuất */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 rounded-xl font-bold transition-all duration-300 group border border-slate-200 dark:border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 shadow-sm">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default Sidebar;