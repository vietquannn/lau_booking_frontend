// src/services/booking.service.js
import apiClient from './api'; // Import configured Axios instance

// API kiểm tra slot trống (loại bàn + giờ)
const getAvailableSlots = (date, numGuests) => {
  return apiClient.get('/available-slots', {
    params: { date, num_guests: numGuests }
  });
};

// API lấy danh sách bàn cụ thể trống
const getAvailableTables = (date, time, numGuests) => {
  return apiClient.get('/available-tables', {
    params: { date, time, num_guests: numGuests }
  });
};

// API tạo đơn đặt bàn mới
const createBooking = (bookingData) => {
  // bookingData là object chứa: booking_date, booking_time, num_guests,
  // table_id OR table_type_id, items (array), payment_method, promotion_code, special_requests
  return apiClient.post('/bookings', bookingData);
  // Lưu ý: Header Authorization được tự động thêm bởi interceptor trong api.js
};

// API lấy lịch sử đặt bàn của user (có phân trang, lọc)
const getMyBookings = (page = 1, status = '') => {
  const params = { page };
  if (status) {
    params.status = status;
  }
  // TODO: Thêm các tham số lọc/sắp xếp khác nếu cần
  console.log('Calling API: GET /my-bookings with params:', params);
  return apiClient.get('/my-bookings', { params });
  // Lưu ý: Header Authorization được tự động thêm
};

// API lấy chi tiết một đơn đặt bàn của user
const getMyBookingDetail = (bookingId) => {
    console.log(`Calling API: GET /my-bookings/${bookingId}`);
    return apiClient.get(`/my-bookings/${bookingId}`);
};

// API hủy đơn đặt bàn của user
const cancelMyBooking = (bookingId) => {
    console.log(`Calling API: PATCH /my-bookings/${bookingId}/cancel`);
    return apiClient.patch(`/my-bookings/${bookingId}/cancel`);
    // Token được thêm tự động
};


// Export các hàm
export const bookingService = {
  getAvailableSlots,
  getAvailableTables,
  createBooking,
  getMyBookings,
  getMyBookingDetail,
  cancelMyBooking,
};