// src/pages/admin/AdminLoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { adminAuthService } from '../../services/admin.auth.service'; // <<--- Tạo service này
// import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // Sẽ dùng sau

function AdminLoginPage() {
    // const { login, isAuthenticated, loading, error, setError } = useAuthAdmin(); // Sẽ dùng sau
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // State loading riêng
    const [error, setError] = useState(null);     // State error riêng
    const isAuthenticated = !!localStorage.getItem('adminToken'); // Tạm kiểm tra

    const from = location.state?.from?.pathname || "/admin"; // Redirect về dashboard admin

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true); setError(null);
        try {
             // Gọi API login Admin
             const response = await adminAuthService.login(email, password);
             if (response.data?.success) {
                 const adminData = response.data.data.admin;
                 const token = response.data.data.token;
                 // Lưu vào localStorage (Tạm thời)
                 localStorage.setItem('adminToken', token);
                 localStorage.setItem('adminData', JSON.stringify(adminData));
                  // TODO: Cập nhật context admin sau
                 // login(adminData, token);
                 navigate(from, { replace: true });
             } else {
                  setError(response.data?.message || 'Đăng nhập thất bại.');
             }

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Lỗi đăng nhập.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
         <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#343a40' }}> {/* Nền tối */}
          <Card style={{ width: '100%', maxWidth: '400px' }} className="shadow-lg">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                 <Link to="/">
                     <img src="/logo.png" alt="Logo" width="60" />
                 </Link>
                 <h3 className="mt-3 fw-bold">Admin Login</h3>
              </div>
              {error && <Alert variant="danger" size="sm">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="adminEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required disabled={loading}/>
                </Form.Group>
                <Form.Group className="mb-4" controlId="adminPassword">
                  <Form.Label>Mật khẩu</Form.Label>
                  <Form.Control type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required disabled={loading}/>
                </Form.Group>
                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={loading} size="lg">
                    {loading ? <Spinner size="sm" /> : 'Đăng Nhập'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Container>
    );
}
export default AdminLoginPage;