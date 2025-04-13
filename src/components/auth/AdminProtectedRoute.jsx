// src/components/auth/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // <<--- DÙNG HOOK ADMIN
import { Spinner, Container } from 'react-bootstrap';

function AdminProtectedRoute() {
  const { isAdminAuthenticated, loading } = useAuthAdmin(); // <<--- Lấy state từ hook admin
  const location = useLocation();

  if (loading) { // <<--- Check loading từ context admin
    return <Container className="vh-100 d-flex justify-content-center align-items-center"><Spinner animation="border" variant="primary" /></Container>;
  }

  if (!isAdminAuthenticated) { // <<--- Check isAuthenticated từ context admin
    console.log('Admin not authenticated, redirecting to admin login from:', location.pathname);
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
export default AdminProtectedRoute;