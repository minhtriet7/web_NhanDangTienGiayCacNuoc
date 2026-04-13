import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Cột 1: Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 tracking-tight flex items-center gap-2 mb-4">
              <span className="text-3xl">🔮</span> Banknote AI
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
              Hệ thống giám định tiền tệ tự động sử dụng trí tuệ nhân tạo đa tác nhân. Chính xác, nhanh chóng và bảo mật tuyệt đối.
            </p>
          </div>

          {/* Cột 2: Sản phẩm */}
          <div>
            <h4 className="font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest text-xs">Sản phẩm</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              <li><Link to="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Giám định AI</Link></li>
              <li><Link to="/topup" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Bảng giá Token</Link></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">API cho Nhà phát triển</a></li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ */}
          <div>
            <h4 className="font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest text-xs">Hỗ trợ</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Hướng dẫn sử dụng</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Liên hệ chuyên gia</a></li>
            </ul>
          </div>

          {/* Cột 4: Chính sách */}
          <div>
            <h4 className="font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest text-xs">Pháp lý</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Hoàn tiền & Hủy gói</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
            © {new Date().getFullYear()} Banknote AI. Được phát triển để làm đồ án tốt nghiệp.
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors cursor-pointer">FB</div>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors cursor-pointer">GH</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;