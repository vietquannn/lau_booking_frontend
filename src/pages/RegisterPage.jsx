// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service'; // <-- Import authService

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Lỗi chung
  const [validationErrors, setValidationErrors] = useState({}); // Lỗi chi tiết từng trường
  const [success, setSuccess] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Xóa lỗi validation khi nhập liệu
    if (validationErrors[name]) {
      setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
      });
    }
    setError(null); // Xóa lỗi chung
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors({});
    setSuccess(null);

    // Client-side validation cơ bản
    if (formData.password !== formData.password_confirmation) {
      setValidationErrors({ password_confirmation: ['Xác nhận mật khẩu không khớp.'] });
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
         setValidationErrors({ password: ['Mật khẩu phải có ít nhất 8 ký tự.'] });
         setLoading(false);
         return;
    }

    console.log('Register attempt:', formData.email);

    try {
      // Gọi API Register trực tiếp từ service
      const response = await authService.register(formData);

      if (response.data?.success) {
           setSuccess("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
           // Chuyển hướng về login sau vài giây
           setTimeout(() => navigate('/login'), 2500);
           // Không set loading false vì đang chuyển hướng
      } else {
           // Lỗi logic từ backend (dù status code có thể là 2xx)
           setError(response.data?.message || "Đăng ký thất bại.");
           setLoading(false);
      }
    } catch (err) {
      console.error("Register error:", err);
      let errorMessage = 'Đã có lỗi xảy ra trong quá trình đăng ký.';
      if (err.response) {
          errorMessage = err.response.data?.message || errorMessage;
          if (err.response.status === 422 && err.response.data?.errors) {
               // Lỗi validation từ backend -> cập nhật state validationErrors
               setValidationErrors(err.response.data.errors);
               // Lấy lỗi đầu tiên hiển thị chung (optional)
               const firstError = Object.values(err.response.data.errors).flat()[0];
               setError(firstError || 'Vui lòng kiểm tra lại thông tin.');
          } else {
               // Các lỗi khác (500, 409...) -> hiển thị lỗi chung
               setError(errorMessage);
          }
      } else { errorMessage = err.message || 'Lỗi mạng hoặc máy chủ không phản hồi.'; setError(errorMessage); }
      setLoading(false); // Dừng loading khi có lỗi
    }
  };

  return (
     <Container fluid className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card style={{ width: '100%', maxWidth: '450px' }} className="shadow-lg border-0">
        <Card.Body className="p-4 p-md-5">
           <div className="text-center mb-4">
             <Link to="/">
                 <img src="/logo.png" alt="Logo" width="60" />
             </Link>
             <h3 className="mt-3 fw-bold text-primary">Tạo Tài Khoản Mới</h3>
             <p className="text-muted">Nhanh chóng và dễ dàng.</p>
          </div>

          {/* Hiển thị lỗi chung */}
          {error && !success && <Alert variant="danger" className="py-2 px-3 small">{error}</Alert>}
          {success && <Alert variant="success" className="py-2 px-3 small">{success}</Alert>}

          <Form onSubmit={handleSubmit} noValidate> {/* Thêm noValidate để dùng validation của React */}
            <Form.Group className="mb-3" controlId="registerName">
              <Form.Label>Họ và Tên</Form.Label>
              <Form.Control
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    required disabled={loading || success} isInvalid={!!validationErrors.name} />
              {/* Hiển thị lỗi validation cụ thể */}
              <Form.Control.Feedback type="invalid">{validationErrors.name?.[0]}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="registerEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    required disabled={loading || success} isInvalid={!!validationErrors.email} />
               <Form.Control.Feedback type="invalid">{validationErrors.email?.[0]}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="registerPhone">
              <Form.Label>Số điện thoại (Tùy chọn)</Form.Label>
              <Form.Control
                    type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange}
                    disabled={loading || success} isInvalid={!!validationErrors.phone_number} />
               <Form.Control.Feedback type="invalid">{validationErrors.phone_number?.[0]}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="registerPassword">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                    type="password" name="password" value={formData.password} onChange={handleChange}
                    required disabled={loading || success} isInvalid={!!validationErrors.password} aria-describedby="passwordHelpBlock" />
               <Form.Control.Feedback type="invalid">{validationErrors.password?.[0]}</Form.Control.Feedback>
                <Form.Text id="passwordHelpBlock" muted>
                    Ít nhất 8 ký tự.
                </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4" controlId="registerPasswordConfirmation">
              <Form.Label>Xác nhận mật khẩu</Form.Label>
              <Form.Control
                    type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange}
                    required disabled={loading || success} isInvalid={!!validationErrors.password_confirmation} />
               <Form.Control.Feedback type="invalid">{validationErrors.password_confirmation?.[0]}</Form.Control.Feedback>
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={loading || success} size="lg">
                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Đăng Ký'}
              </Button>
            </div>
          </Form>

          <div className="mt-4 text-center text-muted" style={{ fontSize: '0.9em' }}>
            Đã có tài khoản? <Link to="/login" className="fw-medium text-decoration-none">Đăng nhập</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default RegisterPage;