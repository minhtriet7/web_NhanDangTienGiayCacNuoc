import axios from 'axios';

const axiosClient = axios.create({
//   baseURL: 'http://localhost:8000/api',
  baseURL: 'http://127.0.0.1:8000/api', // Trỏ thẳng vào gốc API của FastAPI
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động móc Token từ LocalStorage gắn vào Request trước khi gửi đi
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;