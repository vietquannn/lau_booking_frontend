// src/hooks/useAuthAdmin.js
import { useContext } from 'react';
import AdminAuthContext from '../contexts/AdminAuthContext.jsx'; // Import context Admin

/**
 * Custom Hook để truy cập AdminAuthContext.
 * @returns {object} Giá trị từ AdminAuthContext
 */
export const useAuthAdmin = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAuthAdmin must be used within an AdminAuthProvider');
  }
  if (context === null) {
       console.warn('AdminAuthProvider value is null.');
       // Trả về giá trị mặc định an toàn
       return { admin: null, adminToken: null, isAdminAuthenticated: false, loading: true, error: 'Admin context not available', login: async () => {}, logout: async () => {}, loadAdmin: async () => {}, setError: () => {} };
  }
  return context;
};