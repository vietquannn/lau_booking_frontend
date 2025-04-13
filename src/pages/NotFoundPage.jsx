import React from 'react';
import { Container, Button, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    // Không dùng MainLayout cho trang 404
    <Container fluid className="text-center d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
       {/* Optional: Add an image */}
       {/* <Image src="/images/404-image.svg" fluid style={{ maxHeight: '300px', marginBottom: '2rem' }} /> */}
      <h1 className="display-1 fw-bolder text-primary mb-3">404</h1>
      <h2 className="mb-3">Ối! Có vẻ bạn đã đi lạc.</h2>
      <p className="lead text-muted mb-4 px-md-5">
        Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc địa chỉ URL bị sai.
      </p>
      <Button as={Link} to="/" variant="primary" size="lg">
         <i className="bi bi-house-door-fill me-2"></i> {/* Icon nhà */}
         Quay về Trang Chủ
      </Button>
    </Container>
  );
}

export default NotFoundPage;