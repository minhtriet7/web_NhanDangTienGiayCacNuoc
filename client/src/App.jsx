import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import AdminSidebar from "./components/AdminSidebar";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Topup from "./pages/Topup";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import ForgotPassword from "./pages/ForgotPassword";

const ProtectedRoute = ({ children }) => {
  if (!localStorage.getItem("access_token")) return <Navigate to="/login" replace />;
  return children;
};

// ==========================================
// 1. LAYOUT KHÁCH HÀNG (Có Header ngang, Footer luôn ở đáy)
// ==========================================
const UserLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-[#F9FAFB] dark:bg-slate-950 transition-colors duration-300">
    <Header />
    <main className="flex-1 w-full flex flex-col">{children}</main>
    <Footer />
  </div>
);

// ==========================================
// 2. LAYOUT ADMIN (Có Sidebar dọc)
// ==========================================
const AdminLayout = ({ children }) => (
  <div className="flex h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-white overflow-hidden transition-colors duration-300">
    <AdminSidebar />
    <main className="flex-1 h-full overflow-y-auto">{children}</main>
  </div>
);

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      localStorage.setItem("access_token", tokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.href = "/dashboard";
    }
    setIsInitializing(false);
  }, []);

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-slate-950 dark:text-white">Đang tải...</div>;

  return (
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* KHÁCH HÀNG */}
        <Route path="/dashboard" element={<ProtectedRoute><UserLayout><Dashboard /></UserLayout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><UserLayout><History /></UserLayout></ProtectedRoute>} />
        <Route path="/topup" element={<ProtectedRoute><UserLayout><Topup /></UserLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserLayout><Profile /></UserLayout></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* ADMIN */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout><Admin /></AdminLayout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;