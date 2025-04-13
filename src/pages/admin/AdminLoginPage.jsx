// src/pages/admin/AdminLoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthAdmin } from '../../hooks/useAuthAdmin';

function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const { isAdminAuthenticated, loading: authLoading, login, error, clearError } = useAuthAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAdminAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [authLoading, isAdminAuthenticated, navigate, from]);

  // Clear error when inputs change
  useEffect(() => {
    if (error) clearError();
  }, [email, password, error, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      // Error is already handled in context
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#343a40' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }} className="shadow-lg">
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <Link to="/">
              <img src="/logo.png" alt="Logo" width="60" />
            </Link>
            <h3 className="mt-3 fw-bold">Admin Login</h3>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="adminEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={formLoading || authLoading}
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="adminPassword">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={formLoading || authLoading}
              />
            </Form.Group>

            <div className="d-grid">
              <Button
                variant="primary"
                type="submit"
                disabled={formLoading || authLoading}
                size="lg"
              >
                {formLoading ? <Spinner animation="border" size="sm" /> : 'Đăng Nhập'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminLoginPage;