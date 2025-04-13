// src/services/admin.menuitem.service.js
import apiClient from './api'; // Import Axios instance đã cấu hình

/**
 * Lấy danh sách món ăn (Admin).
 * @param {object} params - Tham số query (page, search, category_id, status, is_hot, sort_by, sort_dir, per_page...)
 * @returns {Promise} Axios Promise (Trả về dữ liệu phân trang)
 */
const getMenuItems = (params = {}) => {
  console.log('Calling API: GET /admin/menu-items with params:', params);
  // Token Admin được thêm tự động
  return apiClient.get('/admin/menu-items', { params });
};

/**
 * Tạo một món ăn mới (Admin).
 * Gửi dưới dạng FormData để hỗ trợ upload ảnh.
 * @param {FormData} formData - Dữ liệu món ăn và file ảnh (nếu có)
 * @returns {Promise} Axios Promise
 */
const createMenuItem = (formData) => {
    console.log('Calling API: POST /admin/menu-items with FormData');
    return apiClient.post('/admin/menu-items', formData, {
        headers: {
            'Content-Type': 'multipart/form-data', // Quan trọng khi gửi FormData
        },
    });
};

/**
 * Lấy chi tiết một món ăn bằng slug hoặc ID (Admin).
 * @param {string|number} identifier - Slug hoặc ID của món ăn
 * @returns {Promise} Axios Promise
 */
const getMenuItemDetail = (identifier) => {
    console.log(`Calling API: GET /admin/menu-items/${identifier}`);
    return apiClient.get(`/admin/menu-items/${identifier}`);
};


/**
 * Cập nhật một món ăn (Admin).
 * Gửi dưới dạng FormData (vì có thể cập nhật ảnh) và dùng POST với _method=PATCH.
 * @param {string|number} identifier - Slug hoặc ID của món ăn cần cập nhật
 * @param {FormData} formData - Dữ liệu cập nhật (phải chứa _method='PATCH' hoặc _method='PUT')
 * @returns {Promise} Axios Promise
 */
const updateMenuItem = (identifier, formData) => {
    console.log(`Calling API: POST /admin/menu-items/${identifier} with FormData (using _method)`);
     // Đảm bảo _method được thêm vào FormData trước khi gọi hàm này nếu backend dùng POST
     // formData.append('_method', 'PATCH'); // Thêm dòng này nếu cần
    return apiClient.post(`/admin/menu-items/${identifier}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

/**
 * Xóa một món ăn (Admin).
 * @param {string|number} identifier - Slug hoặc ID của món ăn cần xóa
 * @returns {Promise} Axios Promise
 */
const deleteMenuItem = (identifier) => {
    console.log(`Calling API: DELETE /admin/menu-items/${identifier}`);
    return apiClient.delete(`/admin/menu-items/${identifier}`);
};

/**
 * Upload/Thay đổi ảnh đại diện cho món ăn (Admin).
 * Endpoint riêng biệt, dùng POST và FormData.
 * @param {string|number} identifier - Slug hoặc ID của món ăn
 * @param {FormData} formData - Phải chứa key 'image' với giá trị là File object
 * @returns {Promise} Axios Promise
 */
const uploadMenuItemImage = (identifier, formData) => {
    console.log(`Calling API: POST /admin/menu-items/${identifier}/upload-image`);
    return apiClient.post(`/admin/menu-items/${identifier}/upload-image`, formData, {
         headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

/**
 * Bật/tắt trạng thái 'is_hot' cho món ăn (Admin).
 * @param {string|number} identifier - Slug hoặc ID của món ăn
 * @returns {Promise} Axios Promise
 */
const toggleMenuItemHot = (identifier) => {
    console.log(`Calling API: PATCH /admin/menu-items/${identifier}/toggle-hot`);
    return apiClient.patch(`/admin/menu-items/${identifier}/toggle-hot`);
};

/**
 * Cập nhật trạng thái 'status' (available/unavailable) cho món ăn (Admin).
 * @param {string|number} identifier - Slug hoặc ID của món ăn
 * @param {'available' | 'unavailable'} status - Trạng thái mới
 * @returns {Promise} Axios Promise
 */
const updateMenuItemStatus = (identifier, status) => {
     console.log(`Calling API: PATCH /admin/menu-items/${identifier}/update-status`);
    return apiClient.patch(`/admin/menu-items/${identifier}/update-status`, { status });
};


// Export các hàm dưới dạng một object
export const adminMenuItemService = {
  getMenuItems,
  createMenuItem,
  getMenuItemDetail, // Thêm hàm lấy chi tiết
  updateMenuItem,
  deleteMenuItem,
  uploadMenuItemImage, // Hàm upload ảnh riêng
  toggleMenuItemHot, // Hàm bật/tắt hot
  updateMenuItemStatus, // Hàm cập nhật status
};