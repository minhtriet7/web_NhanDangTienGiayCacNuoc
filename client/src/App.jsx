import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";

// Hàm bảo vệ Route: Kiểm tra xem có Token trong máy chưa
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <>
      <style>{`
        /* Giữ lại toàn bộ CSS gốc của bạn ở đây để Web vẫn đẹp */
        :root, #root, html, body { margin: 0; padding: 0; width: 100%; background-color: #f3f4f6; font-family: 'Segoe UI', sans-serif; }
        .sidebar { position: fixed; top: 0; left: 0; width: 320px; height: 100vh; background-color: #1e293b; color: white; padding: 30px 20px; box-sizing: border-box; box-shadow: 4px 0 15px rgba(0,0,0,0.1); z-index: 10; overflow-y: auto; }
        .logo-box { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #334155; margin-bottom: 25px; }
        .logo-box h1 { margin: 0; font-size: 24px; color: #f8fafc; }
        .nav-menu { display: flex; gap: 10px; margin-bottom: 25px; }
        .nav-btn { padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s; background: #334155; color: #94a3b8; }
        .nav-btn.active, .nav-btn:hover { background: #3b82f6; color: white; }
        .upload-area { border: 2px dashed #475569; border-radius: 12px; padding: 30px 15px; text-align: center; cursor: pointer; transition: 0.3s; background-color: #0f172a; display: block; }
        .upload-area:hover { border-color: #3b82f6; background-color: #1e293b; }
        .btn-run { width: 100%; padding: 15px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; }
        .btn-run:hover:not(:disabled) { transform: translateY(-2px); background: linear-gradient(135deg, #60a5fa, #3b82f6); }
        .btn-run:disabled { background: #475569; color: #94a3b8; cursor: not-allowed; }
        .main-content { margin-left: 320px; min-height: 100vh; padding: 40px; box-sizing: border-box; width: calc(100% - 320px); }
        .history-card { background: white; padding: 25px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-left: 6px solid #8b5cf6; }
        .history-header { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 15px; color: #64748b; font-size: 14px;}
        .history-title { font-size: 18px; font-weight: bold; color: #1e293b; margin:0;}
        .waiting-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; background: white; border-radius: 20px; border: 2px dashed #cbd5e1; color: #64748b; text-align: center; }
        .result-master { background: #ffffff; padding: 30px; border-radius: 16px; border-left: 8px solid #10b981; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); margin-bottom: 40px; }
        .ai-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; }
        .ai-box { background: white; border-radius: 16px; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .ai-box.nemo { border-top: 5px solid #10b981; } .ai-box.qwen { border-top: 5px solid #8b5cf6; } .ai-box.gemini { border-top: 5px solid #f59e0b; }
        .parsed-data { display: flex; flex-direction: column; gap: 12px; margin-top: 15px; }
        .data-row { background-color: #f8fafc; padding: 12px 15px; border-radius: 8px; border-left: 3px solid #cbd5e1; display: flex; flex-direction: column; gap: 4px; }
        .data-row strong { color: #475569; font-size: 13px; text-transform: uppercase; }
        .data-row span { color: #0f172a; font-weight: 500; font-size: 15px; }
      `}</style>

      <Router>
        <Routes>
          {/* Các trang không cần đăng nhập */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Các trang bắt buộc ĐĂNG NHẬP (Bọc trong ProtectedRoute) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
