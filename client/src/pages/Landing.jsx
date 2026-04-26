import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans selection:bg-indigo-500/30 scroll-smooth">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black">
              B
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Banknote AI
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">
              Tính năng
            </a>
            <a href="#showcase" className="hover:text-white transition-colors">
              Thư viện
            </a>
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors"
            >
              Quy trình
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Bảng giá
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              Dùng thử miễn phí
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <main className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10 mt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 mb-6 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Gemini 1.5 Flash Multi-Agent Engine
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
            Giám định tiền tệ với <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Trí tuệ nhân tạo (AI)
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Nền tảng đầu tiên ứng dụng kiến trúc Đa tác nhân (Multi-Agent). Tự
            động phân tích, tranh biện và xuất chứng thư giám định chỉ trong 10
            giây.
          </p>

          <div className="relative group max-w-2xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-[#18181b] border border-white/10 rounded-full p-2 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-3 pl-4">
                <span className="text-xl">✨</span>
                <span className="text-slate-400 text-sm hidden sm:block">
                  Tải hình ảnh tờ tiền lên và để AI làm phần còn lại...
                </span>
                <span className="text-slate-400 text-sm sm:hidden">
                  Tải ảnh lên...
                </span>
              </div>
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all"
              >
                Trải nghiệm ngay
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  ></path>
                </svg>
              </Link>
            </div>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-8 text-slate-500 font-medium text-sm">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✔</span> Xử lý ảnh OpenCV
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✔</span> Nhận diện 200+ Quốc
              gia
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">✔</span> Chống ảo giác (Debate
              AI)
            </div>
          </div>
        </div>
      </main>

      {/* 2. SHOWCASE GALLERY (TRƯNG BÀY) */}
      <section
        id="showcase"
        className="py-24 bg-[#050505] border-y border-white/5 relative"
      >
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Khám phá Thư viện Giám định
            </h2>
            <p className="text-slate-400">
              Xem cách hệ thống AI của chúng tôi phân tích các loại tiền tệ trên
              thế giới.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Item 1 */}
            <div className="bg-[#121214] border border-white/5 rounded-3xl overflow-hidden group hover:border-indigo-500/50 transition-all duration-300">
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                {/* Thay src bằng link ảnh tờ 2 USD của bạn nếu có */}
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/US_%242_obverse-high.jpg/1200px-US_%242_obverse-high.jpg"
                  alt="2 USD"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md border border-emerald-500/30">
                  Độ tin cậy: 99%
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1">
                  2 USD - Hoa Kỳ
                </h3>
                <p className="text-indigo-400 text-sm font-medium mb-4">
                  Năm phát hành: 2003
                </p>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-slate-400 text-sm line-clamp-3">
                    <span className="text-white font-bold">AI Đánh giá:</span>{" "}
                    Các chuyên gia đồng thuận tuyệt đối. Chữ ký và số seri B
                    29477356 A hoàn toàn trùng khớp với định dạng chuẩn của Bộ
                    Tài chính Hoa Kỳ.
                  </p>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="bg-[#121214] border border-white/5 rounded-3xl overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Vietnamese_5000_dong_bill_obverse.jpg/1200px-Vietnamese_5000_dong_bill_obverse.jpg"
                  alt="5000 VND"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md border border-amber-500/30">
                  Đã tranh biện
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1">
                  5000 VNĐ - Việt Nam
                </h3>
                <p className="text-purple-400 text-sm font-medium mb-4">
                  Năm phát hành: 1991
                </p>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-slate-400 text-sm line-clamp-3">
                    <span className="text-white font-bold">AI Đánh giá:</span>{" "}
                    Dù ảnh bị gập, AI Phản biện đã sửa lỗi nhận diện sai của
                    chuyên gia Tổng quan nhờ vào họa tiết nhà máy thủy điện Trị
                    An và quốc huy.
                  </p>
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="bg-[#121214] border border-white/5 rounded-3xl overflow-hidden group hover:border-pink-500/50 transition-all duration-300">
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/1000_yen_banknote_2004.jpg/1200px-1000_yen_banknote_2004.jpg"
                  alt="1000 Yen"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md border border-emerald-500/30">
                  Độ tin cậy: 98%
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1">
                  1000 JPY - Nhật Bản
                </h3>
                <p className="text-pink-400 text-sm font-medium mb-4">
                  Năm phát hành: 2004
                </p>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-slate-400 text-sm line-clamp-3">
                    <span className="text-white font-bold">AI Đánh giá:</span>{" "}
                    Chân dung Hideyo Noguchi rõ nét. AI phát hiện được chữ siêu
                    nhỏ "NIPPON GINKO" ẩn trong viền hoa văn một cách chính xác.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (QUY TRÌNH HOẠT ĐỘNG) */}
      <section id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Hệ thống hoạt động như thế nào?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Không đơn thuần là gọi API, chúng tôi xây dựng một quy trình phức
              tạp đằng sau để mang lại kết quả tốt nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Đường nối giữa các bước (Chỉ hiện trên Desktop) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-purple-500/0"></div>

            <div className="text-center relative z-10">
              <div className="w-24 h-24 mx-auto bg-[#121214] border-2 border-indigo-500/30 rounded-full flex items-center justify-center text-3xl mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                📷
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                1. Tiền xử lý OpenCV
              </h3>
              <p className="text-slate-400 text-sm">
                Hệ thống tự động phát hiện, cắt bỏ nền rác và làm phẳng hình ảnh
                tờ tiền trước khi gửi đi.
              </p>
            </div>

            <div className="text-center relative z-10">
              <div className="w-24 h-24 mx-auto bg-[#121214] border-2 border-purple-500/30 rounded-full flex items-center justify-center text-3xl mb-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                ⚖️
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                2. Đa tác nhân Tranh biện
              </h3>
              <p className="text-slate-400 text-sm">
                3 Mô hình AI (Tổng quan, Chi tiết, Phản biện) sẽ phân tích độc
                lập và cãi nhau để tìm ra lỗi sai.
              </p>
            </div>

            <div className="text-center relative z-10">
              <div className="w-24 h-24 mx-auto bg-[#121214] border-2 border-pink-500/30 rounded-full flex items-center justify-center text-3xl mb-6 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
                📑
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                3. Trọng tài Chốt kết quả
              </h3>
              <p className="text-slate-400 text-sm">
                Một AI thứ 4 đóng vai trò Trọng tài sẽ tổng hợp báo cáo và xuất
                ra Chứng thư PDF cho người dùng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING (BẢNG GIÁ TOKEN) */}
      <section
        id="pricing"
        className="py-24 bg-[#050505] border-y border-white/5 relative"
      >
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Gói Token Giám định
            </h2>
            <p className="text-slate-400">
              Chọn gói phù hợp với nhu cầu sử dụng của bạn. 1 Lượt giám định = 1
              Token.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Gói Free */}
            <div className="bg-[#121214] border border-white/5 p-8 rounded-3xl flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">
                Gói Trải nghiệm
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Dành cho người dùng mới
              </p>
              <div className="text-4xl font-black text-white mb-8">
                Miễn phí
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className="text-emerald-400">✔</span> Tặng ngay 5 Token
                  khi đăng ký
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className="text-emerald-400">✔</span> Sử dụng kiến trúc
                  Multi-Agent
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className="text-emerald-400">✔</span> Xuất báo cáo PDF
                  cơ bản
                </li>
              </ul>
              <Link
                to="/register"
                className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-center text-white font-bold transition-colors"
              >
                Đăng ký ngay
              </Link>
            </div>

            {/* Gói Pro */}
            <div className="bg-gradient-to-b from-indigo-900/40 to-[#121214] border border-indigo-500/30 p-8 rounded-3xl flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                PHỔ BIẾN
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Gói Sưu tầm (Pro)
              </h3>
              <p className="text-indigo-200 text-sm mb-6">
                Dành cho chuyên gia & người sưu tầm
              </p>
              <div className="text-4xl font-black text-white mb-8">
                50.000đ{" "}
                <span className="text-lg text-slate-400 font-normal">
                  / 50 Token
                </span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className="text-indigo-400">✔</span> Mọi tính năng của
                  gói Trải nghiệm
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className="text-indigo-400">✔</span> Nhận diện tiền xu
                  (Coin) chuyên sâu
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className="text-indigo-400">✔</span> Ưu tiên băng thông
                  (Không bị lỗi 429)
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className="text-indigo-400">✔</span> Lưu trữ lịch sử
                  không giới hạn
                </li>
              </ul>
              <Link
                to="/login"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-center text-white font-bold transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)]"
              >
                Mua Token
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CONTACT / FAQ */}
      <section className="py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Cần hỗ trợ hoặc hợp tác?
          </h2>
          <p className="text-slate-400 mb-10">
            Hệ thống được phát triển dưới dạng Đồ án tốt nghiệp. Chúng tôi luôn
            hoan nghênh các đóng góp để cải thiện AI.
          </p>

          <div className="bg-[#121214] border border-white/5 p-8 rounded-3xl text-left flex flex-col md:flex-row gap-8 items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Liên hệ với Nhà phát triển
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Sinh viên: Huỳnh Nguyễn Minh Triết
              </p>
              <div className="flex items-center gap-3 text-indigo-400 font-mono text-sm">
                <span>📧</span> minh.triet@example.com
              </div>
            </div>
            <button className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors whitespace-nowrap">
              Gửi tin nhắn
            </button>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="border-t border-white/5 bg-[#09090b] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-xs">
                B
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Banknote AI
              </span>
            </div>
            <p className="text-slate-500 text-sm max-w-sm">
              Hệ thống giám định tiền tệ tự động sử dụng Trí tuệ nhân tạo Đa tác
              nhân. Chính xác, nhanh chóng và bảo mật tuyệt đối.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Sản phẩm</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <Link
                  to="/login"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Giám định AI
                </Link>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Bảng giá Token
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400 transition-colors">
                  API cho Nhà phát triển
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Pháp lý</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <a href="#" className="hover:text-indigo-400 transition-colors">
                  Điều khoản dịch vụ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400 transition-colors">
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <p>© 2026 Banknote AI. Được phát triển để làm đồ án tốt nghiệp.</p>
          <div className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors">
              FB
            </span>
            <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors">
              GH
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
