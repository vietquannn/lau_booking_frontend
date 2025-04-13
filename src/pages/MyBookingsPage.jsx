// src/pages/MyBookingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Spinner, Alert, Table, Badge, Button, Pagination, Form, Row, Col, Modal } from 'react-bootstrap';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/booking.service'; // Import service thật
import { useAuth } from '../hooks/useAuth'; // Để kiểm tra đăng nhập
import BookingDetailModal from '../components/booking/BookingDetailModal.jsx'; // Import Modal component
import WriteReviewModal from '../components/review/WriteReviewModal'; // Import modal mới

function MyBookingsPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]); // Danh sách booking hiển thị
    const [loading, setLoading] = useState(true); // Loading cho danh sách chính
    const [error, setError] = useState(null); // Lỗi của danh sách chính
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 10 }); // State phân trang
    const [searchParams, setSearchParams] = useSearchParams(); // Quản lý query params (page, status)

    // State cho Modal chi tiết
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null); // Booking đang xem chi tiết
    const [loadingDetail, setLoadingDetail] = useState(false); // Loading cho modal
    const [detailError, setDetailError] = useState(null); // Lỗi của modal
    const [cancellingId, setCancellingId] = useState(null); // State để disable nút hủy khi đang xử lý
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewBookingId, setReviewBookingId] = useState(null);

    // Lấy trang hiện tại và bộ lọc từ URL
    const currentPage = parseInt(searchParams.get('page') || '1');
    const filterStatus = searchParams.get('status') || '';

    // --- Hàm Fetch Dữ Liệu (Dùng useCallback) ---
    const fetchBookings = useCallback(async (page, status) => {
        if (!isAuthenticated) {
            setLoading(false);
            // Đặt lại bookings và pagination nếu không xác thực
            setBookings([]);
            setPagination({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 10 });
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Gọi API với các tham số trang và trạng thái
            // Đảm bảo backend API /my-bookings đã được cập nhật để trả về 'review' (ít nhất là ID)
            const response = await bookingService.getMyBookings(page, status);
            if (response.data?.success) {
                const responseData = response.data.data; // Dữ liệu phân trang từ API
                setBookings(responseData.data || []); // Mảng booking nằm trong data.data
                setPagination({ // Cập nhật state phân trang
                    current_page: responseData.current_page,
                    last_page: responseData.last_page,
                    total: responseData.total,
                    from: responseData.from,
                    to: responseData.to,
                    per_page: responseData.per_page,
                });
            } else {
                setError(response.data?.message || 'Lỗi tải lịch sử đặt bàn.');
                setBookings([]);
                setPagination({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 10 });
            }
        } catch (err) {
            console.error("Lỗi tải lịch sử:", err);
            if (err.response?.status !== 401) { // Bỏ qua lỗi 401 vì AuthContext sẽ xử lý
                setError(err.response?.data?.message || err.message || 'Lỗi kết nối.');
            }
            setBookings([]);
            setPagination({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 10 });
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]); // Phụ thuộc vào isAuthenticated

    // --- useEffect để gọi fetchBookings khi trang hoặc bộ lọc thay đổi ---
    useEffect(() => {
        fetchBookings(currentPage, filterStatus);
    }, [currentPage, filterStatus, fetchBookings]); // Thêm fetchBookings vào dependency array

    // --- Hàm Mở Modal Chi Tiết ---
    const handleShowDetail = useCallback(async (bookingId) => {
        setShowDetailModal(true);
        setSelectedBooking(null);
        setLoadingDetail(true);
        setDetailError(null);
        try {
            const response = await bookingService.getMyBookingDetail(bookingId);
            if (response.data?.success) {
                setSelectedBooking(response.data.data);
            } else {
                setDetailError(response.data?.message || "Không thể tải chi tiết.");
            }
        } catch (err) {
            console.error("Lỗi tải chi tiết booking:", err);
            if (err.response?.status !== 401) {
                setDetailError(err.response?.data?.message || err.message || "Lỗi kết nối.");
            }
        } finally {
            setLoadingDetail(false);
        }
    }, []); // Dependency rỗng

    // --- Hàm Đóng Modal Chi Tiết ---
    const handleCloseDetailModal = useCallback(() => { // Dùng useCallback
        setShowDetailModal(false);
        setSelectedBooking(null);
        setDetailError(null);
    }, []);

    // --- Hàm Xử Lý Hủy Đơn Hàng ---
    const handleCancelBooking = useCallback(async (bookingId) => {
        if (cancellingId === bookingId) return; // Tránh double click
        // Hiện confirm dialog của trình duyệt
        if (window.confirm('Bạn có chắc chắn muốn hủy đơn đặt bàn này không?')) {
            setCancellingId(bookingId); // Đánh dấu ID đang hủy
            setError(null); // Clear lỗi cũ
            try {
                const response = await bookingService.cancelMyBooking(bookingId); // Gọi API hủy
                if (response.data?.success) {
                    alert('Đơn đặt bàn đã được hủy thành công!');
                    // Tải lại dữ liệu trang hiện tại để cập nhật danh sách
                    fetchBookings(currentPage, filterStatus);
                    // Nếu modal chi tiết đang mở cho đơn này, đóng nó lại
                    if (showDetailModal && selectedBooking?.id === bookingId) {
                        handleCloseDetailModal();
                    }
                } else {
                    // Hiển thị lỗi từ API nếu hủy thất bại
                    setError(response.data?.message || 'Hủy đơn thất bại. Vui lòng thử lại.');
                }
            } catch (err) {
                console.error("Lỗi hủy booking:", err);
                if (err.response?.status !== 401) {
                    // Hiển thị các lỗi khác (vd: 400, 403, 500)
                    setError(err.response?.data?.message || err.message || 'Lỗi kết nối khi hủy.');
                }
            } finally {
                setCancellingId(null); // Reset ID đang hủy
            }
        }
    }, [currentPage, filterStatus, fetchBookings, showDetailModal, selectedBooking, cancellingId, handleCloseDetailModal]); // Dependencies

    // --- Hàm Đổi Trang Phân Trang ---
    const handlePageChange = (pageNumber) => {
        // Chỉ cập nhật URL params nếu trang hợp lệ và khác trang hiện tại
        if (pageNumber >= 1 && pageNumber <= pagination.last_page && pageNumber !== currentPage && !loading) {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('page', pageNumber.toString());
            setSearchParams(newSearchParams); // Cập nhật URL, sẽ trigger useEffect chạy lại fetchBookings
        }
    };

    // --- Hàm Đổi Bộ Lọc Trạng Thái ---
    const handleFilterChange = (e) => {
        const newStatus = e.target.value;
        const newSearchParams = new URLSearchParams(searchParams);
        if (newStatus) { newSearchParams.set('status', newStatus); }
        else { newSearchParams.delete('status'); }
        newSearchParams.set('page', '1'); // Luôn reset về trang 1 khi thay đổi bộ lọc
        setSearchParams(newSearchParams);
    };

    // --- Hàm Lấy Variant Màu Cho Badge Trạng Thái ---
    const getStatusVariant = useCallback((status) => {
        const variants = { confirmed: 'success', pending_payment: 'warning', pending_confirmation: 'info', completed: 'primary', cancelled_by_user: 'danger', cancelled_by_admin: 'danger', no_show: 'dark' };
        return variants[status] || 'secondary';
    }, []);

    // --- Hàm dịch trạng thái ---
    const translateStatus = useCallback((status) => {
        const statusMap = { pending_confirmation: 'Chờ xác nhận', pending_payment: 'Chờ thanh toán', confirmed: 'Đã xác nhận', completed: 'Đã hoàn thành', cancelled_by_user: 'Bạn đã hủy', cancelled_by_admin: 'Nhà hàng hủy', no_show: 'Không đến' };
        return statusMap[status] || status?.replace(/_/g, ' ')?.replace(/^\w/, c => c.toUpperCase()) || 'Không xác định';
    }, []);

    // --- Render Component Phân Trang Thông Minh Hơn ---
    const renderPagination = () => {
        if (!pagination || pagination.last_page <= 1) return null;
        const items = [];
        const pageLimit = 2; // Số trang hiển thị mỗi bên trang hiện tại
        const totalPagesToShow = (pageLimit * 2) + 1;
        let startPage, endPage;

        if (pagination.last_page <= totalPagesToShow + 2) { startPage = 1; endPage = pagination.last_page; }
        else {
            const maxP = pageLimit; const maxA = pageLimit; // Đơn giản hóa logic
            if (currentPage <= maxP + 1) { startPage = 1; endPage = totalPagesToShow; }
            else if (currentPage >= pagination.last_page - maxP) { startPage = pagination.last_page - totalPagesToShow + 1; endPage = pagination.last_page; }
            else { startPage = currentPage - maxP; endPage = currentPage + maxA; }
        }

        items.push(<Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1 || loading} />);
        items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} />);
        if (startPage > 1) { items.push(<Pagination.Item key={1} onClick={() => handlePageChange(1)} disabled={loading}>{1}</Pagination.Item>); if (startPage > 2) items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />); }
        for (let page = startPage; page <= endPage; page++) { items.push(<Pagination.Item key={page} active={page === currentPage} onClick={() => handlePageChange(page)} disabled={loading}>{page}</Pagination.Item>); }
        if (endPage < pagination.last_page) { if (endPage < pagination.last_page - 1) items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />); items.push(<Pagination.Item key={pagination.last_page} onClick={() => handlePageChange(pagination.last_page)} disabled={loading}>{pagination.last_page}</Pagination.Item>); }
        items.push(<Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.last_page || loading} />);
        items.push(<Pagination.Last key="last" onClick={() => handlePageChange(pagination.last_page)} disabled={currentPage === pagination.last_page || loading} />);

        return <Pagination size="sm" className="mt-3 mb-0 justify-content-center justify-content-md-end">{items}</Pagination>;
    };

    const handleShowReviewModal = (bookingId) => {
        setReviewBookingId(bookingId);
        setShowReviewModal(true);
    };

    const handleCloseReviewModal = () => {
        setShowReviewModal(false);
        setReviewBookingId(null);
    };

    const handleReviewSubmitSuccess = (submittedBookingId) => {
        console.log(`Review submitted for booking ${submittedBookingId}, refreshing list...`);
        // Tải lại trang hiện tại để cập nhật trạng thái nút đánh giá
        fetchBookings(currentPage, filterStatus);
    };


    // ---- Render ----
    return (
        <Container className="page-container">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2"> {/* flex-wrap cho mobile */}
                <h1>Lịch Sử Đặt Bàn</h1>
                {isAuthenticated && <Button as={Link} to="/booking" variant='primary' size="sm"><i className="bi bi-plus-circle-fill me-2"></i>Đặt bàn mới</Button>}
            </div>


            {!isAuthenticated && !loading && (<Alert variant="warning" className="text-center"> Vui lòng <Link to="/login?redirect=/my-bookings" className="alert-link">đăng nhập</Link> để xem lịch sử. </Alert>)}

            {isAuthenticated && (
                <>
                    {/* Bộ lọc */}
                    <Form className="mb-3">
                        <Row className="align-items-end">
                            <Col md={4} sm={6} xs={12}>
                                <Form.Group controlId="filterStatus">
                                    <Form.Label className='small mb-1 fw-semibold'>Trạng thái:</Form.Label>
                                    <Form.Select value={filterStatus} onChange={handleFilterChange} disabled={loading} size="sm">
                                        <option value="">Tất cả</option>
                                        <option value="pending_confirmation">Chờ xác nhận</option>
                                        <option value="pending_payment">Chờ thanh toán</option>
                                        <option value="confirmed">Đã xác nhận</option>
                                        <option value="completed">Đã hoàn thành</option>
                                        <option value="cancelled_by_user">Bạn đã hủy</option>
                                        <option value="cancelled_by_admin">Nhà hàng hủy</option>
                                        <option value="no_show">Không đến</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>

                    {/* Hiển thị Loading / Lỗi / Danh sách */}
                    {loading && <div className="text-center my-5"><Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} /></div>}
                    {error && !loading && <Alert variant="danger">Lỗi: {error}</Alert>}
                    {!loading && !error && bookings.length === 0 && (
                        <Alert variant="light" className='text-center border'> Không tìm thấy đơn đặt bàn nào {filterStatus ? `với trạng thái "${translateStatus(filterStatus)}"` : ''}. <br /> <Button as={Link} to="/booking" variant="link" className="p-0 alert-link mt-1">Đặt bàn ngay!</Button> </Alert>
                    )}
                    {!loading && !error && bookings.length > 0 && (
                        <>
                            <Card className="shadow-sm">
                                <Table responsive striped hover className="mb-0 align-middle" size="sm">
                                    <thead className='table-light'>
                                        <tr>
                                            <th>Mã ĐB</th>
                                            <th>Ngày Đặt</th> {/* Đổi thành Ngày Đặt */}
                                            <th>Giờ Đến</th> {/* Đổi thành Giờ Đến */}
                                            <th className='text-center'>Số Khách</th>
                                            <th>Bàn</th>
                                            <th className='text-end'>Tổng Tiền</th>
                                            <th className='text-center'>Trạng Thái</th>
                                            <th className='text-center' style={{ minWidth: '110px' }}>Hành Động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map(booking => (
                                            <tr key={booking.id}>
                                                <td><code>{booking.booking_code}</code></td>
                                                <td>{new Date(booking.booking_date).toLocaleDateString('vi-VN')}</td>
                                                <td>{booking.booking_time?.substring(0, 5)}</td>
                                                <td className='text-center'>{booking.num_guests}</td>
                                                <td>{booking.table?.table_number} <small className="text-muted d-block d-md-inline">({booking.table?.tableType?.name})</small></td>
                                                <td className='text-end fw-medium'>{parseInt(booking.total_amount).toLocaleString('vi-VN')} đ</td>
                                                <td className='text-center'> <Badge bg={getStatusVariant(booking.status)} pill className="px-2 py-1 small">{translateStatus(booking.status)}</Badge> </td>
                                                <td className='text-center'>
                                                    {/* Nút Xem */}
                                                    <Button variant="outline-secondary" size="sm" onClick={() => handleShowDetail(booking.id)} className="me-1 px-1 py-0" title="Xem chi tiết" disabled={cancellingId === booking.id}> <i className="bi bi-eye-fill"></i> </Button>
                                                    {/* Nút Hủy */}
                                                    {['pending_confirmation', 'confirmed', 'pending_payment'].includes(booking.status) && (
                                                        <Button variant="outline-danger" size="sm" onClick={() => handleCancelBooking(booking.id)} className="px-1 py-0 me-1" title="Hủy đặt bàn" disabled={cancellingId === booking.id}> {cancellingId === booking.id ? <Spinner size="sm" animation="border" /> : <i className="bi bi-x-lg"></i>} </Button>
                                                    )}
                                                    {/* Nút Đánh Giá */}
                                                    {booking.status === 'completed' && !booking.review && ( // Kiểm tra !booking.review
                                                        <Button variant="outline-warning" size="sm" onClick={() => handleShowReviewModal(booking.id)} className="px-1 py-0" title="Viết đánh giá"><i className="bi bi-star-fill"></i></Button>
                                                    )}
                                                    {/* Nút Xem Đánh Giá */}
                                                    {booking.status === 'completed' && booking.review && (
                                                        <Button variant="outline-success" size="sm" onClick={() => handleShowDetail(booking.id)} className="px-1 py-0" title="Xem đánh giá"><i className="bi bi-chat-left-text-fill"></i></Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                {/* Footer và Phân trang */}
                                {pagination.total > 0 && (<Card.Footer className="text-muted small d-flex justify-content-between align-items-center flex-wrap bg-light border-top-0 pt-2 pb-1"> <span>Hiện {pagination.from}-{pagination.to} / {pagination.total} đơn.</span> {renderPagination()} </Card.Footer>)}
                            </Card>
                        </>
                    )}
                </>
            )}

            {/* Modal Hiển Thị Chi Tiết Booking */}
            {showDetailModal && ( // Render modal chỉ khi showDetailModal là true
                <BookingDetailModal
                    show={showDetailModal}
                    handleClose={handleCloseDetailModal}
                    booking={selectedBooking} // Chỉ truyền khi selectedBooking có giá trị
                    loading={loadingDetail}
                    error={detailError}
                    // Truyền hàm hủy xuống Modal
                    onCancelBooking={handleCancelBooking}
                />
            )}
            {/* Modal Loading Riêng cho chi tiết*/}
            <Modal show={showDetailModal && loadingDetail} onHide={handleCloseDetailModal} centered size="sm" backdrop="static">
                <Modal.Body className="text-center p-4"> <Spinner animation="border" variant="primary" /> <p className="mt-2 mb-0">Đang tải chi tiết...</p> </Modal.Body>
            </Modal>
            {/* Modal Viết Đánh Giá */}
            <WriteReviewModal
                show={showReviewModal}
                handleClose={handleCloseReviewModal}
                bookingId={reviewBookingId} // Truyền ID booking cần đánh giá
                onSubmitSuccess={handleReviewSubmitSuccess} // Truyền callback
            />
        </Container>
    );
}

// Đảm bảo đã import BookingDetailModal ở đầu file
// import BookingDetailModal from '../components/booking/BookingDetailModal.jsx';

export default MyBookingsPage;