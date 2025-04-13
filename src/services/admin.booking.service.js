// src/services/admin.booking.service.js
import apiClient from './api';

/**
 * Lấy danh sách tất cả đơn đặt bàn (Admin).
 * @param {object} params - Tham số query (page, status, date, search, sort_by, sort_dir, limit, per_page...)
 * @returns {Promise} Axios Promise (Trả về dữ liệu phân trang)
 */
const getBookings = (params = {}) => {
  console.log('Calling API: GET /admin/bookings with params:', params);
  return apiClient.get('/admin/bookings', { params });
};

/**
 * Lấy chi tiết một đơn đặt bàn bằng ID (Admin).
 * @param {number} bookingId - ID của booking
 * @returns {Promise} Axios Promise
 */
const getBookingDetail = (bookingId) => {
    console.log(`Calling API: GET /admin/bookings/${bookingId}`);
    return apiClient.get(`/admin/bookings/${bookingId}`);
};

/**
 * Xác nhận một đơn đặt bàn (Admin).
 * @param {number} bookingId - ID của booking
 * @returns {Promise} Axios Promise
 */
const confirmBooking = (bookingId) => {
    console.log(`Calling API: PATCH /admin/bookings/${bookingId}/confirm`);
    return apiClient.patch(`/admin/bookings/${bookingId}/confirm`);
};

/**
 * Hủy một đơn đặt bàn (Admin).
 * @param {number} bookingId - ID của booking
 * @param {string} [reason] - Lý do hủy (optional)
 * @returns {Promise} Axios Promise
 */
const cancelBooking = (bookingId, reason = null) => {
    console.log(`Calling API: PATCH /admin/bookings/${bookingId}/cancel`);
    const data = reason ? { reason } : {};
    return apiClient.patch(`/admin/bookings/${bookingId}/cancel`, data);
};

/**
 * Cập nhật trạng thái của một đơn đặt bàn (completed/no_show) (Admin).
 * @param {number} bookingId - ID của booking
 * @param {'completed' | 'no_show'} status - Trạng thái mới
 * @returns {Promise} Axios Promise
 */
const updateBookingStatus = (bookingId, status) => {
    console.log(`Calling API: PATCH /admin/bookings/${bookingId}/update-status`);
    return apiClient.patch(`/admin/bookings/${bookingId}/update-status`, { status });
};

/**
 * Thay đổi bàn đã gán cho một đơn đặt bàn (Admin).
 * @param {number} bookingId - ID của booking
 * @param {number} newTableId - ID của bàn mới
 * @returns {Promise} Axios Promise
 */
const updateBookingTable = (bookingId, newTableId) => {
    console.log(`Calling API: PATCH /admin/bookings/${bookingId}/update-table`);
    return apiClient.patch(`/admin/bookings/${bookingId}/update-table`, { table_id: newTableId });
};

/**
 * Xác nhận thanh toán thủ công cho đơn hàng (Admin).
 * @param {number} bookingId - ID của booking
 * @param {string} [transactionId] - Mã giao dịch từ ngân hàng (optional)
 * @returns {Promise} Axios Promise
 */
const confirmPayment = (bookingId, transactionId = null) => {
     console.log(`Calling API: PATCH /admin/bookings/${bookingId}/confirm-payment`);
     const data = transactionId ? { transaction_id: transactionId } : {};
     return apiClient.patch(`/admin/bookings/${bookingId}/confirm-payment`, data);
};


// Export service object
export const adminBookingService = {
  getBookings,
  getBookingDetail,
  confirmBooking,
  cancelBooking,
  updateBookingStatus,
  updateBookingTable,
  confirmPayment,
};