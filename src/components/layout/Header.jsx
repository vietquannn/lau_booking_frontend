// src/components/layout/Header.jsx
import React from 'react'; // <--- Bỏ useContext nếu không dùng trực tiếp ở đây
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav, NavDropdown, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth'; // <--- Import useAuth

function Header() {
    // Lấy state và hàm từ AuthContext qua hook useAuth
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    // const { cartItemCount } = React.useContext(CartContext) || { cartItemCount: 0 }; // Tạm thời
    const cartItemCount = 0;

    const handleLogout = async () => {
        console.log('Logging out user...');
        try {
            await logout(); // Gọi hàm logout từ context
            navigate('/'); // Chuyển hướng về trang chủ
        } catch (error) {
            console.error('Logout failed:', error);
            // Có thể hiển thị thông báo lỗi logout nếu cần
        }
    };

    return (
        <Navbar bg="white" expand="lg" sticky="top" className="shadow-sm mb-3 border-bottom">
            <Container>
                <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center">
                    <img
                      src="/logo.png"
                      width="35"
                      height="35"
                      className="d-inline-block align-top me-2"
                      alt="Lẩu Ngon Logo"
                    />
                    <span>Lẩu Ngon</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={NavLink} to="/" end>Trang chủ</Nav.Link>
                        <Nav.Link as={NavLink} to="/menu">Thực đơn</Nav.Link>
                        {/* Chỉ hiển thị link Đặt bàn nếu đã đăng nhập */}
                        {isAuthenticated && <Nav.Link as={NavLink} to="/booking">Đặt bàn</Nav.Link>}
                        <Nav.Link as={NavLink} to="/about">Giới thiệu</Nav.Link>
                        <Nav.Link as={NavLink} to="/contact">Liên hệ</Nav.Link>
                    </Nav>
                    <Nav className="ms-auto align-items-center">
                        {/* ... (Cart Icon Placeholder) ... */}

                        {/* Sử dụng isAuthenticated và user từ context */}
                        {isAuthenticated && user ? (
                            <NavDropdown
                                title={<> <span className="d-none d-lg-inline align-middle">Chào, {user.name}</span><span className="d-lg-none">Tài khoản</span></>}
                                id="user-nav-dropdown"
                                align="end"
                            >
                                <NavDropdown.Item as={Link} to="/my-account">Tài khoản</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/my-bookings">Lịch sử đặt bàn</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/my-favorites">Món yêu thích</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={handleLogout}>
                                    Đăng xuất
                                </NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <>
                                <Button as={Link} to="/login" variant="outline-primary" size="sm" className="me-2">Đăng nhập</Button>
                                <Button as={Link} to="/register" variant="primary" size="sm">Đăng ký</Button>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;