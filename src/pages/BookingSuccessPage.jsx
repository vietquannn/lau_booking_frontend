import React from 'react';
import { Container, Alert, Card, Button, Row, Col, Image, ListGroup, Badge } from 'react-bootstrap'; // Thêm ListGroup, Badge
import { useLocation, Link, Navigate } from 'react-router-dom';

// Lấy base URL ảnh từ biến môi trường (nếu API trả về đường dẫn tương đối)
const API_IMAGE_BASE_URL = import.meta.env.VITE_API_IMAGE_BASE_URL || 'http://vietquannn.id.vn';

// Hàm xử lý URL ảnh
const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/images/placeholder.jpg';
    
    // Nếu URL đã là đường dẫn tuyệt đối (http/https), sử dụng trực tiếp
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // Nếu URL bắt đầu bằng /storage, thêm base URL
    if (imageUrl.startsWith('/storage')) {
        return `${API_IMAGE_BASE_URL}${imageUrl}`;
    }
    
    // Nếu URL là đường dẫn tương đối, thêm base URL
    return `${API_IMAGE_BASE_URL}/${imageUrl}`;
};

function BookingSuccessPage() {
  const location = useLocation();
  // Lấy dữ liệu booking và payment từ state được truyền qua navigate
  // Đặt giá trị mặc định là null nếu state không tồn tại hoặc không có key tương ứng
  const booking = location.state?.booking ?? null;
  const payment = location.state?.payment ?? null;

  // Nếu không có thông tin booking trong state, có thể người dùng truy cập trực tiếp URL
  // Chuyển hướng họ về trang đặt bàn hoặc trang chủ
  if (!booking) {
    console.warn("BookingSuccessPage accessed without booking state. Redirecting...");
    return <Navigate to="/booking" replace />; // replace=true để không lưu trang này vào lịch sử trình duyệt
  }

  // Xác định trạng thái để hiển thị thông báo phù hợp
  const isPendingPayment = booking.status === 'pending_payment' && payment?.method === 'vietqr';
  const isPayLater = booking.status === 'confirmed' && payment?.method === 'pay_later' && booking.total_amount >= 0;
  const isConfirmedFree = booking.status === 'confirmed' && booking.total_amount <= 0;

  // Hàm xử lý lỗi ảnh
  const handleImageError = (e) => {
    console.warn("Image failed to load:", e.target.src);
    e.target.onerror = null;
    e.target.src = '/images/placeholder.jpg';
  };

  // Hàm lấy variant màu cho Badge trạng thái
  const getStatusVariant = (status) => {
      switch (status) {
          case 'confirmed': return 'success';
          case 'pending_payment': return 'warning';
          case 'completed': return 'primary'; // Có thể không hiển thị ở đây
          case 'cancelled_by_user':
          case 'cancelled_by_admin':
          case 'no_show': return 'danger';
          default: return 'secondary'; // pending_confirmation hoặc trạng thái khác
      }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'pending_payment': return 'Chờ thanh toán';
      case 'completed': return 'Hoàn thành';
      case 'cancelled_by_user': return 'Đã hủy (bởi khách)';
      case 'cancelled_by_admin': return 'Đã hủy (bởi nhà hàng)';
      case 'no_show': return 'Không đến';
      default: return status.replace(/_/g, ' ');
    }
  };

  // Lấy thông tin khuyến mãi đã áp dụng (nếu có)
  const appliedPromo = booking.applied_promotions && booking.applied_promotions.length > 0
                        ? booking.applied_promotions[0] // Giả sử chỉ áp dụng 1 mã / đơn
                        : null;
  const discountAmount = appliedPromo ? parseInt(appliedPromo.discount_amount || 0) : 0;
  // Tính lại tổng tiền gốc (trước khi giảm giá) để hiển thị
  const originalSubtotal = booking.total_amount + discountAmount;

  return (
    // Sử dụng page-container class cho padding chung
    <Container className="page-container text-center">

      {/* Phần Thông Báo Chính */}
      {isPendingPayment ? (
        <Alert variant="warning" className="shadow-sm">
          <Alert.Heading as="h4"><i className="bi bi-hourglass-split me-2"></i>Đặt bàn thành công! Vui lòng thanh toán.</Alert.Heading>
          <p>
            Quét mã QR dưới đây bằng ứng dụng Ngân hàng/Ví điện tử để thanh toán{' '}
            <strong>{parseInt(payment?.amount || 0).toLocaleString('vi-VN')} đ</strong>.
          </p>
          <p>
            Nội dung chuyển khoản (bắt buộc): <strong>{payment?.description || booking.booking_code}</strong>
          </p>
           <p className="mb-0 small text-muted">Đơn hàng sẽ được tự động xác nhận sau khi thanh toán thành công.</p>
        </Alert>
      ) : (
        <Alert variant="success" className="shadow-sm">
          <Alert.Heading as="h4"><i className="bi bi-check-circle-fill me-2"></i>Đặt bàn thành công!</Alert.Heading>
          <p>
            Cảm ơn bạn đã tin tưởng Nhà Hàng Lẩu Ngon. Mã đặt bàn của bạn là: <br />
            <strong className="fs-5 text-primary">{booking.booking_code}</strong>.
          </p>
          {isPayLater && (
             <p>Vui lòng thanh toán tại quầy khi đến nhà hàng.</p>
          )}
           {isConfirmedFree && (
             <p>Đơn đặt bàn của bạn đã được xác nhận (Không cần thanh toán).</p>
          )}
          <hr />
          <p className="mb-0">
            Xem chi tiết và quản lý đơn hàng trong <Link to="/my-bookings" className="alert-link">Lịch sử đặt bàn</Link>.
          </p>
        </Alert>
      )}

      {/* Hiển thị Mã QR nếu cần thanh toán */}
      {isPendingPayment && payment?.qr_code_url && (
          <Card className="mt-4 mx-auto shadow-sm border-warning" style={{ maxWidth: '400px' }}>
            <Card.Header as="h5" className="bg-warning text-dark">Thanh Toán VietQR</Card.Header>
            <Card.Body className="d-flex flex-column align-items-center p-4">
                  <Image
                      src={payment.qr_code_url}
                      alt="VietQR Code"
                      fluid
                      className="mb-3 border p-1" // Thêm padding và border
                      style={{ maxWidth: '280px' }} // Giảm kích thước một chút
                  />
              <p className="mb-1">Số tiền: <strong className='text-danger fs-4'>{parseInt(payment.amount).toLocaleString('vi-VN')} đ</strong></p>
              <p className="text-muted mb-0">Nội dung CK:</p>
              <p><strong className='text-primary fs-5'>{payment.description}</strong></p>
               {/* TODO: Thêm nút kiểm tra trạng thái TT */}
               {/* <Button variant="outline-primary" size="sm" disabled>Kiểm tra thanh toán</Button> */}
            </Card.Body>
          </Card>
      )}

      {/* Tóm Tắt Đơn Hàng */}
       <Card className="mt-5 text-start shadow-sm">
            <Card.Header as="h5">Tóm tắt đơn hàng: {booking.booking_code}</Card.Header>
            <Card.Body>
                <Row className="gy-3"> {/* Thêm gy-3 */}
                    <Col lg={6}>
                        <h6><i className="bi bi-info-circle-fill me-2 text-primary"></i>Thông tin chung</h6>
                        <ListGroup variant="flush">
                            <ListGroup.Item className="px-0 py-1"><span className="fw-semibold me-2">Ngày:</span> {new Date(booking.booking_date).toLocaleDateString('vi-VN')}</ListGroup.Item>
                            <ListGroup.Item className="px-0 py-1"><span className="fw-semibold me-2">Giờ:</span> {booking.booking_time?.substring(0, 5)}</ListGroup.Item>
                            <ListGroup.Item className="px-0 py-1"><span className="fw-semibold me-2">Số khách:</span> {booking.num_guests}</ListGroup.Item>
                             {booking.table && (
                                <ListGroup.Item className="px-0 py-1"><span className="fw-semibold me-2">Bàn:</span> {booking.table.table_number} ({booking.table.tableType?.name})</ListGroup.Item>
                             )}
                              <ListGroup.Item className="px-0 py-1"><span className="fw-semibold me-2">Trạng thái:</span> <Badge bg={getStatusVariant(booking.status)} pill>{translateStatus(booking.status)}</Badge></ListGroup.Item>
                        </ListGroup>
                    </Col>
                     <Col lg={6}>
                        <h6><i className="bi bi-credit-card-2-front-fill me-2 text-success"></i>Thanh toán & Chi phí</h6>
                        <ListGroup variant="flush">
                           {/* Hiển thị tổng tiền món + phụ phí bàn (nếu có KM) */}
                           {discountAmount > 0 && (
                               <ListGroup.Item className="px-0 py-1 d-flex justify-content-between">
                                   <span>Tạm tính:</span>
                                   <span className='text-muted'>{originalSubtotal.toLocaleString('vi-VN')} đ</span>
                               </ListGroup.Item>
                           )}
                            {/* Hiển thị thông tin khuyến mãi đã áp dụng */}
                            {appliedPromo && (
                                <ListGroup.Item className='px-0 py-1 d-flex justify-content-between text-success'>
                                    <span><i className="bi bi-tags-fill me-1"></i>KM ({appliedPromo.promotion?.code}):</span>
                                    <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                                </ListGroup.Item>
                            )}
                             {/* Hiển thị Tổng tiền cuối cùng */}
                             <ListGroup.Item className="px-0 pt-2 d-flex justify-content-between fw-bold fs-5 border-top mt-2">
                                 <span>Tổng cộng:</span>
                                 <span className="text-danger">{parseInt(booking.total_amount).toLocaleString('vi-VN')} đ</span>
                             </ListGroup.Item>
                             {/* Thông tin thanh toán */}
                             {booking.payments && booking.payments.length > 0 && (
                                 <ListGroup.Item className="px-0 py-1 d-flex justify-content-between">
                                     <span>Thanh toán:</span>
                                     <span>
                                         {booking.payments[0].payment_method === 'vietqr' ? 'VietQR' : 'Tại quầy'} - <Badge bg={booking.payments[0].status === 'completed' ? 'success' : (booking.payments[0].status === 'pending' ? 'warning' : 'secondary')}>{booking.payments[0].status}</Badge>
                                     </span>
                                 </ListGroup.Item>
                             )}
                             {booking.special_requests && (
                                 <ListGroup.Item className="px-0 py-1">
                                     <span className="fw-semibold">Yêu cầu đặc biệt:</span><br/>
                                     <small className='text-muted'>{booking.special_requests}</small>
                                 </ListGroup.Item>
                             )}
                        </ListGroup>
                    </Col>
                </Row>

                 {/* Hiển thị món ăn đã đặt */}
                 {booking.booking_items && booking.booking_items.length > 0 && (
                     <>
                         <hr className="my-3"/>
                         <h6><i className="bi bi-basket-fill me-2"></i>Món đã đặt:</h6>
                         <ListGroup variant="flush">
                             {booking.booking_items.map(bItem => (
                                 <ListGroup.Item key={bItem.id} className="d-flex justify-content-between align-items-center px-0">
                                     <div className='d-flex align-items-center'>
                                         <Image
                                             src={getImageUrl(bItem.menu_item?.image_url)}
                                             onError={handleImageError}
                                             alt={bItem.menu_item?.name}
                                             style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }}
                                         />
                                         <div>
                                             <div className="fw-bold">{bItem.menu_item?.name || 'Món đã bị xóa'}</div>
                                             <small className="text-muted">SL: {bItem.quantity} x {parseInt(bItem.price_at_booking).toLocaleString('vi-VN')} đ</small>
                                         </div>
                                     </div>
                                     <span className="fw-semibold">
                                         {(bItem.quantity * parseInt(bItem.price_at_booking)).toLocaleString('vi-VN')} đ
                                     </span>
                                 </ListGroup.Item>
                             ))}
                         </ListGroup>
                     </>
                 )}
            </Card.Body>
            <Card.Footer className="text-center">
                 <Button as={Link} to="/my-bookings" variant="outline-primary" size="sm" className="me-2">Xem tất cả lịch sử</Button>
                 <Button as={Link} to="/menu" variant="outline-secondary" size="sm">Quay lại thực đơn</Button>
            </Card.Footer>
       </Card>

    </Container>
  );
}

export default BookingSuccessPage;