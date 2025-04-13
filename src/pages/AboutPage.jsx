// src/pages/AboutPage.jsx
import React from 'react';
import { Container, Row, Col, Image, Card } from 'react-bootstrap';
// Optional: import styles from './AboutPage.module.css';

function AboutPage() {
  return (
    <Container className="page-container">
      <Row className="justify-content-center mb-4">
        <Col md={8} className="text-center">
          <h1 className="fw-bold">Về Lẩu Ngon</h1>
          <p className="lead text-muted">
            Hành trình mang hương vị lẩu đậm đà và không gian ấm cúng đến với mọi thực khách.
          </p>
          <hr />
        </Col>
      </Row>

      <Row className="align-items-center mb-5 gy-4">
        <Col md={6}>
          <Image
            src="/images/about-us-image.jpg" // <<--- Đặt ảnh giới thiệu vào public/images
            alt="Không gian Nhà Hàng Lẩu Ngon"
            fluid
            rounded
            className="shadow"
          />
        </Col>
        <Col md={6}>
          <h2>Câu Chuyện Của Chúng Tôi</h2>
          <p>
            Nhà Hàng Lẩu Ngon ra đời từ niềm đam mê bất tận với những nồi lẩu nghi ngút khói, nơi mọi người cùng quây quần, chia sẻ niềm vui và thưởng thức hương vị tuyệt hảo. Chúng tôi tin rằng, một bữa lẩu ngon không chỉ đến từ nguyên liệu tươi sạch, nước dùng đậm đà mà còn từ không gian ấm cúng và sự phục vụ tận tâm.
          </p>
          <p>
            Từ những ngày đầu tiên, chúng tôi đã không ngừng tìm tòi, sáng tạo để mang đến những loại nước lẩu độc đáo, kết hợp hài hòa giữa truyền thống và hiện đại, phù hợp với khẩu vị đa dạng của thực khách Việt.
          </p>
        </Col>
      </Row>

      <Row className="gy-4">
          <h2 className="text-center mb-4">Giá Trị Cốt Lõi</h2>
          <Col md={4}>
              <Card className="text-center h-100 shadow-sm border-0">
                  <Card.Body>
                       <div style={{ fontSize: '2.5rem', color: 'var(--bs-success)' }} className="mb-2"><i className="bi bi-patch-check-fill"></i></div>
                       <Card.Title>Chất Lượng</Card.Title>
                       <Card.Text className="small text-muted">Nguyên liệu tươi ngon, chọn lọc kỹ lưỡng, đảm bảo vệ sinh an toàn thực phẩm.</Card.Text>
                  </Card.Body>
              </Card>
          </Col>
           <Col md={4}>
              <Card className="text-center h-100 shadow-sm border-0">
                   <Card.Body>
                       <div style={{ fontSize: '2.5rem', color: 'var(--bs-primary)' }} className="mb-2"><i className="bi bi-people-fill"></i></div>
                       <Card.Title>Khách Hàng</Card.Title>
                       <Card.Text className="small text-muted">Luôn lắng nghe, thấu hiểu và mang đến trải nghiệm hài lòng nhất cho thực khách.</Card.Text>
                   </Card.Body>
              </Card>
          </Col>
           <Col md={4}>
              <Card className="text-center h-100 shadow-sm border-0">
                   <Card.Body>
                       <div style={{ fontSize: '2.5rem', color: 'var(--bs-info)' }} className="mb-2"><i className="bi bi-lightbulb-fill"></i></div>
                       <Card.Title>Sáng Tạo</Card.Title>
                       <Card.Text className="small text-muted">Không ngừng đổi mới thực đơn, cập nhật xu hướng ẩm thực để phục vụ tốt hơn.</Card.Text>
                   </Card.Body>
              </Card>
          </Col>
      </Row>

    </Container>
  );
}

export default AboutPage;