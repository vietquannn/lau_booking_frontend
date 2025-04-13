// src/components/auth/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthAdmin } from '../../hooks/useAuthAdmin';
import { Spinner } from 'react-bootstrap';

function AdminProtectedRoute({ children }) {
  const { isAdminAuthenticated, loading } = useAuthAdmin();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}

export default AdminProtectedRoute;