// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Import hook xác thực của User
import { Spinner, Container } from 'react-bootstrap'; // Để hiển thị loading

/**
 * Component Route bảo vệ cho các trang yêu cầu người dùng (User) đăng nhập.
 * Kiểm tra trạng thái xác thực từ AuthContext.
 * Nếu chưa đăng nhập, chuyển hướng đến trang Login.
 * Nếu đang kiểm tra xác thực ban đầu, hiển thị trạng thái loading.
 * Nếu đã đăng nhập, hiển thị component con (trang được bảo vệ) thông qua <Outlet />.
 */
function ProtectedRoute() {
  // Lấy trạng thái xác thực và trạng thái loading từ AuthContext của User
  const { isAuthenticated, loading: authLoading } = useAuth();
  // Lấy vị trí hiện tại để lưu lại khi chuyển hướng login
  const location = useLocation();

  // --- Xử lý trạng thái Loading ---
  // Khi AuthProvider đang kiểm tra token ban đầu (authLoading=true),
  // hiển thị loading để tránh chuyển hướng về login quá sớm.
  if (authLoading) {
    console.log("ProtectedRoute (User): Auth loading..."); // Log để debug
    return (
      <Container className="vh-100 d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Loading user state...</span>
        </Spinner>
      </Container>
    );
  }

  // --- Xử lý Chuyển Hướng nếu Chưa Xác Thực ---
  // Sau khi hết loading (authLoading=false), nếu user không được xác thực
  if (!isAuthenticated) {
    console.log('ProtectedRoute (User): Not authenticated, redirecting to login from:', location.pathname);
    // Sử dụng component Navigate để chuyển hướng
    return (
        <Navigate
            to="/login" // Đường dẫn đến trang đăng nhập User
            replace // Thay thế trang hiện tại trong history
            // Lưu lại đường dẫn hiện tại vào state của location để trang login có thể redirect về
            state={{ from: location }}
        />
    );
  }

  // --- Nếu Đã Xác Thực ---
  // Render component con (route lồng bên trong ProtectedRoute trong App.jsx)
  console.log("ProtectedRoute (User): Authenticated, rendering outlet."); // Log để debug
  return <Outlet />;
}

export default ProtectedRoute; // Export component theo kiểu default