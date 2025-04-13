// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react'; // Thêm useEffect
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // <-- Import custom hook

function LoginPage() {
  const { login, loading: authLoading, authError, setAuthError, isAuthenticated } = useAuth(); // <-- Lấy state và hàm từ context
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Không cần state loading/error riêng nữa, dùng từ context

  // Lấy đường dẫn redirect từ state hoặc query param
  const from = location.state?.from?.pathname || location.search.split('redirect=')[1] || "/";

  // Nếu đã đăng nhập rồi thì chuyển hướng luôn
  useEffect(() => {
      if (isAuthenticated) {
          console.log('Already authenticated, redirecting from login to:', from);
          navigate(from, { replace: true });
      }
  }, [isAuthenticated, navigate, from]);

  // Xóa lỗi khi người dùng bắt đầu nhập lại
  useEffect(() => {
      if (email || password) {
          setAuthError(null); // Gọi hàm xóa lỗi từ context
      }
  }, [email, password, setAuthError]);


  const handleSubmit = async (event) => {
    event.preventDefault();
    // Không cần setLoading(true) vì đã có authLoading từ context
    // Không cần setError(null) vì đã có setAuthError từ context

    console.log('Login attempt:', email);

    try {
      // Gọi hàm login từ context
      await login(email, password);
      // Nếu thành công, useEffect ở trên sẽ tự động chuyển hướng
      // Hoặc có thể chuyển hướng ngay tại đây nếu muốn:
      // navigate(from, { replace: true });
    } catch (error) {
      // Lỗi đã được set vào authError trong context, không cần làm gì thêm ở đây
      // Chỉ cần đảm bảo component hiển thị authError
      console.error("Login failed in component:", error);
    }
    // Không cần setLoading(false)
  };

  return (
    <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }} className="shadow-lg border-0">
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
             <Link to="/">
                 <img src="/logo.png" alt="Logo" width="60" />
             </Link>
             <h3 className="mt-3 fw-bold text-primary">Đăng Nhập</h3>
             <p className="text-muted">Chào mừng trở lại!</p>
          </div>

          {/* Hiển thị lỗi từ context */}
          {authError && typeof authError === 'string' && <Alert variant="danger" className="py-2 px-3 small">{authError}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="loginEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={authLoading} // Disable khi đang loading
                autoComplete="email"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="loginPassword">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={authLoading} // Disable khi đang loading
                autoComplete="current-password"
              />
            </Form.Group>

             <div className="d-flex justify-content-end align-items-center mb-4"> {/* Chỉ còn link quên MK */}
                 <Link to="/forgot-password" style={{ fontSize: '0.9em' }} className="text-decoration-none">Quên mật khẩu?</Link>
             </div>


            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={authLoading} size="lg">
                 {/* Sử dụng authLoading từ context */}
                {authLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Đăng Nhập'}
              </Button>
            </div>
          </Form>

          <div className="mt-4 text-center text-muted" style={{ fontSize: '0.9em' }}>
            Chưa có tài khoản? <Link to="/register" className="fw-medium text-decoration-none">Đăng ký ngay</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPage;