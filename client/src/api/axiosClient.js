import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Điều chỉnh baseURL của bạn
});

// Gắn token vào mỗi request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// XỬ LÝ LỖI TỰ ĐỘNG (THÊM PHẦN NÀY)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Nếu lỗi là 401 (Hết hạn Token hoặc Token sai)
    if (error.response && error.response.status === 401) {
      // Xóa token cũ
      localStorage.removeItem('access_token');
      localStorage.removeItem('username');
      
      // Chuyển hướng ép buộc về trang đăng nhập
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;