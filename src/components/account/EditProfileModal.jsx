// src/components/account/EditProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { userService } from '../../services/user.service'; // Import user service
import { useAuth } from '../../hooks/useAuth'; // Dùng để cập nhật user trong context

function EditProfileModal({ show, handleClose, currentUser, onUpdateSuccess }) {
    // State cho form, khởi tạo bằng dữ liệu user hiện tại
    const [name, setName] = useState('');
    const [phone_number, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const { loadUser: reloadUserContext } = useAuth(); // Lấy hàm load lại user từ AuthContext

    // Cập nhật form khi currentUser thay đổi (khi modal được mở với user mới)
    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || '');
            setPhoneNumber(currentUser.phone_number || '');
            setError(null); // Reset lỗi khi mở modal
            setValidationErrors({});
        }
    }, [currentUser, show]); // Phụ thuộc vào currentUser và show

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setValidationErrors({});

        const profileData = {
            name: name.trim(),
            phone_number: phone_number.trim() || null, // Gửi null nếu rỗng
        };

        try {
            const response = await userService.updateProfile(profileData);
            if (response.data?.success) {
                alert('Cập nhật thông tin thành công!');
                if (onUpdateSuccess) {
                    onUpdateSuccess(response.data.data); // Gọi callback để cập nhật state ở trang cha
                }
                reloadUserContext(); // Gọi hàm load lại user trong AuthContext để cập nhật global state
                handleClose(); // Đóng modal
            } else {
                setError(response.data?.message || 'Cập nhật thất bại.');
            }
        } catch (err) {
            console.error("Lỗi cập nhật profile:", err);
            let errorMessage = 'Đã có lỗi xảy ra.';
            if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
                if (err.response.status === 422 && err.response.data?.errors) {
                    setValidationErrors(err.response.data.errors);
                    errorMessage = "Dữ liệu không hợp lệ."; // Thông báo chung cho lỗi validation
                }
            } else { errorMessage = err.message || 'Lỗi mạng.'; }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Không render gì nếu không có currentUser
    if (!currentUser) return null;

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Chỉnh Sửa Thông Tin Cá Nhân</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit} noValidate>
                <Modal.Body>
                    {error && <Alert variant="danger" size="sm">{error}</Alert>}

                    {/* Email không cho sửa */}
                    <Form.Group className="mb-3" controlId="editProfileEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" value={currentUser.email || ''} readOnly disabled />
                        <Form.Text className="text-muted">Bạn không thể thay đổi địa chỉ email.</Form.Text>
                    </Form.Group>

                    {/* Sửa Tên */}
                    <Form.Group className="mb-3" controlId="editProfileName">
                        <Form.Label>Họ và Tên</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={loading}
                            isInvalid={!!validationErrors.name}
                        />
                         <Form.Control.Feedback type="invalid">{validationErrors.name?.[0]}</Form.Control.Feedback>
                    </Form.Group>

                    {/* Sửa Số Điện Thoại */}
                    <Form.Group className="mb-3" controlId="editProfilePhone">
                        <Form.Label>Số điện thoại (Tùy chọn)</Form.Label>
                        <Form.Control
                            type="tel"
                            name="phone_number"
                            value={phone_number}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            disabled={loading}
                            isInvalid={!!validationErrors.phone_number}
                            placeholder="Bỏ trống nếu không muốn nhập"
                        />
                         <Form.Control.Feedback type="invalid">{validationErrors.phone_number?.[0]}</Form.Control.Feedback>
                    </Form.Group>

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner as="span" animation="border" size="sm" /> : ''}
                        {loading ? ' Đang lưu...' : 'Lưu Thay Đổi'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default EditProfileModal;