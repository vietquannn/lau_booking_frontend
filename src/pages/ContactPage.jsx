// src/pages/ContactPage.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
// Optional: import styles from './ContactPage.module.css';

function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, error: false, message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitStatus({ success: false, error: false, message: '' }); // Reset status khi nhập
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus({ success: false, error: false, message: '' });
    console.log("Submitting contact form:", formData);

    // --- TODO: Implement API call to send contact message ---
    // Giả lập thành công/thất bại
    await new Promise(resolve => setTimeout(resolve, 1500));
    const isSuccess = Math.random() > 0.3; // 70% thành công
    if (isSuccess) {
         setSubmitStatus({ success: true, error: false, message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.' });
         setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
    } else {
        setSubmitStatus({ success: false, error: true, message: 'Gửi liên hệ thất bại. Vui lòng thử lại sau hoặc gọi trực tiếp.' });
    }
    // -----------------------------------------------------

    setSubmitting(false);
  };

  return (
    <Container className="page-container">
      <Row className="justify-content-center mb-4">
        <Col md={8} className="text-center">
          <h1 className="fw-bold">Liên Hệ Với Chúng Tôi</h1>
          <p className="lead text-muted">
            Chúng tôi luôn sẵn lòng lắng nghe ý kiến đóng góp hoặc giải đáp thắc mắc của bạn.
          </p>
          <hr />
        </Col>
      </Row>

      <Row className="gy-4">
        {/* Cột Thông tin liên hệ */}
        <Col md={5} lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Header as="h5"><i className="bi bi-geo-alt-fill me-2"></i>Thông Tin Liên Lạc</Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className='border-0 px-0'>
                    <strong className="d-block"><i className="bi bi-pin-map-fill me-2 text-danger"></i>Địa chỉ:</strong>
                    20 - Đồng Cương - Yên Lạc - Vĩnh Phúc
                </ListGroup.Item>
                 <ListGroup.Item className='border-0 px-0'>
                    <strong className="d-block"><i className="bi bi-telephone-fill me-2 text-primary"></i>Điện thoại:</strong>
                    <a href="tel:0354076413" className='text-decoration-none'>0354 076 413</a>
                </ListGroup.Item>
                 <ListGroup.Item className='border-0 px-0'>
                    <strong className="d-block"><i className="bi bi-envelope-fill me-2 text-info"></i>Email:</strong>
                    <a href="mailto:info@laungon.com" className='text-decoration-none'>vietquannn@gmail.com</a>
                </ListGroup.Item>
                  <ListGroup.Item className='border-0 px-0'>
                    <strong className="d-block"><i className="bi bi-clock-history me-2 text-warning"></i>Giờ mở cửa:</strong>
                    10:00 - 22:00 (Thứ 2 - Chủ Nhật)
                </ListGroup.Item>
              </ListGroup>
               {/* Social Media Links */}
               <div className='mt-3'>
                   <strong>Kết nối:</strong>
                   <div className="mt-2">
                       <a href="https://www.facebook.com/vietquan06" target="_blank" rel="noopener noreferrer" className="text-decoration-none me-3">
                           <i className="bi bi-facebook fs-5 text-primary"></i>
                       </a>
                       {/* Add other social media links here when available */}
                   </div>
               </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Cột Form liên hệ */}
        <Col md={7} lg={8}>
          <Card className="shadow-sm h-100">
             <Card.Header as="h5"><i className="bi bi-pencil-square me-2"></i>Gửi Tin Nhắn Cho Chúng Tôi</Card.Header>
             <Card.Body>
                {submitStatus.success && <Alert variant="success">{submitStatus.message}</Alert>}
                {submitStatus.error && <Alert variant="danger">{submitStatus.message}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="contactName">
                                <Form.Label>Họ và Tên <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required disabled={submitting}/>
                            </Form.Group>
                        </Col>
                         <Col md={6}>
                            <Form.Group className="mb-3" controlId="contactEmail">
                                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required disabled={submitting}/>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3" controlId="contactSubject">
                        <Form.Label>Chủ đề</Form.Label>
                        <Form.Control type="text" name="subject" value={formData.subject} onChange={handleChange} disabled={submitting}/>
                    </Form.Group>
                     <Form.Group className="mb-3" controlId="contactMessage">
                        <Form.Label>Nội dung tin nhắn <span className="text-danger">*</span></Form.Label>
                        <Form.Control as="textarea" rows={5} name="message" value={formData.message} onChange={handleChange} required disabled={submitting}/>
                    </Form.Group>
                    <Button variant="primary" type="submit" disabled={submitting}>
                         {submitting ? <Spinner size="sm"/> : <i className="bi bi-send-fill me-2"></i>}
                        {submitting ? 'Đang gửi...' : 'Gửi Tin Nhắn'}
                    </Button>
                </Form>
             </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* TODO: Nhúng bản đồ Google Maps */}
       {/* <Row className="mt-5">
           <Col>
                <h3 className='text-center mb-3'>Tìm Chúng Tôi Trên Bản Đồ</h3>
                <div style={{height: '400px', backgroundColor: '#eee'}}>Bản đồ nhúng ở đây</div>
           </Col>
       </Row> */}

    </Container>
  );
}

export default ContactPage;