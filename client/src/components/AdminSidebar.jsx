import { Link, useNavigate, useLocation } from "react-router-dom";

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div className="w-64 bg-slate-900 flex flex-col justify-between h-screen sticky top-0 shadow-2xl z-20">
      <div>
        <div className="h-20 flex items-center justify-center border-b border-slate-800 bg-slate-950">
          <span className="text-xl font-black text-yellow-500 flex items-center gap-2">
            👑 ADMIN PANEL
          </span>
        </div>

        <div className="p-4 flex flex-col gap-2 mt-4">
          <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hệ thống</div>
          
          <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${location.pathname === "/admin" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
            📊 Tổng quan & User
          </Link>
          
          <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Cài đặt</div>
          
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-emerald-400 hover:bg-emerald-900/30 transition-all border border-emerald-900/50">
            ← Trở về Web Khách
          </Link>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <button onClick={handleLogout} className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl font-bold transition-all">
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;