

const BASE_URL = "http://localhost:3000/api";

const axiosClient  = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" }
});

// Request interceptor: tự động gắn token
axiosClient.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unwrap dữ liệu và xử lý lỗi chung
axiosClient.interceptors.response.use(
  response => {
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/index.html";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;