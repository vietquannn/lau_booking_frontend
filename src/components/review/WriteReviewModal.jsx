// src/components/review/WriteReviewModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { reviewService } from '../../services/review.service'; // Import service

// Component chọn sao đơn giản
const StarRating = ({ rating, setRating, disabled }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="star-rating mb-3">
            {[...Array(5)].map((star, index) => {
                const ratingValue = index + 1;
                return (
                    <span
                        key={index}
                        style={{
                            cursor: disabled ? 'default' : 'pointer',
                            color: ratingValue <= (hover || rating) ? '#ffc107' : '#e4e5e9', // Màu vàng khi chọn/hover, xám khi không
                            fontSize: '2rem', // Kích thước sao
                            marginRight: '5px',
                            transition: 'color 0.2s' // Hiệu ứng chuyển màu
                        }}
                        onClick={() => !disabled && setRating(ratingValue)}
                        onMouseEnter={() => !disabled && setHover(ratingValue)}
                        onMouseLeave={() => !disabled && setHover(0)}
                    >
                        ★ {/* Ký tự ngôi sao */}
                    </span>
                );
            })}
             {rating > 0 && <span className='ms-2 text-muted'>({rating}/5)</span>}
        </div>
    );
};


function WriteReviewModal({ show, handleClose, bookingId, onSubmitSuccess }) {
    const [rating, setRating] = useState(0); // State cho số sao
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Reset state khi modal đóng/mở hoặc bookingId thay đổi
    useEffect(() => {
        if (show) {
            setRating(0);
            setComment('');
            setIsAnonymous(false);
            setError(null);
            setValidationErrors({});
            setSubmitting(false);
        }
    }, [show, bookingId]); // Reset khi show hoặc bookingId thay đổi

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (rating === 0) {
            setError('Vui lòng chọn số sao đánh giá.');
            return;
        }
        setSubmitting(true);
        setError(null);
        setValidationErrors({});

        const reviewData = {
            booking_id: bookingId,
            rating: rating,
            comment: comment.trim() || null, // Gửi null nếu comment rỗng
            is_anonymous: isAnonymous,
        };

        console.log("Submitting review:", reviewData);

        try {
            const response = await reviewService.submitReview(reviewData);
            if (response.data?.success) {
                alert('Gửi đánh giá thành công! Cảm ơn bạn.'); // Thông báo tạm thời
                if (onSubmitSuccess) {
                    onSubmitSuccess(bookingId); // Gọi callback để trang cha cập nhật UI
                }
                handleClose(); // Đóng modal
            } else {
                setError(response.data?.message || 'Gửi đánh giá thất bại.');
            }
        } catch (err) {
            console.error("Lỗi gửi đánh giá:", err);
            let errorMessage = 'Đã có lỗi xảy ra.';
            if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
                if (err.response.status === 422 && err.response.data?.errors) {
                    setValidationErrors(err.response.data.errors);
                    // Lấy lỗi đầu tiên hiển thị chung
                     errorMessage = Object.values(err.response.data.errors).flat()[0] || 'Dữ liệu không hợp lệ.';
                     // Hiển thị lỗi cụ thể cho booking_id nếu có
                     if(err.response.data.errors.booking_id){
                        errorMessage = err.response.data.errors.booking_id[0];
                     }
                } else if (err.response.status === 409) { // Lỗi đã đánh giá rồi
                     errorMessage = err.response.data.message || 'Bạn đã đánh giá đơn hàng này.';
                }
            } else { errorMessage = err.message || 'Lỗi mạng.'; }
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Viết Đánh Giá Cho Đơn Hàng</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {/* Hiển thị lỗi chung */}
                    {error && <Alert variant="danger" size="sm">{error}</Alert>}

                    {/* Chọn sao */}
                    <Form.Group className="mb-3 text-center" controlId="reviewRating">
                        <Form.Label className="d-block fw-semibold">Bạn hài lòng chứ?</Form.Label>
                        <StarRating rating={rating} setRating={setRating} disabled={submitting}/>
                        {/* Hiển thị lỗi nếu chưa chọn sao */}
                        {rating === 0 && !error && <Form.Text className="text-danger d-block">Vui lòng chọn số sao đánh giá.</Form.Text>}
                    </Form.Group>

                    {/* Bình luận */}
                    <Form.Group className="mb-3" controlId="reviewComment">
                        <Form.Label>Chia sẻ cảm nhận của bạn (Tùy chọn)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Nhà hàng phục vụ tốt, món ăn ngon..."
                            disabled={submitting}
                            isInvalid={!!validationErrors.comment}
                        />
                         <Form.Control.Feedback type="invalid">{validationErrors.comment?.[0]}</Form.Control.Feedback>
                    </Form.Group>

                    {/* Gửi ẩn danh */}
                    <Form.Group className="mb-3" controlId="reviewAnonymous">
                        <Form.Check
                            type="checkbox"
                            label="Gửi đánh giá ẩn danh"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            disabled={submitting}
                        />
                    </Form.Group>
                     {/* Thông báo lỗi booking_id nếu có (từ API) */}
                     {validationErrors.booking_id && <Alert variant="danger" size="sm">{validationErrors.booking_id[0]}</Alert>}

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                        Hủy
                    </Button>
                    <Button variant="primary" type="submit" disabled={submitting || rating === 0}>
                        {submitting ? <Spinner as="span" animation="border" size="sm" /> : ''}
                        {submitting ? ' Đang gửi...' : 'Gửi Đánh Giá'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default WriteReviewModal;