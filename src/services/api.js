// src/services/api.js
import axios from 'axios';

// Lấy API base URL từ biến môi trường, có giá trị mặc định dự phòng
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://restaurant-booking.test/api';
console.log("API Base URL:", API_BASE_URL); // Log để kiểm tra khi khởi động

// Tạo một instance Axios với cấu hình cơ bản
const apiClient = axios.create({
  baseURL: API_BASE_URL, // URL gốc cho tất cả các request
  headers: {
    'Accept': 'application/json', // Luôn mong muốn nhận JSON
    'Content-Type': 'application/json', // Mặc định gửi JSON (sẽ bị ghi đè nếu gửi FormData)
    'X-Requested-With': 'XMLHttpRequest', // Thêm header này để Laravel nhận biết là AJAX request (hữu ích cho xử lý lỗi/redirect)
  },
  // withCredentials: true, // Bỏ comment dòng này nếu bạn dùng Sanctum với SPA và cookie (thay vì token)
});

// --- Request Interceptor ---
// Tự động thêm token vào header trước mỗi request
apiClient.interceptors.request.use(
  (config) => {
    let token = null;
    const url = config.url || ''; // Lấy URL của request

    // Kiểm tra xem request có phải dành cho API Admin không
    if (url.startsWith('/admin')) {
      // console.log("Request is for ADMIN API, getting admin token...");
      token = localStorage.getItem('adminToken'); // Lấy token Admin
    } else {
      // Mặc định là lấy token User
      // console.log("Request is for USER API, getting user token...");
      token = localStorage.getItem('authToken'); // Lấy token User
    }

    // Nếu có token, thêm vào header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log("Token found and added to headers.");
    } else {
      // Đảm bảo xóa header nếu không có token (quan trọng khi chuyển đổi giữa login/logout)
      delete config.headers.Authorization;
      // console.log("No token found for this request type.");
    }

    // Log request để debug (có thể bỏ đi ở production)
    console.log(`Starting Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.params || config.data || '');

    return config; // Trả về config đã được sửa đổi
  },
  (error) => {
    // Xử lý lỗi trước khi request được gửi đi (ít khi xảy ra)
    console.error('Request Error Interceptor:', error);
    return Promise.reject(error); // Ném lỗi tiếp
  }
);

// --- Response Interceptor ---
// Xử lý response trả về, đặc biệt là lỗi
apiClient.interceptors.response.use(
  (response) => {
    // Bất kỳ status code nào trong khoảng 2xx sẽ vào đây
    console.log('Response Status:', response.status, 'URL:', response.config.url);
    // Chỉ trả về phần data của response nếu muốn (tùy chọn)
    // return response.data;
    return response; // Trả về toàn bộ response object
  },
  (error) => {
    // Bất kỳ status code nào ngoài khoảng 2xx sẽ vào đây
    console.error(
      'Response Error Interceptor:',
      error.response?.status, // Status code lỗi (vd: 401, 404, 422, 500)
      error.response?.data || error.message, // Data lỗi từ backend hoặc message lỗi chung
      'URL:', error.config.url // URL gây ra lỗi
    );

    // Xử lý lỗi 401 Unauthorized (Token sai, hết hạn, hoặc chưa đăng nhập)
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized! Clearing potentially invalid auth data...');
      const url = error.config.url || ''; // URL gây lỗi 401

      // Quyết định xóa token nào dựa trên URL
      if (url.startsWith('/admin')) { // Nếu là API Admin gây lỗi 401
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        console.log("Cleared ADMIN auth data due to 401.");
        // Chuyển hướng về trang login admin nếu chưa ở đó
        if (!window.location.pathname.startsWith('/admin/login')) {
          // Thêm thông báo vào URL để trang login biết lý do redirect
          window.location.href = '/admin/login?message=session_expired_or_invalid';
        }
      } else { // Mặc định là lỗi từ API User
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        console.log("Cleared USER auth data due to 401.");
        // Chuyển hướng về trang login user nếu chưa ở đó
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          // Thêm thông báo vào URL
          window.location.href = '/login?message=session_expired_or_invalid';
        }
      }
      // Quan trọng: Không ném lỗi 401 ra ngoài nữa nếu đã xử lý redirect,
      // trừ khi bạn muốn component cha xử lý thêm.
      // return Promise.reject(error); // Ném lại lỗi để component bắt nếu cần
      // Hoặc trả về một promise bị reject với thông báo khác
      return Promise.reject({ handled: true, message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ.' });
    }

    // Ném lỗi ra ngoài để các hàm gọi API có thể bắt và xử lý (cho các lỗi khác 401)
    return Promise.reject(error);
  }
);

export default apiClient; // Export instance Axios đã cấu hình