// src/components/layout/AdminLayout.jsx
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Nav, Navbar, Button, Offcanvas } from 'react-bootstrap'; // Thêm Offcanvas cho mobile
import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // <<--- Tạo hook này sau

function AdminLayout() {
    // TODO: Tạo và sử dụng hook useAuthAdmin để lấy thông tin admin và hàm logout
    // const { admin, logout } = useAuthAdmin();
    const admin = JSON.parse(localStorage.getItem('adminData') || 'null'); // Tạm thời
    const navigate = useNavigate();
    const [showSidebar, setShowSidebar] = useState(false); // State cho Offcanvas sidebar

    const handleLogout = async () => {
        console.log('Admin logging out...');
        // await logout(); // Gọi hàm logout từ context/hook
        localStorage.removeItem('adminToken'); // Tạm thời
        localStorage.removeItem('adminData');
        navigate('/admin/login'); // Chuyển hướng về login admin
    };

    const handleCloseSidebar = () => setShowSidebar(false);
    const handleShowSidebar = () => setShowSidebar(true);

    // Nếu chưa có admin (chưa login), có thể redirect ngay ở đây hoặc để ProtectedRoute xử lý
    // if (!admin) return <Navigate to="/admin/login" replace />;

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            {/* Sidebar cho màn hình lớn */}
            <Nav className="flex-column bg-dark text-white p-3 d-none d-lg-block" style={{ width: '250px' }}>
                <Navbar.Brand as={Link} to="/admin" className="text-white mb-3 d-block fs-5">
                    <i className="bi bi-shield-lock-fill me-2"></i>Admin Panel
                </Navbar.Brand>
                <Nav.Link as={Link} to="/admin/bookings" className="text-white-50 hover-light"><i className="bi bi-calendar-check me-2"></i>Quản lý Đặt Bàn</Nav.Link>
                <Nav.Link as={Link} to="/admin/menu-items" className="text-white-50 hover-light"><i className="bi bi-journal-richtext me-2"></i>Quản lý Món Ăn</Nav.Link>
                <Nav.Link as={Link} to="/admin/categories" className="text-white-50 hover-light"><i className="bi bi-tags-fill me-2"></i>Quản lý Danh Mục</Nav.Link>
                <Nav.Link as={Link} to="/admin/tables" className="text-white-50 hover-light"><i className="bi bi-grid-3x3-gap-fill me-2"></i>Quản lý Bàn</Nav.Link>
                <Nav.Link as={Link} to="/admin/table-types" className="text-white-50 hover-light"><i className="bi bi-bounding-box me-2"></i>Quản lý Loại Bàn</Nav.Link>
                <Nav.Link as={Link} to="/admin/users" className="text-white-50 hover-light"><i className="bi bi-people-fill me-2"></i>Quản lý Users</Nav.Link>
                <Nav.Link as={Link} to="/admin/reviews" className="text-white-50 hover-light"><i className="bi bi-star-half me-2"></i>Quản lý Đánh Giá</Nav.Link>
                <Nav.Link as={Link} to="/admin/promotions" className="text-white-50 hover-light"><i className="bi bi-percent me-2"></i>Quản lý Khuyến Mãi</Nav.Link>
                {/* <Nav.Link as={Link} to="/admin/reports" className="text-white-50 hover-light"><i className="bi bi-graph-up me-2"></i>Báo cáo</Nav.Link> */}
                <hr className='text-secondary' />
                 {admin && <span className="text-info small ms-2">Xin chào, {admin.name}</span>}
                <Button variant="outline-danger" size="sm" onClick={handleLogout} className="mt-auto d-block w-100">Đăng xuất</Button> {/* Nút logout ở cuối */}
            </Nav>

             {/* Nút bật Sidebar cho màn hình nhỏ */}
            <Button variant="dark" className="d-lg-none position-fixed top-0 start-0 m-2" onClick={handleShowSidebar} style={{ zIndex: 1030 }}>
                 <i className="bi bi-list"></i>
             </Button>

            {/* Offcanvas Sidebar cho màn hình nhỏ */}
            <Offcanvas show={showSidebar} onHide={handleCloseSidebar} placement="start" className="bg-dark text-white">
                <Offcanvas.Header closeButton closeVariant="white">
                     <Offcanvas.Title>
                          <i className="bi bi-shield-lock-fill me-2"></i>Admin Panel
                     </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                     <Nav className="flex-column">
                        {/* Copy các Nav.Link từ Sidebar lớn vào đây */}
                        <Nav.Link as={Link} to="/admin/bookings" className="text-white-50 hover-light" onClick={handleCloseSidebar}><i className="bi bi-calendar-check me-2"></i>Quản lý Đặt Bàn</Nav.Link>
                        {/* ... Thêm các link khác ... */}
                         <Nav.Link as={Link} to="/admin/menu-items" className="text-white-50 hover-light" onClick={handleCloseSidebar}><i className="bi bi-journal-richtext me-2"></i>Món Ăn</Nav.Link>
                         <Nav.Link as={Link} to="/admin/categories" className="text-white-50 hover-light" onClick={handleCloseSidebar}><i className="bi bi-tags-fill me-2"></i>Danh Mục</Nav.Link>
                         {/* ... */}
                         <hr className='text-secondary' />
                         {admin && <span className="text-info small ms-2 mb-2 d-block">Xin chào, {admin.name}</span>}
                        <Button variant="outline-danger" size="sm" onClick={handleLogout} className="w-100">Đăng xuất</Button>
                     </Nav>
                </Offcanvas.Body>
            </Offcanvas>


            {/* Phần Content Chính */}
            <main className="flex-grow-1 p-3 p-md-4 bg-light"> {/* Thêm padding */}
                {/* Hiển thị component con của route admin */}
                <Outlet />
            </main>

            {/* Style cho hover effect (có thể đặt trong file CSS riêng) */}
            <style jsx global>{`
                .hover-light:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: white !important;
                    border-radius: 0.25rem;
                }
            `}</style>
        </div>
    );
}
export default AdminLayout;

// Thêm useState ở import React
import { useState } from 'react';