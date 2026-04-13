import { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ReactMarkdown from "react-markdown";

function History() {
  // KHỞI TẠO MẶC ĐỊNH LÀ MẢNG RỖNG []
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  
  const [activeTab, setActiveTab] = useState("scan");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axiosClient.get("/history");
        
        // CÁCH SỬA LỖI CHÍNH Ở ĐÂY: Bọc thép để chắc chắn lấy ra được Mảng (Array)
        let rawData = [];
        if (Array.isArray(res.data)) {
          rawData = res.data;
        } else if (res.data && Array.isArray(res.data.histories)) {
          rawData = res.data.histories;
        } else if (res.data && Array.isArray(res.data.history)) {
          rawData = res.data.history;
        } else if (res.data && Array.isArray(res.data.data)) {
          rawData = res.data.data;
        }

        setHistory(rawData);
        processChartData(rawData);
      } catch (error) {
        console.error("Lỗi lấy lịch sử", error);
        setHistory([]); // Nếu API lỗi, ép nó về mảng rỗng để không sập trang
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const processChartData = (data) => {
    // Bảo vệ: Nếu không có data hoặc data không phải mảng thì dừng luôn
    if (!data || !Array.isArray(data)) return;

    const grouped = {};
    data.forEach(item => {
      const date = new Date(item.timestamp || item.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const tokensUsed = item.results ? item.results.total_files_uploaded : (item.amount || 1);
      if (grouped[date]) { grouped[date] += tokensUsed; } else { grouped[date] = tokensUsed; }
    });
    const finalData = Object.keys(grouped).map(date => ({ date, tokens: grouped[date] })).slice(0, 7);
    setChartData(finalData.reverse());
  };

  const exportToCSV = () => {
    // Bảo vệ: Kiểm tra xem history có mảng và có phần tử không
    if (!Array.isArray(history) || history.length === 0) return alert("Không có dữ liệu để xuất!");
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Thời gian,Loại Giao Dịch,Chi tiết / Tên file,Số Token\n";
    history.forEach(item => {
      const time = new Date(item.timestamp || item.created_at).toLocaleString('vi-VN');
      const isScan = !!item.filename;
      const type = isScan ? "Giám định" : "Nạp/Trừ Token";
      const detail = item.filename || item.description || "N/A";
      const tokens = item.results ? item.results.total_files_uploaded : (item.amount || 1);
      csvContent += `"${time}","${type}","${detail}","${tokens}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BanknoteAI_LichSu_${Date.now()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // BỌC THÉP CHO HÀM FILTER BẰNG CÁCH ĐẢM BẢO NÓ LUÔN LÀ MẢNG
  const safeHistory = Array.isArray(history) ? history : [];
  const scanHistory = safeHistory.filter(item => item.filename);
  const tokenHistory = safeHistory.filter(item => !item.filename);

  // ... (Phần return giao diện giữ nguyên không đổi)

  return (
    <div className="py-12 font-sans bg-[#F9FAFB] dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER TRANG */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-sm">🗄️</span>
              Hồ sơ Dữ liệu
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Toàn bộ dữ liệu giám định và sao kê giao dịch của bạn.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-auto">
             <button 
                onClick={() => setActiveTab("scan")} 
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === "scan" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
             >
                🔍 Lịch sử Giám định
             </button>
             <button 
                onClick={() => setActiveTab("token")} 
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === "token" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
             >
                💳 Sao kê Token
             </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
        ) : (
          <>
            {/* ================= TAB 1: LỊCH SỬ GIÁM ĐỊNH (DẠNG CARD) ================= */}
            {activeTab === "scan" && (
              <div className="space-y-6">
                {scanHistory.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm text-slate-500">Chưa có lịch sử giám định nào.</div>
                ) : (
                  scanHistory.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-lg">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 text-lg">📄</div>
                          <div>
                            <h3 className="font-black text-slate-800 dark:text-white text-lg">{item.filename || "Không rõ tên file"}</h3>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-indigo-500"></span> {item.results?.total_files_uploaded || 1} mẫu vật
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 p-6 rounded-r-2xl">
                           <h4 className="text-emerald-700 dark:text-emerald-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                             <span>✨</span> KẾT LUẬN GIÁM ĐỊNH
                           </h4>
                           <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 font-medium">
                             {item.results && item.results.results && item.results.results.length > 0 ? (
                               <ReactMarkdown>{item.results.results[0].final_report || "Không có kết luận chi tiết."}</ReactMarkdown>
                             ) : (
                               <p>Đang phân tích hoặc không có kết luận.</p>
                             )}
                           </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ================= TAB 2: SAO KÊ TOKEN (BIỂU ĐỒ + BẢNG) ================= */}
            {activeTab === "token" && (
              <div className="space-y-8 animate-in fade-in">
                
                {/* Khu vực Biểu đồ & Nút Tải */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                     <h3 className="font-bold text-slate-800 dark:text-white">Thống kê Token tiêu thụ (7 ngày gần nhất)</h3>
                     
                     {/* ĐÂY LÀ NÚT XUẤT EXCEL */}
                     <button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 text-sm">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                       Xuất file Excel (CSV)
                     </button>
                  </div>
                  
                  {/* ĐÂY LÀ BIỂU ĐỒ BAR CHART */}
                  {chartData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff'}} />
                          <Bar dataKey="tokens" name="Token" radius={[6, 6, 6, 6]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#4f46e5' : '#818cf8'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-slate-400">Chưa có dữ liệu thống kê</div>
                  )}
                </div>

                {/* Bảng Sao kê */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                        <tr>
                          <th className="p-6 font-bold">Thời gian</th>
                          <th className="p-6 font-bold">Giao dịch</th>
                          <th className="p-6 font-bold text-right">Biến động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {tokenHistory.length === 0 ? (
                          <tr><td colSpan="3" className="p-8 text-center text-slate-500">Chưa có giao dịch Nạp/Trừ nào.</td></tr>
                        ) : (
                          tokenHistory.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="p-6 text-slate-500 dark:text-slate-400 font-medium">
                                {new Date(item.created_at).toLocaleString('vi-VN')}
                              </td>
                              <td className="p-6">
                                <div className="font-bold text-slate-800 dark:text-slate-200">{item.description}</div>
                              </td>
                              <td className="p-6 text-right">
                                <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-xl font-black text-xs ${item.type === 'out' ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"}`}>
                                  {item.type === 'out' ? "-" : "+"}{item.amount} Token
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default History;