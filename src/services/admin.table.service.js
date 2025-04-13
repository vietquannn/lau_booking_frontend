// src/services/admin.table.service.js
import apiClient from './api'; // Import Axios instance đã cấu hình

/**
 * Lấy danh sách tất cả các bàn (Admin).
 * @param {object} params - Tham số query (page, search, table_type_id, status, capacity, sort_by, sort_dir, per_page...)
 * @returns {Promise} Axios Promise (Trả về dữ liệu phân trang)
 */
const getTables = (params = {}) => {
  console.log('Calling API: GET /admin/tables with params:', params);
  // Token Admin được thêm tự động bởi interceptor trong api.js
  return apiClient.get('/admin/tables', { params });
};

/**
 * Tạo một bàn mới (Admin).
 * @param {object} tableData - Dữ liệu bàn { table_number, table_type_id, capacity, status?, location_description? }
 * @returns {Promise} Axios Promise
 */
const createTable = (tableData) => {
    console.log('Calling API: POST /admin/tables with data:', tableData);
    return apiClient.post('/admin/tables', tableData);
};

/**
 * Lấy chi tiết một bàn bằng ID (Admin).
 * @param {number} id - ID của bàn
 * @returns {Promise} Axios Promise
 */
const getTableDetail = (id) => {
    console.log(`Calling API: GET /admin/tables/${id}`);
    return apiClient.get(`/admin/tables/${id}`);
};


/**
 * Cập nhật thông tin một bàn (Admin).
 * Lưu ý: API này thường không dùng để cập nhật status thành 'reserved' hoặc 'occupied'.
 * @param {number} id - ID của bàn cần cập nhật
 * @param {object} tableData - Dữ liệu cập nhật { table_number?, table_type_id?, capacity?, status? ('available'|'maintenance'), location_description? }
 * @returns {Promise} Axios Promise
 */
const updateTable = (id, tableData) => {
    console.log(`Calling API: PATCH /admin/tables/${id} with data:`, tableData);
    // Sử dụng PATCH để chỉ gửi những trường cần cập nhật
    return apiClient.patch(`/admin/tables/${id}`, tableData);
    // Hoặc dùng PUT nếu backend yêu cầu gửi đủ các trường:
    // return apiClient.put(`/admin/tables/${id}`, tableData);
    // Hoặc dùng POST với _method nếu gặp vấn đề:
    // return apiClient.post(`/admin/tables/${id}`, { ...tableData, _method: 'PATCH' });
};

/**
 * Xóa một bàn (Admin).
 * @param {number} id - ID của bàn cần xóa
 * @returns {Promise} Axios Promise
 */
const deleteTable = (id) => {
    console.log(`Calling API: DELETE /admin/tables/${id}`);
    return apiClient.delete(`/admin/tables/${id}`);
};

/**
 * Cập nhật trạng thái của bàn thành 'available' hoặc 'maintenance' (Admin).
 * @param {number} id - ID của bàn
 * @param {'available' | 'maintenance'} status - Trạng thái mới
 * @returns {Promise} Axios Promise
 */
const updateTableStatus = (id, status) => {
    console.log(`Calling API: PATCH /admin/tables/${id}/update-status`);
    return apiClient.patch(`/admin/tables/${id}/update-status`, { status });
};


// Export các hàm dưới dạng một object
export const adminTableService = {
  getTables,
  createTable,
  getTableDetail, // Thêm hàm lấy chi tiết
  updateTable,
  deleteTable,
  updateTableStatus, // Hàm cập nhật status riêng
};