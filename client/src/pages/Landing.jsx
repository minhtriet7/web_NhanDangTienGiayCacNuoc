import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-200 selection:bg-indigo-500/30">
      {/* Navbar Mỏng */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-2">
            <span className="text-3xl">🔮</span> Banknote AI
          </div>
          <div className="flex gap-4 items-center">
            <Link to="/login" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Đăng nhập</Link>
            <Link to="/register" className="text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-indigo-500/25">Bắt đầu miễn phí</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-sm font-bold text-emerald-400 mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Hệ thống AI Đa Tác Nhân đã sẵn sàng
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight mb-8 max-w-4xl">
            Giám định Tiền tệ bằng <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Trí Tuệ Nhân Tạo</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-12 max-w-2xl font-medium leading-relaxed">
            Phân tích tự động, trích xuất đặc trưng và xác thực thông tin tiền tệ toàn cầu thông qua mạng lưới 3 chuyên gia AI độc lập. Chính xác, minh bạch và bảo mật tuyệt đối.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="px-8 py-4 bg-white text-slate-900 font-black rounded-full text-lg hover:bg-slate-100 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Trải nghiệm ngay (Tặng 5 Token)
            </Link>
            <Link to="/login" className="px-8 py-4 bg-slate-800 text-white font-bold rounded-full text-lg border border-slate-700 hover:bg-slate-700 transition-all">
              Tôi đã có tài khoản
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Công nghệ Cốt lõi</h2>
            <p className="text-slate-400 font-medium text-lg">Hội đồng giám định ảo vận hành bằng 3 mô hình ngôn ngữ lớn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-8 hover:border-indigo-500/50 transition-colors">
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 flex items-center justify-center rounded-2xl text-3xl mb-6 border border-indigo-500/30">👁️</div>
              <h3 className="text-xl font-bold text-white mb-3">Thị giác Máy tính</h3>
              <p className="text-slate-400 leading-relaxed">Trích xuất văn bản (OCR), nhận dạng hoa văn và phân tích các đặc điểm vật lý trên bề mặt tờ tiền với độ chính xác cao.</p>
            </div>
            
            <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-8 hover:border-purple-500/50 transition-colors">
              <div className="w-14 h-14 bg-purple-500/20 text-purple-400 flex items-center justify-center rounded-2xl text-3xl mb-6 border border-purple-500/30">🧠</div>
              <h3 className="text-xl font-bold text-white mb-3">Logic Trọng tài</h3>
              <p className="text-slate-400 leading-relaxed">Đối chiếu dữ liệu được trích xuất với cơ sở dữ liệu lịch sử tiền tệ thế giới, phát hiện các điểm bất hợp lý hoặc lỗi in ấn.</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-8 hover:border-emerald-500/50 transition-colors">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-2xl text-3xl mb-6 border border-emerald-500/30">📑</div>
              <h3 className="text-xl font-bold text-white mb-3">Báo cáo Pháp lý</h3>
              <p className="text-slate-400 leading-relaxed">Tự động tổng hợp kết quả tranh biện và xuất chứng thư giám định chuẩn định dạng PDF, lưu trữ an toàn trên hệ thống.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 border-t border-slate-800 bg-slate-950">
        <p>© 2026 Banknote AI System. Đồ án Tốt Nghiệp.</p>
      </footer>
    </div>
  );
}

export default Landing;