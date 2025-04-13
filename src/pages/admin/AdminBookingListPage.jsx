// src/pages/admin/AdminBookingListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Table, Spinner, Alert, Pagination, Form, Row, Col, Badge, InputGroup, Tooltip, OverlayTrigger, Modal } from 'react-bootstrap';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { adminBookingService } from '../../services/admin.booking.service'; // Service admin booking
import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // Hook admin auth (optional, for permission checks later)
import BookingDetailModal from '../../components/booking/BookingDetailModal.jsx'; // Reuse modal detail (cần sửa để nhận thêm prop isAdmin)
import DatePicker from 'react-datepicker'; // Date picker cho bộ lọc
import 'react-datepicker/dist/react-datepicker.css';
import vi from 'date-fns/locale/vi';
import { registerLocale } from 'react-datepicker';
import { toast } from 'react-hot-toast';
registerLocale('vi', vi);

// --- Tooltip Component ---
const renderTooltip = (props, text) => ( <Tooltip {...props}>{text}</Tooltip> );

function AdminBookingListPage() {
    // const { admin, isAdminAuthenticated } = useAuthAdmin(); // Lấy thông tin admin nếu cần check quyền
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 15 });
    const [searchParams, setSearchParams] = useSearchParams();

    // --- State cho bộ lọc ---
    const [filterDate, setFilterDate] = useState(searchParams.get('date') ? new Date(searchParams.get('date') + 'T00:00:00') : null); // Lưu Date object hoặc null
    const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
    const [filterCode, setFilterCode] = useState(searchParams.get('booking_code') || '');
    const [filterCustomer, setFilterCustomer] = useState(searchParams.get('customer') || '');

    // State cho Modal chi tiết
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null); // ID booking đang cập nhật status

    // Lấy trang hiện tại từ URL
    const currentPage = parseInt(searchParams.get('page') || '1');

    // --- Hàm Fetch Bookings ---
    const fetchBookings = useCallback(async (page, filters) => {
        setLoading(true); setError(null);
        try {
            // Xây dựng params từ state bộ lọc
            const params = {
                page,
                per_page: 15, // Hoặc lấy từ state/config
                date: filters.date ? `${filters.date.getFullYear()}-${String(filters.date.getMonth() + 1).padStart(2, '0')}-${String(filters.date.getDate()).padStart(2, '0')}` : undefined,
                status: filters.status || undefined,
                booking_code: filters.code || undefined,
                customer: filters.customer || undefined,
                sort_by: 'booking_date', // Có thể thêm sort vào state filter
                sort_dir: 'desc'
            };
            // Loại bỏ các param undefined
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await adminBookingService.getBookings(params); // Gọi service
            if (response.data?.success) {
                setBookings(response.data.data.data || []);
                // Lưu thông tin phân trang từ API
                setPagination({
                    current_page: response.data.data.current_page || 1,
                    last_page: response.data.data.last_page || 1,
                    total: response.data.data.total || 0,
                    from: response.data.data.from || 0,
                    to: response.data.data.to || 0,
                    per_page: response.data.data.per_page || 15
                });
            } else { 
                setError(response.data?.message || 'Lỗi tải danh sách.'); 
                setBookings([]); 
                setPagination({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 15 }); 
            }
        } catch (err) {
            if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); }
            setBookings([]); 
            setPagination({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 15 });
        } finally { setLoading(false); }
    }, []); // Dependency rỗng, sẽ gọi lại thủ công hoặc qua useEffect khác

    // --- useEffect gọi fetch khi trang hoặc searchParams thay đổi ---
    useEffect(() => {
        // Lấy các giá trị filter từ searchParams để gọi API
        const page = parseInt(searchParams.get('page') || '1');
        const status = searchParams.get('status') || '';
        const dateStr = searchParams.get('date');
        const date = dateStr ? new Date(dateStr + 'T00:00:00') : null;
        const code = searchParams.get('booking_code') || '';
        const customer = searchParams.get('customer') || '';

        // Cập nhật state của bộ lọc để input hiển thị đúng
        setFilterStatus(status);
        setFilterDate(date);
        setFilterCode(code);
        setFilterCustomer(customer);

        // Gọi hàm fetch
        fetchBookings(page, { status, date, code, customer });

    }, [searchParams, fetchBookings]); // Chạy lại khi searchParams thay đổi


    // --- Handlers cho Modal Chi Tiết ---
    const handleShowDetail = async (bookingId) => {
        setSelectedBooking(null);
        setDetailError(null);
        setShowDetailModal(true);
        setLoadingDetail(true);

        try {
            const response = await adminBookingService.getBookingDetail(bookingId);
            setSelectedBooking(response.data.data);
        } catch (error) {
            console.error('Error fetching booking detail:', error);
            setDetailError(error.response?.data?.message || 'Không thể tải thông tin chi tiết đơn đặt bàn.');
        } finally {
            setLoadingDetail(false);
        }
    };
    const handleCloseDetailModal = useCallback(() => { setShowDetailModal(false); setSelectedBooking(null); setDetailError(null); }, []);


    // --- Handlers cho các Action của Admin ---
    const handleAdminAction = useCallback(async (actionType, booking, payload = {}) => {
        if (updatingStatusId) return; // Ngăn action khi đang xử lý action khác
        const bookingId = booking.id;
        const confirmMessages = {
            confirm: `Xác nhận đơn đặt bàn #${booking.booking_code}?`,
            cancel: `Hủy đơn đặt bàn #${booking.booking_code}? (Bởi Admin)`,
            complete: `Đánh dấu đơn #${booking.booking_code} là ĐÃ HOÀN THÀNH?`,
            no_show: `Đánh dấu đơn #${booking.booking_code} là KHÔNG ĐẾN?`,
            confirm_payment: `Xác nhận ĐÃ THANH TOÁN cho đơn #${booking.booking_code}?`,
            // Thêm các action khác nếu cần
        };

        if (window.confirm(confirmMessages[actionType] || "Bạn có chắc muốn thực hiện hành động này?")) {
            setUpdatingStatusId(bookingId); // Đánh dấu đang xử lý
            setError(null);
            let apiCall;

            try {
                switch(actionType) {
                    case 'confirm':
                        apiCall = adminBookingService.confirmBooking(bookingId); break;
                    case 'cancel':
                        // Có thể thêm input lý do hủy
                        apiCall = adminBookingService.cancelBooking(bookingId /*, reason */); break;
                    case 'complete':
                        apiCall = adminBookingService.updateBookingStatus(bookingId, 'completed'); break;
                    case 'no_show':
                        apiCall = adminBookingService.updateBookingStatus(bookingId, 'no_show'); break;
                    case 'confirm_payment':
                        apiCall = adminBookingService.confirmPayment(bookingId /*, transactionId */); break;
                    // TODO: Thêm case cho updateTable nếu muốn làm từ danh sách
                    default: throw new Error('Hành động không hợp lệ');
                }

                const response = await apiCall;
                if (response.data?.success) {
                    alert('Thao tác thành công!');
                    // Cập nhật lại dòng booking trong state hoặc fetch lại toàn bộ trang
                    setBookings(prev => prev.map(b => b.id === bookingId ? response.data.data : b));
                    // fetchBookings(currentPage, { status: filterStatus, date: filterDate, code: filterCode, customer: filterCustomer });
                } else {
                    setError(response.data?.message || `Lỗi khi ${actionType} đơn hàng.`);
                }
            } catch (err) {
                 console.error(`Admin action ${actionType} error:`, err);
                 if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi thực hiện thao tác.'); }
            } finally {
                setUpdatingStatusId(null); // Reset trạng thái đang xử lý
            }
        }
    }, [updatingStatusId, currentPage, filterStatus, filterDate, filterCode, filterCustomer, fetchBookings]); // Dependencies


    // --- Handlers cho Bộ lọc ---
    const handleFilterDateChange = (date) => { setFilterDate(date); };
    const handleFilterStatusChange = (e) => { setFilterStatus(e.target.value); };
    const handleFilterCodeChange = (e) => { setFilterCode(e.target.value); };
    const handleFilterCustomerChange = (e) => { setFilterCustomer(e.target.value); };

    // Hàm áp dụng bộ lọc (cập nhật URL)
    const applyFilters = () => {
        const newSearchParams = new URLSearchParams();
        if (filterStatus) newSearchParams.set('status', filterStatus);
        if (filterDate) newSearchParams.set('date', `${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, '0')}-${String(filterDate.getDate()).padStart(2, '0')}`);
        if (filterCode.trim()) newSearchParams.set('booking_code', filterCode.trim());
        if (filterCustomer.trim()) newSearchParams.set('customer', filterCustomer.trim());
        newSearchParams.set('page', '1'); // Luôn về trang 1 khi lọc
        setSearchParams(newSearchParams);
    };

    // Hàm xóa bộ lọc
    const clearFilters = () => {
        setFilterStatus(''); setFilterDate(null); setFilterCode(''); setFilterCustomer('');
        setSearchParams({ page: '1' }); // Chỉ giữ lại page 1
    };


    // --- Hàm Đổi Trang Phân Trang ---
    const handlePageChange = (pageNumber) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', pageNumber.toString());
        setSearchParams(newSearchParams);
    };

    // --- Render Component Phân Trang ---
    const renderPagination = () => {
        if (pagination.total <= pagination.per_page) return null;

        const items = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, pagination.current_page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pagination.last_page, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Nút Previous
        items.push(
            <Pagination.Item
                key="prev"
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
            >
                &laquo;
            </Pagination.Item>
        );

        // Nút First Page
        if (startPage > 1) {
            items.push(
                <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
                    1
                </Pagination.Item>
            );
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="start-ellipsis" />);
            }
        }

        // Các nút số trang
        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <Pagination.Item
                    key={i}
                    active={i === pagination.current_page}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </Pagination.Item>
            );
        }

        // Nút Last Page
        if (endPage < pagination.last_page) {
            if (endPage < pagination.last_page - 1) {
                items.push(<Pagination.Ellipsis key="end-ellipsis" />);
            }
            items.push(
                <Pagination.Item
                    key={pagination.last_page}
                    onClick={() => handlePageChange(pagination.last_page)}
                >
                    {pagination.last_page}
                </Pagination.Item>
            );
        }

        // Nút Next
        items.push(
            <Pagination.Item
                key="next"
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
            >
                &raquo;
            </Pagination.Item>
        );

        return (
            <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted small">
                    Hiển thị {pagination.from} - {pagination.to} / {pagination.total} đơn đặt bàn
                </div>
                <Pagination className="mb-0">{items}</Pagination>
            </div>
        );
    };

    // --- Hàm Lấy Variant Màu ---
    const getStatusVariant = useCallback((status) => {
        switch (status) {
            case 'pending_confirmation': return 'warning';
            case 'pending_payment': return 'info';
            case 'confirmed': return 'primary';
            case 'completed': return 'success';
            case 'cancelled_by_user': return 'danger';
            case 'cancelled_by_admin': return 'danger';
            case 'no_show': return 'dark';
            default: return 'secondary';
        }
    }, []);

    // --- Hàm dịch trạng thái ---
    const translateStatus = useCallback((status) => {
        switch (status) {
            case 'pending_confirmation': return 'Chờ xác nhận';
            case 'pending_payment': return 'Chờ thanh toán';
            case 'confirmed': return 'Đã xác nhận';
            case 'completed': return 'Đã hoàn thành';
            case 'cancelled_by_user': return 'User hủy';
            case 'cancelled_by_admin': return 'Admin hủy';
            case 'no_show': return 'Không đến';
            default: return status;
        }
    }, []);

    const handleConfirmBooking = async (bookingId) => {
        try {
            await adminBookingService.confirmBooking(bookingId);
            toast.success('Xác nhận đơn đặt bàn thành công');
            fetchBookings(); // Refresh danh sách
        } catch (error) {
            console.error('Error confirming booking:', error);
            toast.error(error.response?.data?.message || 'Không thể xác nhận đơn đặt bàn');
        }
    };

    const handleCancelBooking = async (bookingId) => {
        try {
            const reason = window.prompt('Nhập lý do hủy đơn đặt bàn:');
            if (reason === null) return; // User clicked Cancel
            
            await adminBookingService.cancelBooking(bookingId, reason);
            toast.success('Hủy đơn đặt bàn thành công');
            fetchBookings(); // Refresh danh sách
        } catch (error) {
            console.error('Error canceling booking:', error);
            toast.error(error.response?.data?.message || 'Không thể hủy đơn đặt bàn');
        }
    };

    // ---- Render ----
    return (
        <Container fluid className="py-3">
            <Card className="shadow-sm">
                <Card.Header as="h5" className="bg-primary text-white d-flex justify-content-between align-items-center">
                    Quản Lý Đơn Đặt Bàn
                    {/* Có thể thêm nút xuất Excel/PDF ở đây */}
                </Card.Header>
                <Card.Body>
                    {/* --- Khu vực bộ lọc --- */}
                    <Form className="mb-3 p-3 bg-light border rounded">
                        <Row className="g-2 align-items-end">
                            <Col md={3} sm={6}>
                                <Form.Group controlId="filterDate">
                                    <Form.Label className='small mb-1 fw-semibold'>Ngày đặt</Form.Label>
                                    <DatePicker selected={filterDate} onChange={handleFilterDateChange} dateFormat="dd/MM/yyyy" className="form-control form-control-sm" locale="vi" placeholderText="Chọn ngày..." isClearable disabled={loading}/>
                                </Form.Group>
                            </Col>
                            <Col md={2} sm={6}>
                                <Form.Group controlId="filterStatus">
                                    <Form.Label className='small mb-1 fw-semibold'>Trạng thái</Form.Label>
                                    <Form.Select value={filterStatus} onChange={handleFilterStatusChange} disabled={loading} size="sm">
                                         <option value="">Tất cả</option>
                                         {/* ... options trạng thái ... */}
                                         <option value="pending_confirmation">Chờ xác nhận</option>
                                         <option value="pending_payment">Chờ thanh toán</option>
                                         <option value="confirmed">Đã xác nhận</option>
                                         <option value="completed">Đã hoàn thành</option>
                                         <option value="cancelled_by_user">User hủy</option>
                                         <option value="cancelled_by_admin">Admin hủy</option>
                                         <option value="no_show">Không đến</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3} sm={6}>
                                <Form.Group controlId="filterCustomer">
                                     <Form.Label className='small mb-1 fw-semibold'>Khách hàng</Form.Label>
                                     <Form.Control type="text" placeholder="Tên, email, sđt..." size="sm" value={filterCustomer} onChange={handleFilterCustomerChange} disabled={loading}/>
                                </Form.Group>
                            </Col>
                             <Col md={2} sm={6}>
                                <Form.Group controlId="filterCode">
                                     <Form.Label className='small mb-1 fw-semibold'>Mã ĐB</Form.Label>
                                     <Form.Control type="text" placeholder="BK..." size="sm" value={filterCode} onChange={handleFilterCodeChange} disabled={loading}/>
                                </Form.Group>
                            </Col>
                            <Col md="auto" sm={12} className="mt-3 mt-md-0"> {/* Nút lọc/xóa lọc */}
                                <div className="d-flex gap-2">
                                    <Button variant="primary" size="sm" onClick={applyFilters} disabled={loading}> <i className="bi bi-funnel-fill"></i> Lọc </Button>
                                    <Button variant="outline-secondary" size="sm" onClick={clearFilters} disabled={loading}> <i className="bi bi-x-lg"></i> Xóa lọc </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>

                    {/* Hiển thị Loading / Lỗi / Danh sách */}
                    {loading && <div className="text-center my-5"><Spinner animation="border" variant="primary"/></div>}
                    {error && !loading && <Alert variant="danger">Lỗi: {error}</Alert>}
                    {!loading && !error && bookings.length === 0 && (
                         <Alert variant="light" className='text-center border'>Không tìm thấy đơn đặt bàn nào phù hợp.</Alert>
                    )}
                    {!loading && !error && bookings.length > 0 && (
                        <>
                            <Table responsive striped bordered hover className="mb-0 align-middle" size="sm">
                                <thead className='table-light'>
                                    <tr>
                                        <th>Mã ĐB</th>
                                        <th>Khách Hàng</th>
                                        <th>Ngày Giờ</th>
                                        <th className='text-center'>Bàn</th>
                                        <th className='text-end'>Tổng Tiền</th>
                                        <th>Yêu cầu đặc biệt</th>
                                        <th className='text-center'>Trạng Thái</th>
                                        <th className='text-center' style={{ minWidth: '150px' }}>Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(booking => {
                                        const isProcessing = updatingStatusId === booking.id;
                                        return (
                                            <tr key={booking.id}>
                                                <td><code>{booking.booking_code}</code></td>
                                                <td>{booking.user?.name || '-'} <br/><small className="text-muted">{booking.user?.email}</small></td>
                                                <td>{new Date(booking.booking_date).toLocaleDateString('vi-VN')} <br/><small className="text-muted">{booking.booking_time?.substring(0, 5)}</small></td>
                                                <td className='text-center'>{booking.table?.table_number}<br/><small className="text-muted">({booking.table?.tableType?.name})</small></td>
                                                <td className='text-end fw-medium'>{parseInt(booking.total_amount).toLocaleString('vi-VN')} đ</td>
                                                <td>{booking.special_requests || '-'}</td>
                                                <td className='text-center'>
                                                    <Badge bg={getStatusVariant(booking.status)} pill className="px-2 py-1 small">
                                                        {translateStatus(booking.status)}
                                                    </Badge>
                                                </td>
                                                <td className='text-center'>
                                                    {/* Actions */}
                                                    <OverlayTrigger placement="top" overlay={props => renderTooltip(props, "Xem chi tiết")}>
                                                        <Button variant="outline-secondary" size="sm" onClick={() => handleShowDetail(booking.id)} className="me-1 px-1 py-0" disabled={isProcessing}><i className="bi bi-eye-fill"></i></Button>
                                                    </OverlayTrigger>

                                                    {/* Các nút thay đổi trạng thái */}
                                                    {booking.status === 'pending_confirmation' && (
                                                        <OverlayTrigger placement="top" overlay={props => renderTooltip(props, "Xác nhận đơn")}>
                                                            <Button variant="outline-success" size="sm" onClick={() => handleAdminAction('confirm', booking)} className="me-1 px-1 py-0" disabled={isProcessing}>{isProcessing ? <Spinner size="sm" animation="border"/> : <i className="bi bi-check-lg"></i>}</Button>
                                                        </OverlayTrigger>
                                                    )}
                                                    {booking.status === 'pending_payment' && (
                                                         <OverlayTrigger placement="top" overlay={props => renderTooltip(props, "Xác nhận thanh toán")}>
                                                            <Button variant="outline-success" size="sm" onClick={() => handleAdminAction('confirm_payment', booking)} className="me-1 px-1 py-0" disabled={isProcessing}>{isProcessing ? <Spinner size="sm" animation="border"/> : <i className="bi bi-patch-check-fill"></i>}</Button>
                                                        </OverlayTrigger>
                                                    )}
                                                    {['confirmed', 'pending_payment'].includes(booking.status) && ( // Cho phép hoàn thành nếu đã confirmed hoặc đang chờ thanh toán (trả sau)
                                                         <OverlayTrigger placement="top" overlay={props => renderTooltip(props, "Đánh dấu Hoàn thành")}>
                                                            <Button variant="outline-primary" size="sm" onClick={() => handleAdminAction('complete', booking)} className="me-1 px-1 py-0" disabled={isProcessing}>{isProcessing ? <Spinner size="sm" animation="border"/> : <i className="bi bi-check-all"></i>}</Button>
                                                        </OverlayTrigger>
                                                    )}
                                                     {['confirmed', 'pending_payment'].includes(booking.status) && (
                                                         <OverlayTrigger placement="top" overlay={props => renderTooltip(props, "Đánh dấu Không đến")}>
                                                             <Button variant="outline-dark" size="sm" onClick={() => handleAdminAction('no_show', booking)} className="me-1 px-1 py-0" disabled={isProcessing}>{isProcessing ? <Spinner size="sm" animation="border"/> : <i className="bi bi-person-x-fill"></i>}</Button>
                                                         </OverlayTrigger>
                                                     )}
                                                      {['pending_confirmation', 'confirmed', 'pending_payment'].includes(booking.status) && (
                                                          <OverlayTrigger placement="top" overlay={props => renderTooltip(props, "Hủy bởi Admin")}>
                                                              <Button variant="outline-danger" size="sm" onClick={() => handleAdminAction('cancel', booking)} className="px-1 py-0" disabled={isProcessing}>{isProcessing ? <Spinner size="sm" animation="border"/> : <i className="bi bi-x-octagon-fill"></i>}</Button>
                                                          </OverlayTrigger>
                                                      )}
                                                    {/* TODO: Thêm nút đổi bàn (có thể mở modal riêng) */}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                            {pagination.total > 0 && (
                                <Card.Footer className="text-muted small d-flex justify-content-between align-items-center flex-wrap bg-light border-top-0 pt-2 pb-1">
                                    {renderPagination()}
                                </Card.Footer>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Modal Chi Tiết */}
             {showDetailModal && ( <BookingDetailModal show={showDetailModal} handleClose={handleCloseDetailModal} booking={selectedBooking} loading={loadingDetail} error={detailError} isAdminView={true} /* Thêm prop isAdminView để modal biết là admin đang xem */ /> )}
             {/* Modal Loading Riêng */}
             <Modal show={showDetailModal && loadingDetail} onHide={handleCloseDetailModal} centered size="sm" backdrop="static"> {/* ... */} </Modal>

        </Container>
    );
}

export default AdminBookingListPage;