// src/services/admin.tabletype.service.js
import apiClient from './api'; // Import Axios instance đã cấu hình

/**
 * Lấy danh sách các loại bàn (Admin).
 * @param {object} params - Tham số query (vd: { search: 'vip', sort_by: 'name', sort_dir: 'desc' })
 * @returns {Promise} Axios Promise
 */
const getTableTypes = (params = {}) => {
  console.log('Calling API: GET /admin/table-types with params:', params);
  // Token Admin được thêm tự động bởi interceptor trong api.js
  return apiClient.get('/admin/table-types', { params })
    .then(response => {
      console.log('Table Types API Response:', response.data);
      return response;
    })
    .catch(error => {
      console.error('Table Types API Error:', error.response?.data || error);
      throw error;
    });
};

/**
 * Tạo một loại bàn mới (Admin).
 * @param {object} tableTypeData - Dữ liệu loại bàn { name, description?, surcharge? }
 * @returns {Promise} Axios Promise
 */
const createTableType = (tableTypeData) => {
    console.log('Calling API: POST /admin/table-types with data:', tableTypeData);
    return apiClient.post('/admin/table-types', tableTypeData);
};

/**
 * Lấy chi tiết một loại bàn bằng ID (Admin).
 * @param {number} id - ID của loại bàn
 * @returns {Promise} Axios Promise
 */
const getTableTypeDetail = (id) => {
    console.log(`Calling API: GET /admin/table-types/${id}`);
    return apiClient.get(`/admin/table-types/${id}`);
};


/**
 * Cập nhật một loại bàn (Admin).
 * @param {number} id - ID của loại bàn cần cập nhật
 * @param {object} tableTypeData - Dữ liệu cập nhật { name?, description?, surcharge? }
 * @returns {Promise} Axios Promise
 */
const updateTableType = (id, tableTypeData) => {
    console.log(`Calling API: PATCH /admin/table-types/${id} with data:`, tableTypeData);
    // Sử dụng PATCH để chỉ gửi những trường cần cập nhật
    return apiClient.patch(`/admin/table-types/${id}`, tableTypeData);
    // Lưu ý: Nếu backend yêu cầu PUT hoặc POST với _method, hãy thay đổi ở đây
    // return apiClient.put(`/admin/table-types/${id}`, tableTypeData);
    // return apiClient.post(`/admin/table-types/${id}`, { ...tableTypeData, _method: 'PATCH' });
};

/**
 * Xóa một loại bàn (Admin).
 * @param {number} id - ID của loại bàn cần xóa
 * @returns {Promise} Axios Promise
 */
const deleteTableType = (id) => {
    console.log(`Calling API: DELETE /admin/table-types/${id}`);
    return apiClient.delete(`/admin/table-types/${id}`);
};


// Export các hàm dưới dạng một object
export const adminTableTypeService = {
  getTableTypes,
  createTableType,
  getTableTypeDetail, // Thêm hàm này nếu component show cần dùng
  updateTableType,
  deleteTableType,
};