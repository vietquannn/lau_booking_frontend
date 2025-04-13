// src/services/admin.dashboard.service.js
import apiClient from './api'; // Import Axios instance đã cấu hình

/**
 * Lấy các số liệu thống kê nhanh cho Admin Dashboard.
 * Yêu cầu Admin Token (interceptor tự thêm).
 * API Backend cần được tạo: GET /api/admin/dashboard/stats
 * @returns {Promise} Axios Promise trả về { success: boolean, data: { pendingBookings: number, pendingReviews: number, todaysRevenue: number, totalUsers: number } }
 */
const getStats = () => {
  console.log('Calling API: GET /admin/dashboard/stats');
  return apiClient.get('/admin/dashboard/stats');
};

// Export service object
export const adminDashboardService = {
  getStats,
};