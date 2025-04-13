// src/services/admin.review.service.js
import apiClient from './api'; // Import Axios instance đã cấu hình

/**
 * Lấy danh sách đánh giá (Admin).
 * @param {object} params - Tham số query (page, status, search, rating, sort_by, sort_dir, per_page...)
 * @returns {Promise} Axios Promise (Trả về dữ liệu phân trang)
 */
const getReviews = (params = {}) => {
  console.log('Calling API: GET /admin/reviews with params:', params);
  // Token Admin được thêm tự động bởi interceptor
  return apiClient.get('/admin/reviews', { params });
};

/**
 * Lấy chi tiết một đánh giá bằng ID (Admin).
 * @param {number} reviewId - ID của review
 * @returns {Promise} Axios Promise
 */
const getReviewDetail = (reviewId) => {
    console.log(`Calling API: GET /admin/reviews/${reviewId}`);
    // Token Admin được thêm tự động
    return apiClient.get(`/admin/reviews/${reviewId}`);
};

/**
 * Duyệt một đánh giá (Admin).
 * Chuyển status thành 'approved'.
 * @param {number} reviewId - ID của review
 * @returns {Promise} Axios Promise trả về review đã cập nhật
 */
const approveReview = (reviewId) => {
    console.log(`Calling API: PATCH /admin/reviews/${reviewId}/approve`);
    // Token Admin được thêm tự động
    return apiClient.patch(`/admin/reviews/${reviewId}/approve`);
};

/**
 * Từ chối một đánh giá (Admin).
 * Chuyển status thành 'rejected'.
 * @param {number} reviewId - ID của review
 * @returns {Promise} Axios Promise trả về review đã cập nhật
 */
const rejectReview = (reviewId) => {
    console.log(`Calling API: PATCH /admin/reviews/${reviewId}/reject`);
    // Token Admin được thêm tự động
    return apiClient.patch(`/admin/reviews/${reviewId}/reject`);
};

/**
 * Thêm hoặc cập nhật phản hồi của nhà hàng cho một đánh giá (Admin).
 * @param {number} reviewId - ID của review
 * @param {string} responseText - Nội dung phản hồi (phải có giá trị)
 * @returns {Promise} Axios Promise trả về review đã cập nhật
 */
const respondToReview = (reviewId, responseText) => {
    console.log(`Calling API: POST /admin/reviews/${reviewId}/respond`);
    // Token Admin được thêm tự động
    return apiClient.post(`/admin/reviews/${reviewId}/respond`, { response: responseText });
};

/**
 * Xóa một đánh giá (Admin).
 * @param {number} reviewId - ID của review
 * @returns {Promise} Axios Promise
 */
const deleteReview = (reviewId) => {
    console.log(`Calling API: DELETE /admin/reviews/${reviewId}`);
    // Token Admin được thêm tự động
    return apiClient.delete(`/admin/reviews/${reviewId}`);
};


// Export các hàm dưới dạng một object
export const adminReviewService = {
  getReviews,
  getReviewDetail, // Hàm lấy chi tiết
  approveReview,
  rejectReview,
  respondToReview,
  deleteReview,
};