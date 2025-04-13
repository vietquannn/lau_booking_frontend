// src/contexts/AdminAuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { adminAuthService } from '../services/admin.auth.service';
import apiClient from '../services/api';

const AdminAuthContext = createContext({
  admin: null,
  adminToken: null,
  isAdminAuthenticated: false,
  loading: true,
  error: null,
  login: async (email, password) => {},
  logout: async () => {},
  loadAdmin: async () => {},
  clearError: () => {},
});

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(!!localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle token management
  const setTokenAndHeader = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('adminToken', newToken);
      setAdminToken(newToken);
      setIsAdminAuthenticated(true);
    } else {
      localStorage.removeItem('adminToken');
      setAdminToken(null);
      setIsAdminAuthenticated(false);
    }
  }, []);

  // Load admin data from storage or API
  const loadAdmin = useCallback(async () => {
    if (!localStorage.getItem('adminToken')) {
      setLoading(false);
      setIsAdminAuthenticated(false);
      setAdmin(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Use cached admin data first for faster UI rendering
    const storedAdmin = JSON.parse(localStorage.getItem('adminData') || 'null');
    if (storedAdmin) {
      setAdmin(storedAdmin);
      setIsAdminAuthenticated(true);
    }
    
    // Verify token and get latest admin data
    try {
      const response = await adminAuthService.getAdminUser();
      if (response.data?.success && response.data.data) {
        localStorage.setItem('adminData', JSON.stringify(response.data.data));
        setAdmin(response.data.data);
        setIsAdminAuthenticated(true);
      } else {
        throw new Error('Invalid admin data');
      }
    } catch (err) {
      console.error("Admin authentication failed:", err);
      setTokenAndHeader(null);
      localStorage.removeItem('adminData');
      setAdmin(null);
      setIsAdminAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [setTokenAndHeader]);

  // Initialize on mount
  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  // Admin login handler
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminAuthService.login(email, password);
      if (response.data?.success && response.data.data?.token && response.data.data?.admin) {
        const { admin: loggedInAdmin, token: newToken } = response.data.data;
        setTokenAndHeader(newToken);
        localStorage.setItem('adminData', JSON.stringify(loggedInAdmin));
        setAdmin(loggedInAdmin);
        setIsAdminAuthenticated(true);
        return loggedInAdmin;
      } else {
        throw new Error(response.data?.message || 'Admin login failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Admin login error';
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setTokenAndHeader]);

  // Admin logout handler
  const logout = useCallback(async () => {
    const currentToken = localStorage.getItem('adminToken');
    
    // Clear client state first for faster UI response
    setTokenAndHeader(null);
    localStorage.removeItem('adminData');
    setAdmin(null);
    setIsAdminAuthenticated(false);
    setError(null);

    // Then notify the server
    if (currentToken) {
      try {
        await apiClient.post('/admin/logout', {}, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
      } catch (error) {
        console.error("Admin logout API error:", error);
      }
    }
  }, [setTokenAndHeader]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoized context value
  const value = React.useMemo(() => ({
    admin,
    adminToken, 
    isAdminAuthenticated,
    loading,
    error,
    login,
    logout,
    loadAdmin,
    clearError
  }), [admin, adminToken, isAdminAuthenticated, loading, error, login, logout, loadAdmin, clearError]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;