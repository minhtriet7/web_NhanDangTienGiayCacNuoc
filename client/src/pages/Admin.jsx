import { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
// IMPORT THƯ VIỆN BIỂU ĐỒ (Dựa theo log lỗi của bạn là đã có sẵn)
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function Admin() {
  const [activeTab, setActiveTab] = useState("overview");

  // Data States
  const [stats, setStats] = useState({ total_users: 0, total_revenue: 0, total_scans: 0 });
  const [chartData, setChartData] = useState([]); // Data thật từ API
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);

  const [sysHistory, setSysHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const [tickets, setTickets] = useState([]);
  const [ticketPage, setTicketPage] = useState(1);

  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackPage, setFeedbackPage] = useState(1);

  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tokenAmount, setTokenAmount] = useState(10);
  const [actionLoading, setActionLoading] = useState(false);

  const [newPkg, setNewPkg] = useState({ name: "", price: 0, tokens: 0, features: "", popular: false });
  const [seoData, setSeoData] = useState({ site_title: "", description: "", keywords: "", author: "", favicon_url: "" });
  const [seoLoading, setSeoLoading] = useState(false);

  // =====================================
  // 1. GỌI TẤT CẢ DATA CHÍNH KHI VÀO TRANG
  // =====================================
  useEffect(() => {
    const initData = async () => {
      try {
        const [statsRes, pkgRes, chartRes] = await Promise.all([
          axiosClient.get("/admin/stats"),
          axiosClient.get("/admin/packages"),
          axiosClient.get("/admin/chart-data") // GỌI API BIỂU ĐỒ
        ]);
        setStats(statsRes.data);
        setPackages(pkgRes.data);
        setChartData(chartRes.data.chart_data);
      } catch (error) {
        console.error(error);
      }
    };
    initData();
  }, []);

  // Fetch functions cho các Tabs
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/admin/users?page=${userPage}&limit=10`);
      setUsers(res.data.users);
      setUserTotalPages(res.data.pagination.total_pages);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };
  useEffect(() => { if (activeTab === "overview") fetchUsers(); }, [userPage, activeTab]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/admin/all-history?page=${historyPage}&limit=15`);
      setSysHistory(res.data.histories);
      setHistoryTotalPages(res.data.pagination.total_pages);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };
  useEffect(() => { if (activeTab === "history") fetchHistory(); }, [historyPage, activeTab]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/admin/support/tickets?page=${ticketPage}&limit=10`);
      setTickets(res.data.tickets || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };
  useEffect(() => { if (activeTab === "helpdesk") fetchTickets(); }, [ticketPage, activeTab]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/admin/ai-feedback?page=${feedbackPage}&limit=10`);
      setFeedbacks(res.data.feedbacks || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };
  useEffect(() => { if (activeTab === "feedback") fetchFeedbacks(); }, [feedbackPage, activeTab]);

  const fetchSeoData = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/seo");
      if (!res.data.error) setSeoData(res.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // 3. Các hàm Actions
  const handleUpdateSeo = async (e) => {
    e.preventDefault();
    setSeoLoading(true);
    try {
      await axiosClient.post("/admin/seo", seoData);
      alert("Đã ghi đè mã nguồn HTML thành công!");
    } catch (error) { alert("Lỗi cập nhật SEO"); } finally { setSeoLoading(false); }
  };

  const handleAddToken = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await axiosClient.post(`/admin/add-token?username=${selectedUser.username}&amount=${tokenAmount}`);
      alert(`Đã cập nhật Token cho ${selectedUser.username}`);
      setShowModal(false);
      fetchUsers();
    } catch (error) { alert("Lỗi khi thêm Token"); } finally { setActionLoading(false); }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post("/admin/packages", newPkg);
      alert("Thêm gói thành công!");
      setNewPkg({ name: "", price: 0, tokens: 0, features: "", popular: false });
      const pkgRes = await axiosClient.get("/admin/packages");
      setPackages(pkgRes.data);
    } catch (error) { alert("Lỗi khi tạo gói"); }
  };

  const handleDeletePackage = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa gói nạp này?")) {
      try {
        await axiosClient.delete(`/admin/packages/${id}`);
        const pkgRes = await axiosClient.get("/admin/packages");
        setPackages(pkgRes.data);
      } catch (error) { alert("Lỗi khi xóa gói"); }
    }
  };

  const openTokenModal = (user) => {
    setSelectedUser(user);
    setTokenAmount(10);
    setShowModal(true);
  };

  return (
    <div className="p-6 md:p-10 font-sans bg-[#F9FAFB] dark:bg-slate-950 min-h-screen transition-colors duration-300">
      
      {/* HEADER QUẢN TRỊ */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Trạm Kiểm Soát
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Giám sát tổng thể người dùng, doanh thu và API AI.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
             <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase">System Online</span>
          </div>
        </div>
      </div>

      {/* MENU TABS CỰC ĐẸP (SEGMENTED CONTROL) */}
      <div className="flex flex-nowrap overflow-x-auto pb-4 mb-8 hide-scrollbar">
        <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit shadow-inner border border-slate-300/50 dark:border-slate-700/50 backdrop-blur-sm">
          {[
            { id: "overview", icon: "📊", label: "Tổng quan" },
            { id: "packages", icon: "💳", label: "Gói cước" },
            { id: "history", icon: "📜", label: "Lịch sử" },
            { id: "helpdesk", icon: "🛠️", label: "Hỗ trợ", badge: tickets.filter(t => t.status === 'Open').length },
            { id: "feedback", icon: "🧠", label: "Dữ liệu AI" },
            { id: "seo", icon: "🌐", label: "SEO" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "seo") fetchSeoData();
              }}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-md scale-105" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-lg">{tab.icon}</span> {tab.label}
              {tab.badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1 animate-pulse">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* NỘI DUNG CÁC TAB */}
      {activeTab === "overview" && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          
          {/* KHỐI THỐNG KÊ (CARDS) CỰC ĐẸP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">👥</div>
              <p className="font-bold text-xs uppercase tracking-widest mb-1 opacity-80">Tổng Người Dùng</p>
              <h3 className="text-5xl font-black tracking-tight">{stats.total_users}</h3>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">💰</div>
              <p className="font-bold text-xs uppercase tracking-widest mb-1 opacity-80">Doanh thu (VNĐ)</p>
              <h3 className="text-4xl md:text-5xl font-black tracking-tight">{stats.total_revenue.toLocaleString("vi-VN")}₫</h3>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">📸</div>
              <p className="font-bold text-xs uppercase tracking-widest mb-1 opacity-80">Lượt Quét AI</p>
              <h3 className="text-5xl font-black tracking-tight">{stats.total_scans}</h3>
            </div>
          </div>

          {/* KHỐI BIỂU ĐỒ RECHARTS (FIX LỖI HEIGHT) */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 p-8 md:p-10 mb-8 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-slate-800 dark:text-white text-2xl tracking-tight">Tần suất sử dụng AI</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Biểu đồ lượt quét 7 ngày gần nhất (Realtime)</p>
              </div>
            </div>
            
            {/* THẺ DIV NÀY BẮT BUỘC PHẢI CÓ CHIỀU CAO (h-72) ĐỂ RECHARTS KHÔNG BỊ LỖI */}
            <div className="h-72 w-full mt-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}
                      itemStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                    />
                    <Area type="monotone" dataKey="scans" name="Lượt quét" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScans)" activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold">Đang tải dữ liệu biểu đồ...</div>
              )}
            </div>
          </div>

          {/* DANH SÁCH USER */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <h3 className="font-black text-xl text-slate-800 dark:text-white tracking-tight">Danh sách Khách hàng</h3>
            </div>
            {loading ? (
              <div className="p-10 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="p-6 font-bold tracking-wider">Người dùng</th>
                        <th className="p-6 font-bold tracking-wider">Email</th>
                        <th className="p-6 font-bold text-center tracking-wider">Token Tồn</th>
                        <th className="p-6 font-bold text-right tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {users.map((u) => (
                        <tr key={u.username} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-6">
                            <div className="font-bold text-slate-800 dark:text-white text-base">{u.full_name || "Chưa cập nhật"}</div>
                            <div className="text-xs text-slate-400 mt-1 font-mono">@{u.username}</div>
                          </td>
                          <td className="p-6 text-slate-600 dark:text-slate-400 text-sm font-medium">{u.email}</td>
                          <td className="p-6 text-center">
                            <span className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl font-black text-sm">
                              {u.token_balance} 🪙
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <button onClick={() => openTokenModal(u)} className="bg-slate-900 dark:bg-slate-700 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors shadow-lg hover:-translate-y-0.5">
                              Nạp Token
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                  <span className="text-sm text-slate-500 font-bold bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    Trang {userPage} / {userTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <button disabled={userPage === 1} onClick={() => setUserPage((p) => p - 1)} className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">← Trước</button>
                    <button disabled={userPage === userTotalPages} onClick={() => setUserPage((p) => p + 1)} className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">Sau →</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PACKAGES */}
      {activeTab === "packages" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 font-black text-slate-800 dark:text-white text-xl">
              Danh sách Gói nạp
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs">
                   <tr>
                     <th className="p-6 font-bold">Tên gói</th>
                     <th className="p-6 font-bold">Giá (VNĐ)</th>
                     <th className="p-6 font-bold">Token</th>
                     <th className="p-6 font-bold text-right">Hành động</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {packages.map((p) => (
                     <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                       <td className="p-6 font-black text-indigo-600 dark:text-indigo-400 flex flex-col items-start gap-2">
                         {p.name}
                         {p.popular && (
                           <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-1 rounded uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">Phổ biến</span>
                         )}
                       </td>
                       <td className="p-6 font-medium text-slate-700 dark:text-slate-300">{p.price.toLocaleString("vi-VN")}₫</td>
                       <td className="p-6 font-black text-slate-800 dark:text-white">{p.tokens}</td>
                       <td className="p-6 text-right">
                         <button onClick={() => handleDeletePackage(p._id)} className="text-rose-500 font-bold hover:text-rose-700 dark:hover:text-rose-400 transition-colors bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-lg">Xóa gói</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-lg border border-slate-200 dark:border-slate-800 p-8 h-fit">
            <h3 className="font-black text-slate-800 dark:text-white mb-6 text-xl">Tạo gói nạp mới</h3>
            <form onSubmit={handleCreatePackage} className="space-y-5 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Tên gói</label>
                <input type="text" required value={newPkg.name} onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })} className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Giá (VNĐ)</label>
                  <input type="number" required value={newPkg.price || ""} onChange={(e) => setNewPkg({ ...newPkg, price: Number(e.target.value) })} className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Token</label>
                  <input type="number" required value={newPkg.tokens || ""} onChange={(e) => setNewPkg({ ...newPkg, tokens: Number(e.target.value) })} className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Tính năng (cách nhau dấu phẩy)</label>
                <textarea rows="3" required value={newPkg.features} onChange={(e) => setNewPkg({ ...newPkg, features: e.target.value })} placeholder="VD: Hỗ trợ 24/7, Tốc độ cao..." className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"></textarea>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <input type="checkbox" checked={newPkg.popular} onChange={(e) => setNewPkg({ ...newPkg, popular: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">Đánh dấu là gói "Phổ biến nhất"</span>
              </label>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 text-lg">Tạo Gói Cước</button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === "history" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
            <h3 className="font-black text-slate-800 dark:text-white text-xl">Nhật ký Giao dịch</h3>
          </div>
          {loading ? (
            <div className="p-10 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs">
                     <tr>
                       <th className="p-6 font-bold">Thời gian</th>
                       <th className="p-6 font-bold">Tài khoản</th>
                       <th className="p-6 font-bold">Hành động</th>
                       <th className="p-6 font-bold text-right">Biến động</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {sysHistory.map((h) => (
                       <tr key={h._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                         <td className="p-6 text-slate-500 dark:text-slate-400 font-medium">{new Date(h.created_at).toLocaleString("vi-VN")}</td>
                         <td className="p-6 font-bold text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50/50 dark:bg-indigo-900/10">@{h.username}</td>
                         <td className="p-6 text-slate-700 dark:text-slate-300">{h.description}</td>
                         <td className={`p-6 font-black text-right text-lg ${h.type === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                           {h.type === "in" ? "+" : "-"}{h.amount}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                <span className="text-sm text-slate-500 font-bold bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  Trang {historyPage} / {historyTotalPages}
                </span>
                <div className="flex gap-2">
                  <button disabled={historyPage === 1} onClick={() => setHistoryPage((p) => p - 1)} className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">← Trước</button>
                  <button disabled={historyPage === historyTotalPages} onClick={() => setHistoryPage((p) => p + 1)} className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">Sau →</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: HELPDESK (HỖ TRỢ) */}
      {activeTab === "helpdesk" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-rose-50 dark:bg-rose-900/10">
            <div>
               <h3 className="font-black text-rose-600 dark:text-rose-400 text-xl flex items-center gap-3"><span>🛠️</span> Phiếu Yêu Cầu Hỗ Trợ</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Xử lý các lỗi ứng dụng do người dùng gửi về.</p>
            </div>
          </div>
          {loading ? (
             <div className="p-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div></div>
          ) : tickets.length === 0 ? (
             <div className="p-20 text-center text-slate-500 dark:text-slate-400 font-bold text-lg">Hệ thống đang hoạt động ổn định. Không có khiếu nại nào! 🎉</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
              {tickets.map(t => (
                 <div key={t.ticket_id} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 relative group hover:border-rose-300 dark:hover:border-rose-700 transition-colors shadow-sm">
                    <span className="absolute top-6 right-6 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{t.status}</span>
                    <p className="text-xs font-mono text-slate-400 mb-2">{t.ticket_id} • {new Date(t.created_at).toLocaleString('vi-VN')}</p>
                    <h4 className="font-black text-slate-800 dark:text-white text-lg mb-1">{t.subject}</h4>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold mb-4">Từ User: @{t.username}</p>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl text-slate-600 dark:text-slate-300 text-sm mb-4 border border-slate-100 dark:border-slate-800">
                       {t.description}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-200 dark:bg-slate-800 p-3 rounded-xl overflow-x-auto">
                       <span>💻</span> {t.device_log}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                       <button className="px-5 py-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors">Đóng Ticket (Đã xử lý)</button>
                    </div>
                 </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AI FEEDBACK */}
      {activeTab === "feedback" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/10">
            <div>
               <h3 className="font-black text-indigo-600 dark:text-indigo-400 text-xl flex items-center gap-3"><span>🧠</span> Dữ Liệu Huấn Luyện AI (Feedback)</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Danh sách các kết quả AI đoán sai được người dùng đính chính.</p>
            </div>
          </div>
          {loading ? (
             <div className="p-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
          ) : feedbacks.filter(f => !f.is_correct).length === 0 ? (
             <div className="p-20 text-center text-slate-500 dark:text-slate-400 font-bold text-lg">Chưa có dữ liệu dự đoán sai nào từ người dùng. AI của bạn quá đỉnh! 🚀</div>
          ) : (
            <div className="overflow-x-auto p-4">
               <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-6 font-bold rounded-tl-2xl">Thời gian / User</th>
                      <th className="p-6 font-bold w-1/3">Kết quả AI trả về (Sai)</th>
                      <th className="p-6 font-bold w-1/3 text-emerald-600 rounded-tr-2xl">User Đính chính (Đúng)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {feedbacks.filter(f => !f.is_correct).map((f, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                           <td className="p-6">
                              <div className="font-bold text-slate-800 dark:text-white font-mono text-base">@{f.username}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">{new Date(f.created_at).toLocaleString('vi-VN')}</div>
                              <div className="text-[10px] font-mono text-slate-400 mt-2 hidden md:block bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit border border-slate-200 dark:border-slate-700">Task: {f.task_id.split('-')[0]}</div>
                           </td>
                           <td className="p-6 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/5 font-medium border-l border-r border-slate-100 dark:border-slate-800/50">
                              <div className="line-clamp-4 leading-relaxed">{f.ai_result}</div>
                           </td>
                           <td className="p-6 text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/5 font-black text-base leading-relaxed">
                              ✅ {f.user_correction}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CÀI ĐẶT SEO & WEBSITE */}
      {activeTab === "seo" && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden p-10 max-w-3xl animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-10 border-b border-slate-100 dark:border-slate-800 pb-8">
            <h3 className="font-black text-2xl text-slate-800 dark:text-white flex items-center gap-3">
              <span>🌐</span> Đồng bộ HTML & SEO
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
              Dữ liệu bạn nhập ở đây sẽ được Backend can thiệp và ghi trực tiếp
              vào mã nguồn file <code>index.html</code> để tối ưu hóa công cụ
              tìm kiếm.
            </p>
          </div>

          {loading ? (
            <div className="p-10 flex justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <form onSubmit={handleUpdateSeo} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tiêu đề Website (Site Title)</label>
                <input type="text" required value={seoData.site_title} onChange={(e) => setSeoData({ ...seoData, site_title: e.target.value })} className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors" placeholder="VD: Banknote AI - Giám định tiền tệ" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mô tả hiển thị (Meta Description)</label>
                <textarea rows="3" required value={seoData.description} onChange={(e) => setSeoData({ ...seoData, description: e.target.value })} className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Mô tả ngắn gọn về website để hiển thị trên Google/Facebook..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Từ khóa (Keywords)</label>
                  <input type="text" value={seoData.keywords} onChange={(e) => setSeoData({ ...seoData, keywords: e.target.value })} className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors" placeholder="AI, giám định, tiền cổ..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tác giả (Author)</label>
                  <input type="text" value={seoData.author} onChange={(e) => setSeoData({ ...seoData, author: e.target.value })} className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Tên của bạn hoặc nhóm..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Đường dẫn Logo nhỏ (Favicon URL)</label>
                <input type="text" value={seoData.favicon_url} onChange={(e) => setSeoData({ ...seoData, favicon_url: e.target.value })} className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors" placeholder="/vite.svg" />
              </div>
              <div className="pt-6">
                <button type="submit" disabled={seoLoading} className="bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center w-full md:w-auto gap-3 text-lg">
                  {seoLoading ? "ĐANG GHI ĐÈ FILE HTML..." : "💾 LƯU VÀ ĐỒNG BỘ MÃ NGUỒN"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* MODAL BƠM TOKEN */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-[1.5rem] flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg rotate-3">🪙</div>
            <h3 className="font-black text-3xl mb-2 text-slate-900 dark:text-white tracking-tight">Nạp Token</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Tài khoản:{" "}
              <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-base bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 px-3 py-1.5 rounded-xl ml-1">
                @{selectedUser?.username}
              </span>
            </p>
            <form onSubmit={handleAddToken}>
              <input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(Number(e.target.value))}
                className="w-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:text-white focus:border-indigo-500 outline-none rounded-2xl p-5 text-center text-4xl font-black mb-8 transition-colors shadow-inner"
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Hủy</button>
                <button type="submit" disabled={actionLoading} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:-translate-y-1">
                  {actionLoading ? "Đang xử lý..." : "Xác nhận nạp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;