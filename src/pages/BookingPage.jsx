// src/pages/BookingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert, Card, ListGroup, InputGroup, Badge, Image, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/booking.service';
import { useAuth } from '../hooks/useAuth'; // Hook xác thực
import { useCart } from '../hooks/useCart'; // Hook giỏ hàng
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import vi from 'date-fns/locale/vi';
registerLocale('vi', vi);

// Base URL ảnh
const API_IMAGE_BASE_URL = import.meta.env.VITE_API_IMAGE_BASE_URL || 'http://vietquannn.id.vn';

// Debounce function
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

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

// Hàm xử lý lỗi ảnh
const handleImageError = (e) => {
    console.warn("Image failed to load:", e.target.src);
    e.target.onerror = null;
    e.target.src = '/images/placeholder.jpg';
};

function BookingPage() {
    const { user, isAuthenticated } = useAuth();
    const { items: cartItems, totalAmount: cartTotalAmount, clearCart, removeItem, updateQuantity } = useCart(); // Lấy đầy đủ từ useCart
    const navigate = useNavigate();

    // --- Form States ---
    const [selectedDate, setSelectedDate] = useState(() => { const today = new Date(); today.setHours(0, 0, 0, 0); return today; });
    const [numGuests, setNumGuests] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [promotionCode, setPromotionCode] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('pay_later');

    // --- Slot/Table Selection States ---
    const [availableSlots, setAvailableSlots] = useState({ timeSlots: [], tableTypes: [] });
    const [availableTables, setAvailableTables] = useState([]);
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedTableId, setSelectedTableId] = useState('');
    const [selectedTableSurcharge, setSelectedTableSurcharge] = useState(0);

    // --- UI States ---
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState(null);
    const [loadingTables, setLoadingTables] = useState(false);
    const [tablesError, setTablesError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // --- Modal States ---
    const [showImageModal, setShowImageModal] = useState(false);

    // --- API Callbacks ---
    const fetchAvailableSlots = useCallback(async (date, guests) => {
        if (!date || !guests || guests < 1 || !isAuthenticated) { // Thêm kiểm tra isAuthenticated
            setAvailableSlots({ timeSlots: [], tableTypes: [] }); setSelectedTime(''); setSelectedTableId(''); setAvailableTables([]); setSlotsError(null); setSelectedTableSurcharge(0); return;
        }
        setLoadingSlots(true); setSlotsError(null);
        setAvailableSlots({ timeSlots: [], tableTypes: [] }); setSelectedTime(''); setSelectedTableId(''); setAvailableTables([]); setSelectedTableSurcharge(0);
        try {
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const response = await bookingService.getAvailableSlots(formattedDate, guests);
            if (response.data?.success) {
                const data = response.data.data;
                setAvailableSlots({ timeSlots: data.available_time_slots || [], tableTypes: data.available_table_types || [] });
                setSlotsError(null);
            } else { setSlotsError(response.data?.message || 'Lỗi tìm khung giờ.'); }
        } catch (err) { setSlotsError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); }
        finally { setLoadingSlots(false); }
    }, [isAuthenticated]); // Thêm isAuthenticated

    const fetchAvailableTables = useCallback(async (date, time, guests) => {
        if (!date || !time || !guests || guests < 1 || !isAuthenticated) { // Thêm kiểm tra isAuthenticated
            setAvailableTables([]); setSelectedTableId(''); setTablesError(null); return;
        }
        setLoadingTables(true); setTablesError(null); setAvailableTables([]); setSelectedTableId('');
        try {
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const response = await bookingService.getAvailableTables(formattedDate, time, guests);
            if (response.data?.success) {
                console.log('Available tables response:', response.data.data);
                setAvailableTables(response.data.data || []);
                if (!response.data.data || response.data.data.length === 0) { setTablesError(null); }
                else { setTablesError(null); }
            } else { setTablesError(response.data?.message || 'Lỗi tìm bàn cụ thể.'); }
        } catch (err) { setTablesError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); }
        finally { setLoadingTables(false); }
    }, [isAuthenticated]); // Thêm isAuthenticated

    // --- useEffects ---
    useEffect(() => {
        // Chỉ fetch khi đã đăng nhập
        if (isAuthenticated) {
            const debouncedFetchSlots = debounce(fetchAvailableSlots, 500);
            debouncedFetchSlots(selectedDate, numGuests);
        } else {
            // Reset state nếu không đăng nhập
            setAvailableSlots({ timeSlots: [], tableTypes: [] }); setAvailableTables([]);
            setSelectedTime(''); setSelectedTableId('');
            setSlotsError(null); setTablesError(null);
        }
    }, [selectedDate, numGuests, fetchAvailableSlots, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && selectedTime && selectedDate && numGuests > 0) {
            fetchAvailableTables(selectedDate, selectedTime, numGuests);
        } else {
            setAvailableTables([]); setSelectedTableId(''); setTablesError(null);
        }
    }, [selectedTime, selectedDate, numGuests, fetchAvailableTables, isAuthenticated]);

    useEffect(() => {
        let surcharge = 0;
        if (selectedTableId) {
            const table = availableTables.find(t => t.id === parseInt(selectedTableId));
            console.log('Selected table:', table);
            console.log('Table type:', table?.tableType);
            console.log('Surcharge:', table?.tableType?.surcharge);
            
            // Kiểm tra nhiều vị trí có thể chứa surcharge
            surcharge = table?.tableType?.surcharge || 
                       table?.surcharge || 
                       table?.table_type?.surcharge ||
                       table?.type?.surcharge ||
                       0;
            
            console.log('Final surcharge:', surcharge);
        }
        setSelectedTableSurcharge(parseInt(surcharge) || 0); // Đảm bảo là số
    }, [selectedTableId, availableTables]);

    // --- Tính tổng tiền tạm tính ---
    const calculatedSubtotal = cartTotalAmount + selectedTableSurcharge;

    // --- Handlers ---
    const handleRemoveItem = (itemId) => {
        if (!submitting && window.confirm('Xóa món này khỏi giỏ hàng?')) {
            removeItem(itemId); // Gọi hàm từ CartContext
        }
    };

    const handleQuantityChange = (itemId, newQuantity) => {
        if (submitting) return;
        const quantityNum = parseInt(newQuantity); // Cho phép số 0 để kích hoạt confirm xóa
        if (isNaN(quantityNum)) return; // Bỏ qua nếu không phải số

        if (quantityNum >= 1) {
            updateQuantity(itemId, quantityNum);
        } else { // quantityNum <= 0
            if (window.confirm('Số lượng là 0, bạn muốn xóa món này?')) {
                removeItem(itemId);
            }
            // Không làm gì nếu user chọn Cancel, số lượng trên input sẽ tự reset ở lần render sau
        }
    };

    // --- Image Modal Handlers ---
    const handleImageClick = () => {
        setShowImageModal(true);
    };

    const handleCloseImageModal = () => {
        setShowImageModal(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true); setSubmitError(null);

        if (!isAuthenticated) { setSubmitError('Vui lòng đăng nhập.'); setSubmitting(false); navigate('/login?redirect=/booking'); return; }
        if (!numGuests || numGuests < 1) { setSubmitError('Vui lòng nhập số khách.'); setSubmitting(false); return; }
        if (!selectedTime) { setSubmitError('Vui lòng chọn khung giờ.'); setSubmitting(false); return; }
        if (!selectedTableId) { setSubmitError('Vui lòng chọn bàn.'); setSubmitting(false); return; }

        const bookingData = {
            booking_date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
            booking_time: selectedTime,
            num_guests: parseInt(numGuests),
            special_requests: specialRequests.trim() || null,
            payment_method: paymentMethod,
            table_id: parseInt(selectedTableId),
            // Map cartItems lấy id và quantity
            items: cartItems.map(item => ({ menu_item_id: item.id, quantity: item.quantity })),
            promotion_code: promotionCode.trim() || null,
        };

        console.log('Submitting Booking Data:', bookingData);

        try {
            const response = await bookingService.createBooking(bookingData);
            if (response.data?.success) {
                console.log('Booking successful:', response.data);
                const bookingResult = response.data.booking;
                const paymentResult = response.data.payment_info;
                clearCart(); // <<< XÓA GIỎ HÀNG
                navigate('/booking/success',
                    {
                        state: {
                            booking: bookingResult,
                            payment: paymentResult
                        }, replace: true
                    }); // Truyền cả booking và payment_info nếu có
            } else {
                setSubmitError(response.data?.message || 'Đặt bàn thất bại.');
                setSubmitting(false);
            }
        } catch (err) {
            console.error("Lỗi đặt bàn API:", err);
            let errorMessage = 'Đã có lỗi xảy ra.';
            if (err.response?.data) {
                errorMessage = err.response.data.message || errorMessage;
                if (err.response.data.errors) { errorMessage = Object.values(err.response.data.errors).flat().join(' '); }
            } else if (err.request) { errorMessage = 'Không thể kết nối máy chủ.'; }
            else { errorMessage = err.message; }
            setSubmitError(errorMessage);
            setSubmitting(false);
        }
    };

    const filterTablesByGuests = (tables, guests) => {
        if (!tables || !guests || guests < 1) return [];
        let targetCapacity = null;
        if (guests === 1 || guests === 2) targetCapacity = 2;
        else if (guests === 3 || guests === 4) targetCapacity = 4;
        else if (guests === 5 || guests === 6) targetCapacity = 6;
        else if (guests === 7 || guests === 8) targetCapacity = 8;
        else return [];
        return tables.filter(table => table.capacity === targetCapacity);
    };

    // Lọc bàn theo số khách
    const filteredTables = filterTablesByGuests(availableTables, numGuests);

    // ---- Render ----
    return (
        <Container className="page-container">
            <h1 className="mb-4 text-center fw-bold">Đặt Bàn Online</h1>

            {!isAuthenticated && (<Alert variant="info" className="text-center"> Vui lòng <Link to="/login?redirect=/booking" className="alert-link">đăng nhập</Link> hoặc <Link to="/register" className="alert-link">đăng ký</Link> để đặt bàn. </Alert>)}

            <Form onSubmit={handleSubmit}>
                <Row>
                    {/* Cột Trái */}
                    <Col lg={7} md={6} className="mb-4 mb-md-0">
                        {/* Card 1: Thời gian & Số lượng */}
                        <Card className="shadow-sm mb-4">
                            <Card.Header as="h5"><i className="bi bi-clock-fill me-2"></i>1. Chọn Thời Gian & Số Lượng</Card.Header>
                            <Card.Body>
                                <Row className="mb-3 gy-3 align-items-end">
                                    <Col sm={6}>
                                        <Form.Group controlId="bookingDate">
                                            <Form.Label className="fw-semibold">Ngày</Form.Label>
                                            <DatePicker
                                                selected={selectedDate} onChange={(date) => date && setSelectedDate(date)}
                                                dateFormat="dd/MM/yyyy" minDate={new Date()}
                                                className="form-control" locale="vi" required
                                                disabled={submitting || !isAuthenticated} wrapperClassName="d-block"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col sm={6}>
                                        <Form.Group controlId="numGuests">
                                            <Form.Label className="fw-semibold">Số khách</Form.Label>
                                            <Form.Control
                                                type="number" value={numGuests}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '') {
                                                        setNumGuests('');
                                                    } else {
                                                        const numValue = parseInt(value);
                                                        if (!isNaN(numValue) && numValue >= 1) {
                                                            setNumGuests(numValue);
                                                        }
                                                    }
                                                }}
                                                min="1" max="50" required
                                                disabled={submitting || !isAuthenticated}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                {isAuthenticated && loadingSlots && <div className="text-center text-muted small"><Spinner size="sm" /> Đang tìm khung giờ...</div>}
                                {isAuthenticated && slotsError && !loadingSlots && <Alert variant="warning" size="sm" className="mt-2 py-1 px-2">{slotsError}</Alert>}
                                {numGuests > 8 && (
                                    <Alert variant="warning" size="sm" className="mt-2 py-1 px-2">
                                        <div className="small">
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            <strong>Hiện tại nhà hàng chưa có bàn hợp lệ cho số lượng khách của bạn.</strong>
                                            <br />
                                            Vui lòng liên hệ theo hotline: <strong>0354076413</strong> để nhà hàng có thể sắp xếp bàn cho bạn.
                                            <br />
                                            Nhà hàng xin lỗi vì sự bất tiện này.
                                        </div>
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Card 2: Chọn Giờ & Bàn */}
                        <Card className="shadow-sm mb-4">
                            <Card.Header as="h5"><i className="bi bi-calendar-check-fill me-2"></i>2. Chọn Giờ Đến & Bàn</Card.Header>
                            <Card.Body>
                                <Row className="mb-3 gy-3">
                                    <Col md={6}>
                                        <Form.Group controlId="bookingTime">
                                            <Form.Label className="fw-semibold">Giờ đến</Form.Label>
                                            <Form.Select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} required disabled={submitting || !isAuthenticated || loadingSlots || availableSlots.timeSlots.length === 0} isInvalid={isAuthenticated && !selectedTime && !submitting && !loadingSlots && availableSlots.timeSlots.length > 0}>
                                                <option value="">-- Chọn giờ --</option>
                                                {availableSlots.timeSlots.map((time) => <option key={time} value={time}>{time}</option>)}
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">Vui lòng chọn giờ.</Form.Control.Feedback>
                                            {isAuthenticated && !loadingSlots && !slotsError && availableSlots.timeSlots.length === 0 && numGuests > 0 && (<small className="text-danger d-block mt-1">Hết giờ trống.</small>)}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="tableSelection">
                                            <Form.Label className="fw-semibold">Chọn bàn</Form.Label>
                                            {isAuthenticated && loadingTables && selectedTime && <div className='text-muted small mb-1'><Spinner size="sm" /> Tìm bàn...</div>}
                                            {isAuthenticated && tablesError && !loadingTables && selectedTime && <Alert variant="warning" size="sm" className="py-1 px-2">{tablesError}</Alert>}
                                            {/* Bàn Cụ Thể */}
                                            {isAuthenticated && selectedTime && !loadingTables && filteredTables.length > 0 && (
                                                <Form.Select aria-label="Chọn bàn cụ thể" value={selectedTableId} onChange={(e) => { setSelectedTableId(e.target.value); setSubmitError(null); }} className="mb-2" disabled={submitting} required>
                                                    <option value="">-- Chọn bàn --</option>
                                                    {filteredTables.map(table => {
                                                        // Kiểm tra nhiều vị trí có thể chứa surcharge
                                                        const surcharge = table?.tableType?.surcharge || 
                                                                         table?.surcharge || 
                                                                         table?.table_type?.surcharge ||
                                                                         table?.type?.surcharge ||
                                                                         0;
                                                        const tableTypeName = table?.tableType?.name || 
                                                                             table?.table_type?.name ||
                                                                             table?.type?.name ||
                                                                             'Loại bàn';
                                                        const location = table?.location_description || '';
                                                        
                                                        return (
                                                            <option key={table.id} value={table.id}>
                                                                {table.table_number} - {table.capacity} khách - {tableTypeName} {location ? `(${location})` : ''} {surcharge > 0 ? ` (+${parseInt(surcharge).toLocaleString('vi-VN')}đ)` : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </Form.Select>
                                            )}
                                            {isAuthenticated && !loadingSlots && !slotsError && availableSlots.tableTypes.length === 0 && numGuests > 0 && !selectedTableId && (<small className="text-danger d-block mt-1">Không có bàn phù hợp.</small>)}
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                {/* Sơ đồ bàn */}
                                <div className="mt-3 text-center">
                                    <div className="mb-2">
                                        <small className="text-muted fw-semibold">
                                            <i className="bi bi-info-circle me-1"></i>
                                            Sơ đồ bàn
                                        </small>
                                    </div>
                                    <div className="border rounded p-2 bg-light">
                                        <Image 
                                            src="/images/sodoban.png" 
                                            alt="Sơ đồ bàn" 
                                            fluid 
                                            className="img-fluid"
                                            style={{ 
                                                maxHeight: '200px', 
                                                objectFit: 'contain',
                                                cursor: 'pointer',
                                                transition: 'opacity 0.2s'
                                            }}
                                            onError={(e) => {
                                                console.warn("Table layout image failed to load:", e.target.src);
                                                e.target.style.display = 'none';
                                            }}
                                            onClick={handleImageClick}
                                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                                        />
                                    </div>
                                    <small className="text-muted d-block mt-1">
                                        <i className="bi bi-zoom-in me-1"></i>
                                        Click để xem ảnh to hơn
                                    </small>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Card 3: Món ăn đã chọn */}
                        <Card className="shadow-sm mb-4">
                            <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                                <div><i className="bi bi-basket3-fill me-2"></i>3. Món Đã Chọn ({cartItems.reduce((sum, i) => sum + i.quantity, 0)})</div>
                                <Button variant="outline-primary" size="sm" as={Link} to="/menu">
                                    <i className="bi bi-pencil-square me-1"></i> Sửa/Thêm Món
                                </Button>
                            </Card.Header>
                            <Card.Body className={cartItems.length > 0 ? 'p-0' : ''}> {/* Remove padding if list has items */}
                                {cartItems.length === 0 ? (
                                    <div className="text-center text-muted p-3">
                                        <p className="mb-2">Chưa có món nào được chọn.</p>
                                    </div>
                                ) : (
                                    <ListGroup variant="flush" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                        {cartItems.map(item => (
                                            <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center py-2 px-3">
                                                <div className='d-flex align-items-center' style={{ flexBasis: '60%' }}> {/* Giới hạn chiều rộng phần tên */}
                                                    <Image
                                                        src={getImageUrl(item.image_url)}
                                                        onError={handleImageError}
                                                        alt={item.name}
                                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }}
                                                    />
                                                    <div>
                                                        <div className="fw-medium small text-truncate">{item.name}</div> {/* text-truncate */}
                                                        <small className="text-muted d-block d-sm-none">{parseInt(item.price).toLocaleString('vi-VN')} đ</small> {/* Giá đơn vị mobile */}
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center flex-shrink-0 ms-2">
                                                    <Form.Control type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.id, e.target.value)} min="0" max="20" style={{ width: '55px', height: '30px' }} className="text-center form-control-sm me-2" disabled={submitting} />
                                                    <span className="text-muted small me-2 d-none d-sm-inline" style={{ minWidth: '70px', textAlign: 'right' }}>
                                                        {(item.quantity * parseInt(item.price)).toLocaleString('vi-VN')} đ
                                                    </span>
                                                    <Button variant="link-danger" size="sm" onClick={() => handleRemoveItem(item.id)} className="px-1 py-0" title="Xóa món này" disabled={submitting}>
                                                        <i className="bi bi-trash fs-6"></i> {/* Icon lớn hơn */}
                                                    </Button>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Cột Phải */}
                    <Col lg={5} md={6}>
                        {/* Card 4: Thông Tin Bổ Sung */}
                        <Card className="shadow-sm mb-4">
                            <Card.Header as="h5"><i className="bi bi-pencil-square me-2"></i>4. Thông Tin Bổ Sung</Card.Header>
                            <Card.Body>
                                <Form.Group controlId="specialRequests" className="mb-3">
                                    <Form.Label>Yêu cầu đặc biệt</Form.Label>
                                    <Form.Control as="textarea" rows={3} value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} placeholder="Ví dụ: Trang trí sinh nhật..." disabled={submitting} />
                                </Form.Group>
                                <Form.Group controlId="promotionCode">
                                    <Form.Label>Mã khuyến mãi</Form.Label>
                                    <InputGroup>
                                        <Form.Control type="text" value={promotionCode} onChange={(e) => setPromotionCode(e.target.value.toUpperCase())} placeholder="Nhập mã nếu có" disabled={submitting} />
                                        {/* <Button variant="outline-secondary" disabled>Áp dụng</Button> */}
                                    </InputGroup>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Card 5: Thanh Toán */}
                        <Card className="shadow-sm mb-4">
                            <Card.Header as="h5"><i className="bi bi-credit-card-fill me-2"></i>5. Thanh Toán</Card.Header>
                            <Card.Body>
                                <ListGroup variant="flush" className="mb-3">
                                    <ListGroup.Item className="d-flex justify-content-between px-0 py-1">
                                        <span className='small'>Tiền món ăn</span>
                                        <span className='small'>{cartTotalAmount.toLocaleString('vi-VN')} đ</span>
                                    </ListGroup.Item>
                                    <ListGroup.Item className="d-flex justify-content-between px-0 py-1">
                                        <span className='small'>Phụ phí bàn</span>
                                        <span className='small'>{selectedTableSurcharge.toLocaleString('vi-VN')} đ</span>
                                    </ListGroup.Item>
                                    <ListGroup.Item className="d-flex justify-content-between px-0 pt-2 fw-bold fs-5 border-top mt-2">
                                        <span>Tổng cộng (Tạm tính)</span>
                                        <span className="text-danger">{calculatedSubtotal.toLocaleString('vi-VN')} đ</span>
                                    </ListGroup.Item>
                                </ListGroup>

                                <Form.Group controlId="paymentMethod">
                                    <Form.Label className="fw-semibold">Chọn phương thức</Form.Label>
                                    <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required disabled={submitting}>
                                        <option value="pay_later">Thanh toán tại quầy</option>
                                        <option value="vietqr">Thanh toán bằng VietQR</option>
                                    </Form.Select>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Hiển thị lỗi submit cuối cùng */}
                        {submitError && <Alert variant="danger">{submitError}</Alert>}

                        {/* Nút Submit */}
                        <div className="d-grid bg-white p-3 border-top">
                            <Button variant="primary" type="submit" disabled={submitting || !isAuthenticated || !numGuests || numGuests < 1 || !selectedTime || !selectedTableId} size="lg">
                                {submitting ? <><Spinner as="span" animation="border" size="sm" /> Đang xử lý...</> : 'Hoàn Tất Đặt Bàn'}
                            </Button>
                        </div>
                        {!isAuthenticated && <small className="text-danger d-block text-center mt-2">Bạn cần đăng nhập để hoàn tất đặt bàn.</small>}

                    </Col>
                </Row>
            </Form>

            {/* Modal xem ảnh sơ đồ bàn */}
            <Modal show={showImageModal} onHide={handleCloseImageModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-image me-2"></i>
                        Sơ đồ bàn
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-0">
                    <Image 
                        src="/images/sodoban.png" 
                        alt="Sơ đồ bàn" 
                        fluid 
                        className="img-fluid"
                        onError={(e) => {
                            console.warn("Table layout image failed to load in modal:", e.target.src);
                            e.target.style.display = 'none';
                        }}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <small className="text-muted">
                        Tham khảo vị trí bàn trước khi chọn
                    </small>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default BookingPage;