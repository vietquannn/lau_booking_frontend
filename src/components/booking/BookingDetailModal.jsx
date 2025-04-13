// src/components/booking/BookingDetailModal.jsx
import React from 'react';
import { Modal, Button, Spinner, Alert, Row, Col, ListGroup, Image, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Base URL ảnh
const API_IMAGE_BASE_URL = import.meta.env.VITE_API_IMAGE_BASE_URL || 'http://restaurant-booking.test';

// Nhận thêm prop onCancelBooking từ MyBookingsPage
function BookingDetailModal({ show, handleClose, booking, loading, error, onCancelBooking }) {

    // Hàm xử lý lỗi ảnh
    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = '/images/placeholder.jpg';
    };

    // Hàm lấy variant màu cho Badge trạng thái (Copy từ MyBookingsPage hoặc tạo file utils chung)
    const getStatusVariant = (status) => {
        const variants = {
            confirmed: 'success', pending_payment: 'warning', pending_confirmation: 'info',
            completed: 'primary', cancelled_by_user: 'danger', cancelled_by_admin: 'danger',
            no_show: 'dark'
        };
        return variants[status] || 'secondary';
    };

     // Hàm dịch trạng thái (Copy từ MyBookingsPage hoặc tạo file utils chung)
     const translateStatus = (status) => {
         const statusMap = {
            pending_confirmation: 'Chờ xác nhận', pending_payment: 'Chờ thanh toán',
            confirmed: 'Đã xác nhận', completed: 'Đã hoàn thành',
            cancelled_by_user: 'Bạn đã hủy', cancelled_by_admin: 'Nhà hàng hủy',
            no_show: 'Không đến'
         };
         return statusMap[status] || status?.replace(/_/g, ' ')?.replace(/^\w/, c => c.toUpperCase()) || 'Không xác định';
     };

     // --- Hàm xử lý khi nhấn nút Hủy bên trong Modal ---
     const handleInternalCancel = () => {
         // Kiểm tra xem prop onCancelBooking có được truyền vào và là function không
         if (booking && typeof onCancelBooking === 'function') {
             // Gọi hàm onCancelBooking được truyền từ trang cha (MyBookingsPage)
             // Hàm này sẽ hiển thị confirm và gọi API hủy
             onCancelBooking(booking.id);
             // Đóng modal sau khi yêu cầu hủy (hàm cha sẽ xử lý kết quả và đóng nếu cần)
             handleClose();
         } else {
              console.error("onCancelBooking function was not passed to BookingDetailModal or booking is null");
              alert("Đã xảy ra lỗi, không thể thực hiện thao tác hủy."); // Thông báo lỗi chung
         }
     };


  return (
    // size="lg" cho modal rộng hơn, scrollable nếu nội dung dài
    <Modal show={show} onHide={handleClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title as="h5"> {/* Đổi thành h5 */}
            Chi Tiết Đặt Bàn {booking ? <Badge bg="secondary" pill>{booking.booking_code}</Badge> : ''}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Hiển thị loading hoặc error nếu có */}
        {loading && <div className="text-center p-5"><Spinner animation="border" variant="primary"/></div>}
        {error && <Alert variant="danger">Lỗi tải chi tiết: {error}</Alert>}

        {/* Hiển thị chi tiết booking nếu không loading, không lỗi và có booking */}
        {!loading && !error && booking && (
          <div>
            {/* Thông tin chung và Thanh toán/KM */}
            <Row className="mb-3">
                <Col md={6} className="mb-3 mb-md-0">
                    <h6><i className="bi bi-info-circle-fill me-2 text-primary"></i>Thông tin chung</h6>
                    <ListGroup variant="flush">
                        <ListGroup.Item className="px-0 py-1 d-flex justify-content-between"><span>Ngày:</span> <strong>{new Date(booking.booking_date).toLocaleDateString('vi-VN')}</strong></ListGroup.Item>
                        <ListGroup.Item className="px-0 py-1 d-flex justify-content-between"><span>Giờ:</span> <strong>{booking.booking_time?.substring(0, 5)}</strong></ListGroup.Item>
                        <ListGroup.Item className="px-0 py-1 d-flex justify-content-between"><span>Số khách:</span> <strong>{booking.num_guests}</strong></ListGroup.Item>
                        {booking.table && (
                            <ListGroup.Item className="px-0 py-1 d-flex justify-content-between"><span>Bàn:</span> <strong>{booking.table.table_number} ({booking.table.tableType?.name})</strong></ListGroup.Item>
                        )}
                         <ListGroup.Item className="px-0 py-1 d-flex justify-content-between"><span>Trạng thái:</span> <Badge bg={getStatusVariant(booking.status)} pill>{translateStatus(booking.status)}</Badge></ListGroup.Item>
                    </ListGroup>
                </Col>
                 <Col md={6}>
                    <h6><i className="bi bi-credit-card-2-front-fill me-2 text-success"></i>Thanh toán & Ưu đãi</h6>
                     <ListGroup variant="flush">
                        <ListGroup.Item className="px-0 py-1 d-flex justify-content-between"><span>Tổng tiền:</span> <strong className="text-danger">{parseInt(booking.total_amount).toLocaleString('vi-VN')} đ</strong></ListGroup.Item>
                        {booking.applied_promotions?.length > 0 && (
                             <ListGroup.Item className='px-0 py-1 d-flex justify-content-between text-success'>
                                 <span>Khuyến mãi:</span>
                                 <span>{booking.applied_promotions[0].promotion?.code} (-{parseInt(booking.applied_promotions[0].discount_amount).toLocaleString('vi-VN')} đ)</span>
                             </ListGroup.Item>
                        )}
                         {booking.payments?.length > 0 && (
                             <ListGroup.Item className="px-0 py-1 d-flex justify-content-between">
                                <span>Thanh toán:</span>
                                <span>
                                    {booking.payments[0].payment_method === 'vietqr' ? 'VietQR' : 'Tại quầy'} - <Badge bg={booking.payments[0].status === 'completed' ? 'success' : (booking.payments[0].status === 'pending' ? 'warning' : 'secondary')}>{booking.payments[0].status}</Badge>
                                </span>
                             </ListGroup.Item>
                         )}
                          {booking.special_requests && (
                              <ListGroup.Item className="px-0 py-1">
                                  <div className="fw-semibold">Yêu cầu đặc biệt:</div>
                                  <div className="text-muted small">{booking.special_requests}</div>
                              </ListGroup.Item>
                          )}
                     </ListGroup>
                 </Col>
            </Row>

             {/* Món đã đặt */}
             {booking.booking_items && booking.booking_items.length > 0 && (
                 <>
                     <hr className="my-2"/> {/* Giảm margin hr */}
                     <h6><i className="bi bi-basket-fill me-2 text-info"></i>Món đã đặt:</h6>
                     <ListGroup variant="flush">
                         {booking.booking_items.map(bItem => {
                             const itemImageUrl = bItem.menu_item?.image_url ? (bItem.menu_item.image_url.startsWith('http') || bItem.menu_item.image_url.startsWith('/storage') ? bItem.menu_item.image_url : `${API_IMAGE_BASE_URL}${bItem.menu_item.image_url}`) : '/images/placeholder.jpg';
                             return (
                                 <ListGroup.Item key={bItem.id} className="d-flex justify-content-between align-items-center px-0 py-2"> {/* Tăng padding y */}
                                     <div className='d-flex align-items-center'>
                                         <Image src={itemImageUrl} onError={handleImageError} alt={bItem.menu_item?.name} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }} />
                                         <div>
                                             <div className="fw-medium small">{bItem.menu_item?.name || '(Món đã xóa)'}</div>
                                             <small className="text-muted d-block">SL: {bItem.quantity} x {parseInt(bItem.price_at_booking).toLocaleString('vi-VN')} đ</small>
                                         </div>
                                     </div>
                                     <span className="fw-semibold small">{(bItem.quantity * parseInt(bItem.price_at_booking)).toLocaleString('vi-VN')} đ</span>
                                 </ListGroup.Item>
                             );
                        })}
                     </ListGroup>
                 </>
             )}

             {/* Đánh giá (nếu có) */}
              {booking.review && (
                  <>
                      <hr className="my-2"/>
                      <h6><i className="bi bi-star-half me-2 text-warning"></i>Đánh giá của bạn:</h6>
                      <div className="ps-2">
                            <p className="mb-1"><strong>Sao:</strong> {'⭐'.repeat(booking.review.rating)} <span className="text-muted">({booking.review.rating}/5)</span></p>
                            <p className="mb-1"><strong>Bình luận:</strong> {booking.review.comment || <span className="text-muted">Không có bình luận</span>}</p>
                            {booking.review.restaurant_response && (
                                <Alert variant='light' className='p-2 border mt-2 mb-0 small'>
                                    <strong className='d-block mb-1 text-primary'><i className="bi bi-chat-left-dots-fill me-1"></i>Phản hồi từ nhà hàng:</strong>
                                    {booking.review.restaurant_response}
                                </Alert>
                            )}
                      </div>
                  </>
              )}
          </div>
        )}
        {/* Trường hợp không có booking dù không lỗi, không loading */}
        {!loading && !error && !booking && (
             <Alert variant="info">Không có thông tin chi tiết.</Alert>
        )}
      </Modal.Body>
      <Modal.Footer className="justify-content-between"> {/* Đẩy nút sang 2 bên */}
        <div>
             {/* Nút Hủy đơn này */}
             {booking && ['pending_confirmation', 'confirmed', 'pending_payment'].includes(booking.status) && typeof onCancelBooking === 'function' && (
                  <Button variant="outline-danger" size="sm" onClick={handleInternalCancel}>
                       <i className="bi bi-x-lg me-1"></i> Hủy đơn này
                  </Button>
             )}
              {/* Nút đánh giá */}
             {booking && booking.status === 'completed' && !booking.review && (
                  <Button variant="outline-warning" size="sm" as={Link} to={`/review/${booking.id}`} onClick={handleClose}>
                       <i className="bi bi-star-fill me-1"></i> Viết đánh giá
                  </Button>
             )}
        </div>
        <Button variant="secondary" onClick={handleClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default BookingDetailModal;