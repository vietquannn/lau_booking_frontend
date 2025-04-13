// src/services/auth.service.js
import apiClient from './api'; // Import configured Axios instance

const register = (userData) => {
  // userData là object chứa name, email, password, password_confirmation, phone_number
  console.log('Calling API: POST /register');
  return apiClient.post('/register', userData);
};

const login = (email, password) => {
  console.log('Calling API: POST /login');
  return apiClient.post('/login', { email, password });
};

const logout = () => {
  console.log('Calling API: POST /logout');
  // API logout cần token, interceptor sẽ tự thêm vào
  return apiClient.post('/logout');
};

const getUser = () => {
    console.log('Calling API: GET /user');
     // API get user cần token, interceptor sẽ tự thêm vào
    return apiClient.get('/user');
}

// Export các hàm dưới dạng một object
export const authService = {
  register,
  login,
  logout,
  getUser,
};