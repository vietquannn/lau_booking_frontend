import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Footer() {
    return (
        <footer className="bg-dark text-light mt-auto py-4"> {/* mt-auto pushes footer down */}
            <Container>
                <Row className="gy-3">
                    <Col md={4} className="text-center text-md-start">
                        <h5>Nhà Hàng Lẩu Ngon</h5>
                        <p className="small">Nơi hội tụ tinh hoa ẩm thực lẩu Việt.</p>
                        <p className="small mb-1">Địa chỉ: 20 - Đồng Cương - Yên Lạc - Vĩnh Phúc</p>
                        <p className="small">Điện thoại: <a href="tel:0354076413" className="text-light text-decoration-none">0354 076 413</a></p>
                    </Col>
                    <Col md={2} className="text-center text-md-start">
                        <h5>Liên kết</h5>
                        <Nav className="flex-column small">
                            <Nav.Link as={Link} to="/" className="text-light px-0 py-1">Trang chủ</Nav.Link>
                            <Nav.Link as={Link} to="/menu" className="text-light px-0 py-1">Thực đơn</Nav.Link>
                            <Nav.Link as={Link} to="/booking" className="text-light px-0 py-1">Đặt bàn</Nav.Link>
                        </Nav>
                    </Col>
                     <Col md={3} className="text-center text-md-start">
                        <h5>Giờ mở cửa</h5>
                        <p className="small mb-1">Thứ 2 - Chủ Nhật</p>
                        <p className="small fw-bold">10:00 AM - 10:00 PM</p>
                    </Col>
                    <Col md={3} className="text-center text-md-start">
                        <h5>Kết nối</h5>
                        <div className="d-flex justify-content-center justify-content-md-start fs-4">
                            <a href="https://www.facebook.com/vietquan06" target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none me-3">
                                <i className="bi bi-facebook"></i>
                            </a>
                            {/* Add other social media icons here when available */}
                        </div>
                    </Col>
                </Row>
                <hr className="mt-4" style={{ borderColor: '#6c757d' }}/>
                <p className="text-center small mb-0">
                    © {new Date().getFullYear()} Nhà Hàng Lẩu Ngon. Designed with <span style={{color: 'red'}}>❤</span>.
                </p>
            </Container>
        </footer>
    );
}
export default Footer;