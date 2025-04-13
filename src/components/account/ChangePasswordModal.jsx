// src/components/account/ChangePasswordModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { userService } from '../../services/user.service'; // Import service

function ChangePasswordModal({ show, handleClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [success, setSuccess] = useState(null);

    // Hàm reset state khi đóng modal hoặc submit thành công
    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setLoading(false);
        setError(null);
        setValidationErrors({});
        setSuccess(null);
    };

    const handleModalClose = () => {
        resetForm(); // Reset khi đóng bằng nút X hoặc nút Hủy
        handleClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setValidationErrors({});
        setSuccess(null);

        // Client-side check cơ bản
        if (newPassword !== confirmPassword) {
            setValidationErrors({ password: ['Xác nhận mật khẩu mới không khớp.'] }); // Gán lỗi vào field password
            return;
        }
         if (newPassword.length < 8) {
             setValidationErrors({ password: ['Mật khẩu mới phải có ít nhất 8 ký tự.'] });
             return;
         }


        setLoading(true);
        const passwordData = {
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: confirmPassword,
        };

        try {
            const response = await userService.changePassword(passwordData);
            if (response.data?.success) {
                setSuccess('Đổi mật khẩu thành công! Bạn có thể cần đăng nhập lại ở các thiết bị khác.');
                // Không reset form ngay để user thấy thông báo success
                // Reset form sau vài giây hoặc khi modal đóng
                setTimeout(() => {
                    handleModalClose(); // Tự động đóng sau khi thành công
                }, 2500); // Đóng sau 2.5 giây
            } else {
                 // Lỗi logic từ backend
                 setError(response.data?.message || 'Đổi mật khẩu thất bại.');
                 setLoading(false);
            }
        } catch (err) {
            console.error("Lỗi đổi mật khẩu:", err);
            let errorMessage = 'Đã có lỗi xảy ra.';
            if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
                if (err.response.status === 422 && err.response.data?.errors) {
                    setValidationErrors(err.response.data.errors);
                     // Lấy lỗi đầu tiên hiển thị chung nếu muốn
                     const firstErrorField = Object.keys(err.response.data.errors)[0];
                     errorMessage = err.response.data.errors[firstErrorField]?.[0] || 'Dữ liệu không hợp lệ.';
                }
            } else { errorMessage = err.message || 'Lỗi mạng.'; }
            setError(errorMessage);
            setLoading(false);
        }
        // Không đặt setLoading(false) ở finally nếu có setTimeout ở success
    };

    return (
        // backdrop="static" để không đóng khi click ra ngoài
        <Modal show={show} onHide={handleModalClose} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Đổi Mật Khẩu</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit} noValidate>
                <Modal.Body>
                    {/* Chỉ hiển thị 1 loại thông báo tại 1 thời điểm */}
                    {success && <Alert variant="success" size="sm">{success}</Alert>}
                    {error && !success && <Alert variant="danger" size="sm">{error}</Alert>}

                    <Form.Group className="mb-3" controlId="currentPassword">
                        <Form.Label>Mật khẩu hiện tại</Form.Label>
                        <Form.Control
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            disabled={loading || success} // Disable nếu thành công chờ đóng
                            isInvalid={!!validationErrors.current_password}
                            autoComplete="current-password"
                        />
                         <Form.Control.Feedback type="invalid">{validationErrors.current_password?.[0]}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="newPassword">
                        <Form.Label>Mật khẩu mới</Form.Label>
                        <Form.Control
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={loading || success}
                            isInvalid={!!validationErrors.password}
                            autoComplete="new-password"
                            aria-describedby="newPasswordHelp"
                         />
                         <Form.Control.Feedback type="invalid">{validationErrors.password?.[0]}</Form.Control.Feedback>
                         <Form.Text id="newPasswordHelp" muted>
                            Ít nhất 8 ký tự, nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                         </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="confirmPassword">
                        <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                        <Form.Control
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading || success}
                            // Dùng isInvalid của password cho cả confirm
                            isInvalid={!!validationErrors.password && newPassword !== confirmPassword}
                        />
                         {/* Hiển thị lỗi confirm nếu có từ backend hoặc client check */}
                         <Form.Control.Feedback type="invalid">
                              {validationErrors.password_confirmation?.[0] || (newPassword !== confirmPassword && confirmPassword ? 'Xác nhận mật khẩu không khớp.' : '')}
                         </Form.Control.Feedback>
                    </Form.Group>

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading || success}>
                        {loading ? <Spinner as="span" animation="border" size="sm" /> : ''}
                        {loading ? ' Đang đổi...' : 'Đổi Mật Khẩu'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default ChangePasswordModal;