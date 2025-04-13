// src/services/review.service.js
import apiClient from './api';

/**
 * Gửi đánh giá mới cho một booking.
 * Yêu cầu xác thực (token được thêm tự động).
 * @param {object} reviewData Dữ liệu đánh giá { booking_id, rating, comment, is_anonymous }
 * @returns {Promise} Axios Promise
 */
const submitReview = (reviewData) => {
  console.log('Calling API: POST /reviews with data:', reviewData);
  return apiClient.post('/reviews', reviewData);
};

/**
 * Lấy danh sách đánh giá nổi bật (đã duyệt, rating cao).
 * @param {number} limit Số lượng muốn lấy
 * @returns {Promise} Axios Promise
 */
const getFeaturedReviews = (limit = 5) => {
    console.log(`Calling API: GET /reviews/featured?limit=${limit}`);
    return apiClient.get('/reviews/featured', { params: { limit } });
};

// Có thể thêm hàm lấy review của user sau này nếu cần
// const getMyReviewForBooking = (bookingId) => { ... }

export const reviewService = {
  submitReview,
  getFeaturedReviews,
  // getMyReviewForBooking
};