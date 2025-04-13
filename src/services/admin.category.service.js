// src/services/admin.category.service.js
import apiClient from './api'; // Import Axios instance đã cấu hình

/**
 * Lấy danh sách categories phía Admin (có phân trang, tìm kiếm).
 * @param {object} params - Các tham số query (page, search, sort_by, sort_dir, per_page)
 * @returns {Promise} Axios Promise
 */
const getCategories = (params = {}) => {
  console.log('Calling API: GET /admin/categories with params:', params);
  
  // Nếu per_page là -1, thay đổi thành một số lớn để lấy nhiều dữ liệu
  if (params.per_page === -1) {
    params.per_page = 1000; // Số lớn để lấy nhiều dữ liệu
  }
  
  // Token Admin được thêm tự động bởi interceptor trong api.js
  return apiClient.get('/admin/categories', { params })
    .then(response => {
      console.log('API Categories Response:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API Categories Error:', error);
      throw error;
    });
};

/**
 * Lấy tất cả categories không phân trang.
 * @returns {Promise} Axios Promise
 */
const getAllCategories = () => {
  console.log('Calling API: GET /admin/categories/all');
  return apiClient.get('/admin/categories/all')
    .then(response => {
      console.log('API All Categories Response:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API All Categories Error:', error);
      throw error;
    });
};

/**
 * Tạo một category mới.
 * @param {object} categoryData - Dữ liệu category { name, description }
 * @returns {Promise} Axios Promise
 */
const createCategory = (categoryData) => {
    console.log('Calling API: POST /admin/categories with data:', categoryData);
    return apiClient.post('/admin/categories', categoryData);
};

/**
 * Lấy chi tiết một category bằng slug hoặc ID.
 * @param {string|number} identifier - Slug hoặc ID của category
 * @returns {Promise} Axios Promise
 */
const getCategoryDetail = (identifier) => {
    console.log(`Calling API: GET /admin/categories/${identifier}`);
    return apiClient.get(`/admin/categories/${identifier}`);
};


/**
 * Cập nhật một category.
 * @param {string|number} identifier - Slug hoặc ID của category cần cập nhật
 * @param {object} categoryData - Dữ liệu cập nhật { name?, description? }
 * @returns {Promise} Axios Promise
 */
const updateCategory = (identifier, categoryData) => {
    console.log(`Calling API: PATCH /admin/categories/${identifier} with data:`, categoryData);
    // Sử dụng PATCH để chỉ gửi những trường cần cập nhật
    return apiClient.patch(`/admin/categories/${identifier}`, categoryData);
    // Hoặc dùng PUT nếu backend yêu cầu gửi đủ các trường:
    // return apiClient.put(`/admin/categories/${identifier}`, categoryData);
    // Hoặc dùng POST với _method nếu gặp vấn đề với PATCH/PUT:
    // return apiClient.post(`/admin/categories/${identifier}`, { ...categoryData, _method: 'PATCH' });
};

/**
 * Xóa một category.
 * @param {string|number} identifier - Slug hoặc ID của category cần xóa
 * @returns {Promise} Axios Promise
 */
const deleteCategory = (identifier) => {
    console.log(`Calling API: DELETE /admin/categories/${identifier}`);
    return apiClient.delete(`/admin/categories/${identifier}`);
};


// Export các hàm dưới dạng một object
export const adminCategoryService = {
  getCategories,
  getAllCategories, // Thêm hàm lấy tất cả categories
  createCategory,
  getCategoryDetail, // Thêm hàm lấy chi tiết nếu cần dùng
  updateCategory,
  deleteCategory,
};