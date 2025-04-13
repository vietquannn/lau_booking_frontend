// src/pages/admin/AdminReviewListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Table, Spinner, Alert, Pagination, Form, Row, Col, Badge, InputGroup, Tooltip, OverlayTrigger, Modal, FloatingLabel } from 'react-bootstrap'; // Thêm Modal, FloatingLabel
import { useSearchParams, Link } from 'react-router-dom';
import { adminReviewService } from '../../services/admin.review.service'; // Service admin review
import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // Optional

// --- Tooltip Component ---
const renderTooltip = (props, text) => ( <Tooltip {...props}>{text}</Tooltip> );

// --- Star Rating Display Component ---
const StaticStarRating = ({ rating }) => {
    const totalStars = 5;
    return (
        <div className="star-rating-display" title={`${rating}/${totalStars}`}>
            {[...Array(totalStars)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <span key={index} style={{ color: starValue <= rating ? '#ffc107' : '#e4e5e9', fontSize: '1rem', marginRight: '2px' }}>
                        ★
                    </span>
                );
            })}
        </div>
    );
};

// --- Modal Phản Hồi Đánh Giá ---
function RespondReviewModal({ show, handleClose, review, onSubmitSuccess }) {
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Lấy phản hồi cũ nếu có khi mở modal
        if (review) {
            setResponse(review.restaurant_response || '');
            setError(null);
            setLoading(false);
        }
    }, [review, show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            const res = await adminReviewService.respondToReview(review.id, response.trim());
            if (res.data?.success) {
                alert('Đã gửi/cập nhật phản hồi thành công!');
                onSubmitSuccess(res.data.data); // Gửi review đã cập nhật về trang cha
                handleClose();
            } else {
                setError(res.data?.message || 'Lỗi gửi phản hồi.');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Lỗi kết nối.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Phản Hồi Đánh Giá #{review?.id}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger" size="sm">{error}</Alert>}
                     {/* Hiển thị lại đánh giá của khách */}
                     {review && (
                         <Card bg="light" className="mb-3 p-2 border">
                              <Card.Text as="div" className="d-flex justify-content-between align-items-center mb-1">
                                 <small className="fw-medium">{review.is_anonymous ? 'Khách ẩn danh' : (review.user?.name || 'Không rõ')}</small>
                                 <StaticStarRating rating={review.rating} />
                              </Card.Text>
                              <Card.Text className="small fst-italic">"{review.comment || 'Không có bình luận.'}"</Card.Text>
                         </Card>
                     )}

                    <FloatingLabel controlId="reviewResponse" label="Nội dung phản hồi của nhà hàng">
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="Nhập phản hồi của bạn..."
                        />
                    </FloatingLabel>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>Hủy</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm"/> : 'Gửi Phản Hồi'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}


// --- Component Trang Chính ---
function AdminReviewListPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [searchParams, setSearchParams] = useSearchParams();
    const [processingId, setProcessingId] = useState(null); // ID review đang xử lý (approve/reject/delete)

    // --- State bộ lọc ---
    const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'pending'); // Mặc định lọc 'pending'
    const [filterRating, setFilterRating] = useState(searchParams.get('rating') || '');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    // State cho Modal Phản Hồi
    const [showRespondModal, setShowRespondModal] = useState(false);
    const [respondingReview, setRespondingReview] = useState(null);

    const currentPage = parseInt(searchParams.get('page') || '1');

    // --- Hàm Fetch Reviews ---
    const fetchReviews = useCallback(async (page, filters) => {
        setLoading(true); setError(null);
        try {
            const params = {
                page,
                status: filters.status || undefined,
                rating: filters.rating || undefined,
                search: filters.search || undefined,
                sort_by: 'created_at', // Mặc định mới nhất trước
                sort_dir: 'desc',
                per_page: 15,
            };
             Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await adminReviewService.getReviews(params); // Gọi service
            if (response.data?.success) {
                setReviews(response.data.data.data || []);
                setPagination({ /* ... lưu phân trang ... */ });
            } else { setError(response.data?.message || 'Lỗi tải danh sách đánh giá.'); setReviews([]); setPagination({ current_page: 1, last_page: 1, total: 0 }); }
        } catch (err) {
            if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); }
            setReviews([]); setPagination({ current_page: 1, last_page: 1, total: 0 });
        } finally { setLoading(false); }
    }, []);

    // --- useEffect gọi fetch khi trang hoặc filter thay đổi ---
    useEffect(() => {
        const currentSearch = searchParams.get('search') || '';
        const currentStatus = searchParams.get('status') || 'pending'; // Mặc định lại là pending
        const currentRating = searchParams.get('rating') || '';

        setSearchTerm(currentSearch);
        setFilterStatus(currentStatus);
        setFilterRating(currentRating);

        fetchReviews(currentPage, { search: currentSearch, status: currentStatus, rating: currentRating });
    }, [searchParams, fetchReviews, currentPage]);

    // --- Handlers cho Actions (Approve/Reject/Delete/Respond) ---
    const handleReviewAction = useCallback(async (actionType, review, payload = null) => {
        if (processingId === review.id) return; // Tránh click nhiều lần

        let confirmMsg = '';
        let apiCall;

        switch(actionType) {
            case 'approve':
                 if(review.status !== 'pending') return alert('Chỉ duyệt được đánh giá đang chờ.');
                 confirmMsg = `Duyệt đánh giá #${review.id}?`;
                 apiCall = adminReviewService.approveReview(review.id); break;
            case 'reject':
                 if(review.status !== 'pending') return alert('Chỉ từ chối được đánh giá đang chờ.');
                 confirmMsg = `Từ chối đánh giá #${review.id}?`;
                 apiCall = adminReviewService.rejectReview(review.id); break;
            case 'delete':
                 confirmMsg = `Xóa vĩnh viễn đánh giá #${review.id}? Hành động này không thể hoàn tác.`;
                 apiCall = adminReviewService.deleteReview(review.id); break;
            case 'show_respond': // Chỉ mở modal, không gọi API
                 setRespondingReview(review); setShowRespondModal(true); return;
            default: return;
        }

        if (window.confirm(confirmMsg)) {
            setProcessingId(review.id); setError(null);
            try {
                const response = await apiCall;
                if (response.data?.success) {
                    alert(`Đã ${actionType === 'delete' ? 'xóa' : (actionType === 'approve' ? 'duyệt' : 'từ chối')} đánh giá!`);
                    // Cập nhật UI: Xóa nếu là delete, cập nhật status nếu là approve/reject
                    if (actionType === 'delete') {
                         setReviews(prev => prev.filter(r => r.id !== review.id));
                         setPagination(prev => ({...prev, total: Math.max(0, prev.total -1) }));
                    } else {
                         setReviews(prev => prev.map(r => r.id === review.id ? response.data.data : r));
                    }
                    // Tải lại nếu muốn để đồng bộ phân trang/filter
                    // fetchReviews(currentPage, { search: searchTerm, status: filterStatus, rating: filterRating });
                } else { setError(response.data?.message || 'Thao tác thất bại.'); }
            } catch (err) {
                if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi thực hiện thao tác.'); }
            } finally { setProcessingId(null); }
        }
    }, [processingId, currentPage, searchTerm, filterStatus, filterRating, fetchReviews]); // Dependencies

     // Callback khi modal phản hồi lưu thành công
     const handleRespondSuccess = (updatedReview) => {
         // Cập nhật review trong danh sách state
         setReviews(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
     };


    // --- Handlers cho Bộ lọc ---
     const handleSearchChange = (e) => setSearchTerm(e.target.value);
     const handleFilterChange = (e) => {
         const { name, value } = e.target;
         if (name === 'status') setFilterStatus(value);
         if (name === 'rating') setFilterRating(value);
     };
     const applyFilters = () => {
         const newSearchParams = new URLSearchParams();
         if (searchTerm.trim()) newSearchParams.set('search', searchTerm.trim());
         if (filterStatus) newSearchParams.set('status', filterStatus);
         if (filterRating) newSearchParams.set('rating', filterRating);
         newSearchParams.set('page', '1');
         setSearchParams(newSearchParams);
     };
      const clearFilters = () => {
         setSearchTerm(''); setFilterStatus('pending'); setFilterRating(''); // Reset về mặc định pending
         setSearchParams({ page: '1', status: 'pending' }); // Mặc định về trang 1, status pending
     };

    // --- Handler Phân Trang ---
    const handlePageChange = (pageNumber) => { /* ... */ };
    // --- Render Phân Trang ---
    const renderPagination = () => { /* ... (Copy từ trang trước) ... */ };


    // ---- Render ----
    return (
        <Container fluid className="py-3">
            <Card className="shadow-sm">
                <Card.Header as="h5" className="bg-warning text-dark d-flex justify-content-between align-items-center"> {/* Đổi màu */}
                    Quản Lý Đánh Giá Khách Hàng
                    {/* Có thể thêm nút action khác */}
                </Card.Header>
                <Card.Body>
                    {/* --- Bộ lọc --- */}
                    <Form className="mb-3 p-3 bg-light border rounded">
                        <Row className="g-2 align-items-end">
                             <Col md={4} xl={4}>
                                <Form.Group controlId="searchReview">
                                     <Form.Label className='small mb-1 fw-semibold'>Tìm kiếm</Form.Label>
                                     <InputGroup size="sm">
                                        <Form.Control type="text" placeholder="Bình luận, tên, email..." value={searchTerm} onChange={handleSearchChange}/>
                                        {searchTerm && <Button variant="outline-secondary" onClick={clearFilters} title="Xóa"><i className="bi bi-x-lg"></i></Button>}
                                     </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={3} xl={2}>
                                <Form.Group controlId="filterReviewStatus">
                                    <Form.Label className='small mb-1 fw-semibold'>Trạng thái</Form.Label>
                                    <Form.Select size="sm" name="status" value={filterStatus} onChange={handleFilterChange} disabled={loading}>
                                        <option value="">Tất cả</option>
                                        <option value="pending">Chờ duyệt</option>
                                        <option value="approved">Đã duyệt</option>
                                        <option value="rejected">Đã từ chối</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3} xl={2}>
                                <Form.Group controlId="filterRating">
                                    <Form.Label className='small mb-1 fw-semibold'>Số sao</Form.Label>
                                    <Form.Select size="sm" name="rating" value={filterRating} onChange={handleFilterChange} disabled={loading}>
                                        <option value="">Tất cả</option>
                                        <option value="5">5 sao</option>
                                        <option value="4">4 sao</option>
                                        <option value="3">3 sao</option>
                                        <option value="2">2 sao</option>
                                        <option value="1">1 sao</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md="auto" className="mt-3 mt-md-0">
                                <div className="d-flex gap-2">
                                    <Button variant="primary" size="sm" onClick={applyFilters} disabled={loading}> <i className="bi bi-funnel-fill"></i> Lọc </Button>
                                    <Button variant="outline-secondary" size="sm" onClick={clearFilters} disabled={loading}> <i className="bi bi-x-lg"></i> Xóa lọc </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>

                     {/* --- Hiển thị Loading/Error/Danh sách --- */}
                     {loading && <div className="text-center my-5"><Spinner animation="border" variant="warning"/></div>}
                     {error && !loading && <Alert variant="danger">Lỗi: {error}</Alert>}
                     {!loading && !error && reviews.length === 0 && ( <Alert variant="light" className='text-center border'>Không tìm thấy đánh giá nào.</Alert> )}
                     {!loading && !error && reviews.length > 0 && (
                        <>
                            <Table responsive striped bordered hover size="sm" className="align-middle">
                                <thead className='table-light'>
                                    <tr>
                                        {/* <th>ID</th> */}
                                        <th style={{width: '15%'}}>Người gửi</th>
                                        <th style={{width: '15%'}}>Đơn hàng</th>
                                        <th className='text-center' style={{width: '80px'}}>Sao</th>
                                        <th>Bình luận</th>
                                        <th>Phản hồi NH</th>
                                        <th className='text-center'>Trạng thái</th>
                                        <th>Ngày gửi</th>
                                        <th className='text-center' style={{ width: '110px' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reviews.map(review => {
                                        const isProcessing = processingId === review.id;
                                        return (
                                            <tr key={review.id}>
                                                {/* <td>{review.id}</td> */}
                                                <td>
                                                     {review.is_anonymous ? <span className='text-muted fst-italic'>Ẩn danh</span> : (review.user?.name || '-')}
                                                     <br/>
                                                     <small className="text-muted">{review.user?.email}</small>
                                                </td>
                                                <td>
                                                    {review.booking?.booking_code ? (
                                                         <Link to={`/admin/bookings/${review.booking.id}`} title="Xem chi tiết đơn hàng">
                                                             <code>{review.booking.booking_code}</code>
                                                         </Link>
                                                     ) : '-'}
                                                </td>
                                                <td className='text-center'><StaticStarRating rating={review.rating} /></td>
                                                <td className='small'>{review.comment || <span className='text-muted'>-</span>}</td>
                                                <td className='small'>{review.restaurant_response || <span className='text-muted'>-</span>}</td>
                                                <td className='text-center'>
                                                     <Badge bg={review.status === 'approved' ? 'success' : (review.status === 'rejected' ? 'danger' : 'warning')} pill>
                                                         {translateStatus(review.status)} {/* Sử dụng lại hàm dịch nếu có */}
                                                     </Badge>
                                                </td>
                                                <td className='small text-muted'>{new Date(review.created_at).toLocaleDateString('vi-VN')}</td>
                                                <td className='text-center'>
                                                     {/* Nút Duyệt/Từ chối chỉ khi pending */}
                                                     {review.status === 'pending' && (
                                                         <>
                                                         <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Duyệt")}>
                                                             <Button variant="outline-success" size="sm" onClick={() => handleReviewAction('approve', review)} className="me-1 px-1 py-0" disabled={isProcessing}>{isProcessing ? <Spinner size="sm"/> : <i className="bi bi-check-lg"></i>}</Button>
                                                         </OverlayTrigger>
                                                          <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Từ chối")}>
                                                             <Button variant="outline-danger" size="sm" onClick={() => handleReviewAction('reject', review)} className="px-1 py-0" disabled={isProcessing}>{isProcessing ? <Spinner size="sm"/> : <i className="bi bi-x-lg"></i>}</Button>
                                                         </OverlayTrigger>
                                                         </>
                                                     )}
                                                     {/* Nút Phản hồi */}
                                                      <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Phản hồi")}>
                                                          <Button variant="outline-primary" size="sm" onClick={() => handleReviewAction('show_respond', review)} className={`px-1 py-0 ${review.status === 'pending' ? 'ms-1' : ''}`} disabled={isProcessing}><i className="bi bi-chat-left-dots-fill"></i></Button>
                                                      </OverlayTrigger>
                                                      {/* Nút Xóa */}
                                                      <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Xóa")}>
                                                         <Button variant="outline-dark" size="sm" onClick={() => handleReviewAction('delete', review)} className="px-1 py-0 ms-1" disabled={isProcessing}>{isProcessing ? <Spinner size="sm"/> : <i className="bi bi-trash-fill"></i>}</Button>
                                                     </OverlayTrigger>

                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                            {renderPagination()}
                        </>
                     )}
                </Card.Body>
            </Card>

            {/* --- Modal Phản Hồi --- */}
            {respondingReview && ( // Chỉ render khi có review đang được chọn để phản hồi
                 <RespondReviewModal
                     show={showRespondModal}
                     handleClose={() => { setShowRespondModal(false); setRespondingReview(null); }}
                     review={respondingReview}
                     onSubmitSuccess={handleRespondSuccess} // Callback để cập nhật UI
                 />
            )}

        </Container>
    );
}

// Helper function (nếu chưa có trong utils)
const translateStatus = (status) => {
    const statusMap = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Đã từ chối' };
    return statusMap[status] || status;
};


export default AdminReviewListPage;

// --- Cần tạo service ---
// src/services/admin.review.service.js
/*
import apiClient from './api';
const getReviews = (params = {}) => apiClient.get('/admin/reviews', { params });
const approveReview = (id) => apiClient.patch(`/admin/reviews/${id}/approve`);
const rejectReview = (id) => apiClient.patch(`/admin/reviews/${id}/reject`);
const respondToReview = (id, responseText) => apiClient.post(`/admin/reviews/${id}/respond`, { response: responseText });
const deleteReview = (id) => apiClient.delete(`/admin/reviews/${id}`);
export const adminReviewService = { getReviews, approveReview, rejectReview, respondToReview, deleteReview };
*/