// src/services/admin.user.service.js
import apiClient from './api'; // Import Axios instance đã cấu hình

/**
 * Lấy danh sách người dùng (Admin).
 * @param {object} params - Tham số query (page, search, is_active, membership_tier_id, sort_by, sort_dir, per_page...)
 * @returns {Promise} Axios Promise (Trả về dữ liệu phân trang)
 */
const getUsers = (params = {}) => {
  console.log('Calling API: GET /admin/users with params:', params);
  // Token Admin được thêm tự động bởi interceptor
  return apiClient.get('/admin/users', { params });
};

/**
 * Lấy chi tiết một người dùng bằng ID (Admin).
 * @param {number} id - ID của người dùng
 * @returns {Promise} Axios Promise
 */
const getUserDetail = (id) => {
    console.log(`Calling API: GET /admin/users/${id}`);
    return apiClient.get(`/admin/users/${id}`);
};

/**
 * Tạo người dùng mới (Admin).
 * @param {object} userData - Dữ liệu người dùng (name, email, password, phone_number, points, membership_tier_id, is_active)
 * @returns {Promise} Axios Promise
 */
const createUser = (userData) => {
    console.log('Calling API: POST /admin/users with data:', userData);
    return apiClient.post('/admin/users', userData);
};

/**
 * Cập nhật thông tin người dùng (Admin).
 * @param {number} id - ID của người dùng
 * @param {object} userData - Dữ liệu cần cập nhật
 * @returns {Promise} Axios Promise
 */
const updateUser = (id, userData) => {
    console.log(`Calling API: PUT /admin/users/${id} with data:`, userData);
    return apiClient.put(`/admin/users/${id}`, userData);
};

/**
 * Xóa người dùng (Admin).
 * @param {number} id - ID của người dùng
 * @returns {Promise} Axios Promise
 */
const deleteUser = (id) => {
    console.log(`Calling API: DELETE /admin/users/${id}`);
    return apiClient.delete(`/admin/users/${id}`);
};

/**
 * Kích hoạt hoặc khóa tài khoản người dùng (Admin).
 * @param {number} id - ID của người dùng
 * @returns {Promise} Axios Promise
 */
const toggleUserActive = (id) => {
    console.log(`Calling API: PATCH /admin/users/${id}/toggle-active`);
    return apiClient.patch(`/admin/users/${id}/toggle-active`);
};

/**
 * Đổi mật khẩu người dùng bởi Admin.
 * @param {number} id - ID của người dùng
 * @param {string} newPassword - Mật khẩu mới
 * @returns {Promise} Axios Promise
 */
const changeUserPassword = (id, newPassword) => {
    console.log(`Calling API: PUT /admin/users/${id} with password update`);
    return apiClient.put(`/admin/users/${id}`, { password: newPassword });
};

// Export các hàm dưới dạng một object
export const adminUserService = {
  getUsers,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  changeUserPassword,
};