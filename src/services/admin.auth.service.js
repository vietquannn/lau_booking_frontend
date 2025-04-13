// src/services/admin.auth.service.js
import apiClient from './api'; // Import configured Axios instance

/**
 * Gửi yêu cầu đăng nhập cho Admin.
 * @param {string} email
 * @param {string} password
 * @returns {Promise} Axios Promise
 */
const login = (email, password) => {
  console.log('Calling API: POST /admin/login');
  // Gọi đến endpoint đăng nhập của Admin
  return apiClient.post('/admin/login', { email, password });
};

/**
 * Gửi yêu cầu đăng xuất cho Admin.
 * Yêu cầu có Admin Token trong header (interceptor sẽ tự thêm).
 * @returns {Promise} Axios Promise
 */
const logout = () => {
  console.log('Calling API: POST /admin/logout');
  // Gọi đến endpoint đăng xuất của Admin
  return apiClient.post('/admin/logout');
};

/**
 * Lấy thông tin của Admin đang đăng nhập.
 * Yêu cầu có Admin Token trong header.
 * @returns {Promise} Axios Promise
 */
const getAdminUser = () => {
    console.log('Calling API: GET /admin/me');
    // Gọi đến endpoint lấy thông tin Admin
    return apiClient.get('/admin/me');
}

// Export các hàm dưới dạng một object
export const adminAuthService = {
  login,
  logout,
  getAdminUser,
};