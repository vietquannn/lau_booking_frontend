// src/services/favorite.service.js
import apiClient from './api';

const getFavorites = (page = 1, perPage = 12) => {
  console.log(`Calling API: GET /favorites?page=${page}&per_page=${perPage}`);
  return apiClient.get('/favorites', { params: { page, per_page: perPage } });
};

const addFavorite = (menuItemIdentifier) => {
   console.log(`Calling API: POST /favorites/${menuItemIdentifier}`);
   return apiClient.post(`/favorites/${menuItemIdentifier}`);
};

const removeFavorite = (menuItemIdentifier) => {
   console.log(`Calling API: DELETE /favorites/${menuItemIdentifier}`);
   return apiClient.delete(`/favorites/${menuItemIdentifier}`);
};

const getFavoriteIds = () => {
  console.log('Calling API: GET /favorites/ids');
  return apiClient.get('/favorites/ids');
};

export const favoriteService = {
  getFavorites,
  addFavorite,
  removeFavorite,
  getFavoriteIds,
};