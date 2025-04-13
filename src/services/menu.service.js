// src/services/menu.service.js
import apiClient from './api';

const getFullMenu = () => {
  // console.log('Calling API: GET /menu'); // Logging moved to interceptor
  return apiClient.get('/menu');
};

const getCategories = () => {
    return apiClient.get('/categories');
};

const getMenuItemsByCategory = (categorySlug) => {
    return apiClient.get(`/categories/${categorySlug}/menu-items`);
};

const getHotItems = () => {
    return apiClient.get('/menu-items/hot');
};

const searchMenuItems = (params) => { // params = { q: 'lau', category: '...', ... }
    return apiClient.get('/menu-items', { params });
};

const getMenuItemDetail = (slug) => {
    return apiClient.get(`/menu-items/${slug}`);
};


export const menuService = {
  getFullMenu,
  getCategories,
  getMenuItemsByCategory,
  getHotItems,
  searchMenuItems,
  getMenuItemDetail,
};