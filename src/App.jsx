// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Layouts ---
import MainLayout from './components/layout/MainLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx'; // Import Admin Layout

// --- Auth Components ---
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'; // User Protected Route
import AdminProtectedRoute from './components/auth/AdminProtectedRoute.jsx'; // Admin Protected Route

// --- User Pages ---
import HomePage from './pages/HomePage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import MenuItemDetailPage from './pages/MenuItemDetailPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import BookingSuccessPage from './pages/BookingSuccessPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import MyAccountPage from './pages/MyAccountPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import MyFavoritesPage from './pages/MyFavoritesPage.jsx';
import AboutPage from './pages/AboutPage.jsx'; // Import trang Giới thiệu
import ContactPage from './pages/ContactPage.jsx'; // Import trang Liên hệ
import NotFoundPage from './pages/NotFoundPage.jsx';
// TODO: Import trang/modal viết review khi tạo
// import WriteReviewPage from './pages/WriteReviewPage.jsx';

// --- Admin Pages ---
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'; // đủ
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'; // đủ
import AdminBookingListPage from './pages/admin/AdminBookingListPage.jsx'; // đủ
import AdminCategoryListPage from './pages/admin/AdminCategoryListPage.jsx'; // đủ
import AdminMenuItemListPage from './pages/admin/AdminMenuItemListPage.jsx'; // đủ
import AdminTableTypeListPage from './pages/admin/AdminTableTypeListPage.jsx'; //đủ
import AdminTableListPage from './pages/admin/AdminTableListPage.jsx'; //đủ
import AdminUserListPage from './pages/admin/AdminUserListPage.jsx';  //đủ
import AdminReviewListPage from './pages/admin/AdminReviewListPage.jsx'; //đủ
import AdminPromotionListPage from './pages/admin/AdminPromotionListPage.jsx'; 


import './App.css'; // Optional global App styles

function App() {
  return (
    <Routes>
      {/* ========================== */}
      {/*      USER ROUTES           */}
      {/* ========================== */}

      {/* Routes công khai và các route dùng MainLayout */}
      <Route path="/" element={<MainLayout />}>
        {/* Public User Routes */}
        <Route index element={<HomePage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="menu/:slug" element={<MenuItemDetailPage />} />
        <Route path="about" element={<AboutPage />} />      {/* Thêm route Giới thiệu */}
        <Route path="contact" element={<ContactPage />} />    {/* Thêm route Liên hệ */}
        {/* TODO: Thêm các trang public khác nếu có */}

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="booking" element={<BookingPage />} />
          <Route path="booking/success" element={<BookingSuccessPage />} />
          <Route path="my-account" element={<MyAccountPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
          {/* Route xem chi tiết booking user (nếu tạo trang riêng) */}
          {/* <Route path="my-bookings/:bookingId" element={<MyBookingDetailPage />} /> */}
          <Route path="my-favorites" element={<MyFavoritesPage />} />
          {/* TODO: Route viết review */}
          {/* <Route path="write-review/:bookingId" element={<WriteReviewPage />} /> */}
        </Route>
      </Route>

      {/* Standalone User Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}


      {/* Trang Login của Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Các trang Admin cần đăng nhập */}
      <Route path="/admin" > {/* Bảo vệ */}
          <Route element={<AdminLayout />}> {/* Dùng layout admin */}
              {/* Trang chính admin */}
              <Route index element={<AdminDashboardPage />} />
              {/* Các trang quản lý danh sách */}
              <Route path="bookings" element={<AdminBookingListPage />} />
              <Route path="categories" element={<AdminCategoryListPage />} />
              <Route path="menu-items" element={<AdminMenuItemListPage />} />
              <Route path="table-types" element={<AdminTableTypeListPage />} />
              <Route path="tables" element={<AdminTableListPage />} />
              <Route path="users" element={<AdminUserListPage />} />
              <Route path="reviews" element={<AdminReviewListPage />} />
              <Route path="promotions" element={<AdminPromotionListPage />} />
          </Route>
      </Route>
       <Route path="*" element={<NotFoundPage />} /> {/* Đặt ở cuối cùng */}

    </Routes>
  );
}

export default App;