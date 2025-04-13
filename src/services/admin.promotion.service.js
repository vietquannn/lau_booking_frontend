// src/services/admin.promotion.service.js
import apiClient from './api'; // Import Axios instance đã cấu hình

/**
 * Lấy danh sách khuyến mãi (Admin).
 * @param {object} params - Tham số query (page, search, is_active, type, scope, active_now, sort_by, sort_dir, per_page...)
 * @returns {Promise} Axios Promise (Trả về dữ liệu phân trang)
 */
const getPromotions = (params = {}) => {
  console.log('Calling API: GET /admin/promotions with params:', params);
  // Token Admin được thêm tự động bởi interceptor
  return apiClient.get('/admin/promotions', { params });
};

/**
 * Lấy chi tiết một khuyến mãi bằng ID (Admin).
 * API này cần trả về cả thông tin các category hoặc menu item đã liên kết (nếu có).
 * @param {number} id - ID của khuyến mãi
 * @returns {Promise} Axios Promise trả về { success: boolean, data: PromotionObject }
 */
const getPromotionDetail = (id) => {
    console.log(`Calling API: GET /admin/promotions/${id}`);
    // Token Admin được thêm tự động
    return apiClient.get(`/admin/promotions/${id}`);
};

/**
 * Tạo một khuyến mãi mới (Admin).
 * Backend API (PromotionController@store) cần xử lý cả dữ liệu chính và các mảng category_ids/menu_item_ids.
 * @param {object} promotionData - Dữ liệu khuyến mãi đầy đủ từ form modal
 * @returns {Promise} Axios Promise
 */
const createPromotion = (promotionData) => {
    console.log('Calling API: POST /admin/promotions with data:', promotionData);
    // Token Admin được thêm tự động
    return apiClient.post('/admin/promotions', promotionData);
};

/**
 * Cập nhật một khuyến mãi (Admin).
 * Backend API (PromotionController@update) cần xử lý cả dữ liệu chính và các mảng category_ids/menu_item_ids (sử dụng sync).
 * @param {number} id - ID của khuyến mãi cần cập nhật
 * @param {object} promotionData - Dữ liệu cập nhật từ form modal
 * @returns {Promise} Axios Promise
 */
const updatePromotion = (id, promotionData) => {
    console.log(`Calling API: PATCH /admin/promotions/${id} with data:`, promotionData);
    // Sử dụng PATCH để chỉ gửi những trường cần cập nhật
    // Token Admin được thêm tự động
    return apiClient.patch(`/admin/promotions/${id}`, promotionData);
    // Hoặc dùng PUT nếu backend yêu cầu gửi đủ các trường:
    // return apiClient.put(`/admin/promotions/${id}`, promotionData);
    // Hoặc dùng POST với _method nếu gặp vấn đề:
    // return apiClient.post(`/admin/promotions/${id}`, { ...promotionData, _method: 'PATCH' });
};

/**
 * Xóa một khuyến mãi (Admin).
 * Backend API (PromotionController@destroy) cần xử lý việc detach các liên kết trước khi xóa.
 * @param {number} id - ID của khuyến mãi cần xóa
 * @returns {Promise} Axios Promise
 */
const deletePromotion = (id) => {
    console.log(`Calling API: DELETE /admin/promotions/${id}`);
    // Token Admin được thêm tự động
    return apiClient.delete(`/admin/promotions/${id}`);
};


// Export các hàm dưới dạng một object
export const adminPromotionService = {
  getPromotions,
  getPromotionDetail, // Hàm lấy chi tiết
  createPromotion,
  updatePromotion,
  deletePromotion,
};