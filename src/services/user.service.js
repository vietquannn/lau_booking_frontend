// src/services/user.service.js
import apiClient from './api';

/**
 * Cập nhật thông tin profile của user đang đăng nhập.
 * @param {object} profileData - Object chứa { name, phone_number }
 * @returns {Promise} Axios Promise
 */
const updateProfile = (profileData) => {
    console.log('Calling API: PATCH /user/profile with data:', profileData);
    // Token được thêm tự động
    return apiClient.patch('/user/profile', profileData);
};

const changePassword = (passwordData) => {
    console.log('Calling API: POST /user/change-password');
    // Token được thêm tự động
    return apiClient.post('/user/change-password', passwordData);
};

// TODO: Thêm hàm changePassword sau
// const changePassword = (passwordData) => { ... }

export const userService = {
    updateProfile,
    changePassword,
};