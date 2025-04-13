// src/hooks/useAuthAdmin.js
import { useContext } from 'react';
import AdminAuthContext from '../contexts/AdminAuthContext';

/**
 * Custom Hook to access AdminAuthContext with safety checks
 * @returns {object} Values from AdminAuthContext
 */
export const useAuthAdmin = () => {
  const context = useContext(AdminAuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthAdmin must be used within an AdminAuthProvider');
  }
  
  return context;
};