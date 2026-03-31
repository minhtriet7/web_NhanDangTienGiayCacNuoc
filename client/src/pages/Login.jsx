import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axiosClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('username', response.data.username);
      navigate('/');
    } catch (err) {
    console.error(err);
      setError('Tài khoản hoặc mật khẩu không chính xác');
    }
  };

  return (
    <div style={styles.authWrapper}>
      <div style={styles.authCard}>
        <div style={styles.header}>
          <span style={{fontSize: '40px'}}>🔐</span>
          <h2 style={styles.title}>Chào Mừng Trở Lại</h2>
          <p style={styles.subtitle}>Đăng nhập để tiếp tục công việc của bạn</p>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tên đăng nhập</label>
            <input 
              type="text" placeholder="Nhập username" required
              onChange={e => setUsername(e.target.value)} style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Mật khẩu</label>
            <input 
              type="password" placeholder="Nhập mật khẩu" required
              onChange={e => setPassword(e.target.value)} style={styles.input}
            />
          </div>
          <button type="submit" style={styles.loginBtn}>Truy Cập Hệ Thống</button>
        </form>
        <p style={styles.footerText}>
          Thành viên mới? <Link to="/register" style={styles.link}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

// Bộ Style Xịn Xò
const styles = {
  authWrapper: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '100vh', width: '100vw',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Inter', sans-serif", position: 'fixed', top: 0, left: 0
  },
  authCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '40px', borderRadius: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    width: '100%', maxWidth: '400px',
  },
  header: { textAlign: 'center', marginBottom: '30px' },
  title: { fontSize: '26px', fontWeight: '800', color: '#1e293b', margin: '10px 0' },
  subtitle: { color: '#64748b', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#475569' },
  input: {
    padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0',
    fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', color: '#1e293b',
  },
  loginBtn: {
    padding: '14px', borderRadius: '12px', border: 'none',
    background: 'linear-gradient(to right, #10b981, #059669)',
    color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
  },
  errorBanner: {
    backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px',
    borderRadius: '10px', marginBottom: '20px', fontSize: '14px', textAlign: 'center'
  },
  footerText: { textAlign: 'center', marginTop: '20px', color: '#64748b' },
  link: { color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }
};

export default Login;