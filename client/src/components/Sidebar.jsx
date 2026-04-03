import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  // Lấy tên user từ localStorage, nếu không có thì để mặc định là admin
  const username = localStorage.getItem("username") || "admin"; 

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Giám Định", icon: "🔍" },
    { path: "/history", label: "Lịch Sử Dữ Liệu", icon: "🗄️" },
  ];

  return (
    <div className="w-72 h-screen sticky top-0 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20">
      
      {/* KHU VỰC LOGO & USER INFO */}
      <div className="p-8 border-b border-slate-800/80">
        <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-wider">
          <span className="text-3xl drop-shadow-md">🕵️‍♂️</span> 
          GIÁM ĐỊNH AI
        </h2>
        <div className="mt-4 inline-flex items-center gap-2 bg-slate-800/50 py-1.5 px-3 rounded-lg border border-slate-700/50">
          <span className="animate-wave inline-block origin-[70%_70%]">👋</span> 
          <span className="text-sm font-medium">Xin chào,</span>
          <span className="text-emerald-400 font-bold tracking-wide">{username}</span>
        </div>
      </div>

      {/* KHU VỰC MENU ĐIỀU HƯỚNG */}
      <div className="flex-1 py-8 px-5 flex flex-col gap-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30 translate-x-1"
                  : "hover:bg-slate-800 hover:text-white hover:translate-x-1"
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* KHU VỰC ĐĂNG XUẤT */}
      <div className="p-6 border-t border-slate-800/80 mb-4">
        <button
          onClick={handleLogout}
          className="w-full flex justify-center items-center gap-3 bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white py-4 rounded-2xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/30 group active:scale-95"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">🚪</span> 
          <span className="tracking-widest uppercase text-sm">Đăng Xuất</span>
        </button>
      </div>

    </div>
  );
}

export default Sidebar;