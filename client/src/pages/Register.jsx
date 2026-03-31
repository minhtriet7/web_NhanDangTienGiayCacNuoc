import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp!");
    }

    setLoading(true);
    try {
      await axiosClient.post("/auth/register", {
        full_name: formData.full_name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      alert("Tạo tài khoản thành công!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Đăng ký thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.authWrapper}>
      <div style={styles.authCard}>
        <div style={styles.header}>
          <span style={{ fontSize: "40px" }}>📝</span>
          <h2 style={styles.title}>Tham Gia Hệ Thống</h2>
          <p style={styles.subtitle}>Giám định tiền tệ với sức mạnh AI</p>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Họ và Tên</label>
            <input
              type="text" placeholder="Nguyễn Văn A" required
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email" placeholder="email@gmail.com" required
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Tên đăng nhập</label>
            <input
              type="text" placeholder="username123" required
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Mật khẩu</label>
              <input
                type="password" placeholder="••••" required
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Xác nhận</label>
              <input
                type="password" placeholder="••••" required
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? "Đang xử lý..." : "Tạo Tài Khoản Ngay"}
          </button>
        </form>

        <p style={styles.footerText}>
          Đã có tài khoản? <Link to="/login" style={styles.link}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  authWrapper: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '100vh', width: '100vw',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Inter', sans-serif", position: 'fixed', top: 0, left: 0
  },
  authCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '30px', borderRadius: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '100%', maxWidth: '450px',
  },
  header: { textAlign: 'center', marginBottom: '20px' },
  title: { fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '5px 0' },
  subtitle: { color: '#64748b', fontSize: '13px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: {
    padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
    fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc'
    , color: '#1e293b',
  },
  row: { display: 'flex', gap: '10px' },
  primaryBtn: {
    padding: '12px', borderRadius: '12px', border: 'none',
    background: 'linear-gradient(to right, #3b82f6, #2563eb)',
    color: 'white', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer'
  },
  errorBanner: {
    backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px',
    borderRadius: '10px', fontSize: '13px', textAlign: 'center'
  },
  footerText: { textAlign: 'center', marginTop: '15px', color: '#64748b', fontSize: '14px' },
  link: { color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }
};

export default Register;