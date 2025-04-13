// src/pages/admin/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, ListGroup, Badge, Button, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // Hook để lấy thông tin admin
// Import các service cần thiết để lấy số liệu thống kê
import { adminDashboardService } from '../../services/admin.dashboard.service'; // <<--- TẠO SERVICE NÀY
import { adminBookingService } from '../../services/admin.booking.service'; // <<--- TẠO SERVICE NÀY (hoặc dùng service đã có)
import { adminReviewService } from '../../services/admin.review.service'; // <<--- TẠO SERVICE NÀY

// --- Component Card Thống Kê Nhanh ---
const StatCard = ({ title, value, icon, variant = 'primary', linkTo, loading }) => (
    <Card className={`shadow-sm border-start border-5 border-${variant} h-100`}>
        <Card.Body>
            <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                    <div className={`text-xs fw-bold text-${variant} text-uppercase mb-1`}>{title}</div>
                    <div className="h5 mb-0 fw-bold text-gray-800">
                        {loading ? <Spinner animation="border" size="sm" /> : (value ?? 'N/A')}
                    </div>
                </Col>  
                <Col xs="auto">
                    <i className={`bi ${icon} fs-2 text-gray-300`}></i>
                </Col>
            </Row>
            {linkTo && ( // Chỉ hiển thị link nếu có prop linkTo
                <Link to={linkTo} className="stretched-link" aria-label={`Xem ${title}`}></Link>
            )}
        </Card.Body>
    </Card>
);

// --- Component Chính ---
function AdminDashboardPage() {
    const { admin } = useAuthAdmin();
    const [stats, setStats] = useState({
        revenue_today: null,
        pending_bookings_count: null,
        expected_guests_today: null,
        pending_reviews_count: null,
        new_users_today_count: null,
        popular_items_today: [],
        booking_status_stats: {},
        hourly_revenue: []
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch dữ liệu thống kê và booking gần đây ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoadingStats(true);
            setLoadingBookings(true);
            setError(null);
            try {
                // Gọi nhiều API song song
                const [statsResponse, bookingsResponse] = await Promise.all([
                    adminDashboardService.getStats(),
                    adminBookingService.getBookings({
                        limit: 5,
                        sort_by: 'created_at',
                        sort_dir: 'desc'
                    })
                ]);

                // Xử lý stats
                if (statsResponse.data?.success) {
                    setStats(statsResponse.data.data);
                } else {
                    console.warn("Could not fetch dashboard stats:", statsResponse.data?.message);
                }

                // Xử lý recent bookings
                if (bookingsResponse.data?.success) {
                    setRecentBookings(bookingsResponse.data.data.data || []);
                } else {
                    console.warn("Could not fetch recent bookings:", bookingsResponse.data?.message);
                }

            } catch (err) {
                console.error("Lỗi tải dữ liệu Dashboard:", err);
                if (err.response?.status !== 401) {
                    setError(err.response?.data?.message || err.message || 'Lỗi kết nối.');
                }
            } finally {
                setLoadingStats(false);
                setLoadingBookings(false);
            }
        };

        fetchDashboardData();
    }, []);

    // --- Hàm format tiền tệ ---
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // --- Hàm format giờ ---
    const formatHour = (hour) => {
        return `${hour.toString().padStart(2, '0')}:00`;
    };

    // --- Hàm lấy Variant Màu và Dịch Status (Copy hoặc import từ utils) ---
    const getStatusVariant = useCallback((status) => { /* ... */ }, []);
    const translateStatus = useCallback((status) => { /* ... */ }, []);

    return (
        <Container fluid className="py-3">
            <h1 className="mb-4">Bảng Điều Khiển</h1>

            {/* Thông báo chào mừng */}
            {admin && <Alert variant="info">Chào mừng trở lại, {admin.name}!</Alert>}

            {/* Hiển thị lỗi chung nếu có */}
            {error && <Alert variant="danger">Lỗi tải dữ liệu: {error}</Alert>}

            {/* Hàng chứa các Card thống kê nhanh */}
            <Row className="gy-3 mb-4">
                <Col xl={3} md={6}>
                    <StatCard
                        title="Đặt bàn chờ xử lý"
                        value={stats.pending_bookings_count}
                        icon="bi-calendar-plus-fill"
                        variant="warning"
                        linkTo="/admin/bookings?status=pending_confirmation"
                        loading={loadingStats}
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatCard
                        title="Đánh giá chờ duyệt"
                        value={stats.pending_reviews_count}
                        icon="bi-chat-left-dots-fill"
                        variant="info"
                        linkTo="/admin/reviews?status=pending"
                        loading={loadingStats}
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatCard
                        title="Doanh thu hôm nay"
                        value={stats.revenue_today !== null ? formatCurrency(stats.revenue_today) : null}
                        icon="bi-cash-coin"
                        variant="success"
                        loading={loadingStats}
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatCard
                        title="Khách dự kiến hôm nay"
                        value={stats.expected_guests_today}
                        icon="bi-people-fill"
                        variant="primary"
                        loading={loadingStats}
                    />
                </Col>
            </Row>

            {/* Hàng thứ hai - Thống kê bổ sung */}
            <Row className="gy-3 mb-4">
                <Col xl={3} md={6}>
                    <StatCard
                        title="User mới hôm nay"
                        value={stats.new_users_today_count}
                        icon="bi-person-plus-fill"
                        variant="secondary"
                        linkTo="/admin/users"
                        loading={loadingStats}
                    />
                </Col>
                <Col xl={9} md={6}>
                    <Card className="shadow-sm h-100">
                        <Card.Header as="h5" className="bg-light border-bottom">
                            <i className="bi bi-graph-up me-2"></i>Doanh Thu Theo Giờ
                        </Card.Header>
                        <Card.Body>
                            {loadingStats ? (
                                <div className="text-center p-3">
                                    <Spinner animation="border" size="sm" />
                                </div>
                            ) : stats.hourly_revenue.length > 0 ? (
                                <div className="d-flex align-items-end" style={{ height: '200px' }}>
                                    {stats.hourly_revenue.map((item, index) => (
                                        <div key={index} className="flex-grow-1 text-center">
                                            <div className="small text-muted mb-1">{formatHour(item.hour)}</div>
                                            <div 
                                                className="bg-primary" 
                                                style={{ 
                                                    height: `${(item.revenue / Math.max(...stats.hourly_revenue.map(h => h.revenue))) * 100}%`,
                                                    minHeight: '20px'
                                                }}
                                            ></div>
                                            <div className="small mt-1">{formatCurrency(item.revenue)}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted my-3">Chưa có doanh thu hôm nay</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Hàng thứ ba - Top món bán chạy và Đơn đặt bàn gần đây */}
            <Row>
                <Col lg={4} className="mb-4 mb-lg-0">
                    <Card className="shadow-sm h-100">
                        <Card.Header as="h5" className="bg-light border-bottom">
                            <i className="bi bi-trophy-fill me-2"></i>Top Món Bán Chạy Hôm Nay
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loadingStats ? (
                                <div className="text-center p-3">
                                    <Spinner animation="border" size="sm" />
                                </div>
                            ) : stats.popular_items_today.length > 0 ? (
                                <ListGroup variant="flush">
                                    {stats.popular_items_today.map((item, index) => (
                                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <span className="badge bg-primary me-2">#{index + 1}</span>
                                                {item.name}
                                            </div>
                                            <Badge bg="secondary" pill>{item.total_quantity}</Badge>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <p className="text-center text-muted my-3">Chưa có dữ liệu bán hàng hôm nay</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={8}>
                    <Card className="shadow-sm">
                        <Card.Header as="h5" className="bg-light border-bottom">
                            <i className="bi bi-clock-history me-2"></i>Đặt Bàn Gần Đây
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loadingBookings ? (
                                <div className="text-center p-3">
                                    <Spinner animation="border" size="sm" />
                                </div>
                            ) : recentBookings.length > 0 ? (
                                <Table responsive hover className="mb-0 small">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Mã ĐB</th>
                                            <th>Khách Hàng</th>
                                            <th>Ngày Giờ</th>
                                            <th className='text-center'>Bàn</th>
                                            <th className='text-center'>Trạng Thái</th>
                                            <th className='text-center'>Xem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentBookings.map(booking => (
                                            <tr key={booking.id}>
                                                <td><code>{booking.booking_code}</code></td>
                                                <td>{booking.user?.name || <span className="text-muted">Khách vãng lai</span>}</td>
                                                <td>
                                                    {new Date(booking.booking_date).toLocaleDateString('vi-VN')}
                                                    <br/>
                                                    <small className="text-muted">{booking.booking_time?.substring(0, 5)}</small>
                                                </td>
                                                <td className='text-center'>{booking.table?.table_number}</td>
                                                <td className='text-center'>
                                                    <Badge bg={getStatusVariant(booking.status)} pill>
                                                        {translateStatus(booking.status)}
                                                    </Badge>
                                                </td>
                                                <td className='text-center'>
                                                    <OverlayTrigger placement="top" overlay={props => renderTooltip(props, "Xem chi tiết")}>
                                                        <Button variant="outline-info" size="sm" as={Link} to={`/admin/bookings/${booking.id}`} className="px-1 py-0">
                                                            <i className="bi bi-eye"></i>
                                                        </Button>
                                                    </OverlayTrigger>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted my-3">Chưa có đơn đặt bàn nào</p>
                            )}
                        </Card.Body>
                        <Card.Footer className="text-center bg-light border-top-0 py-2">
                            <Link to="/admin/bookings" className="small text-decoration-none">
                                Xem tất cả đơn đặt bàn <i className="bi bi-arrow-right-short"></i>
                            </Link>
                        </Card.Footer>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

// Copy hàm getStatusVariant và translateStatus từ MyBookingsPage vào đây hoặc import từ utils
const getStatusVariant = (status) => { /* ... */ return 'secondary'; };
const translateStatus = (status) => { /* ... */ return status; };

export default AdminDashboardPage;

// --- Cần tạo các service sau ---
// src/services/admin.dashboard.service.js
/*
import apiClient from './api';
const getStats = () => apiClient.get('/admin/dashboard/stats'); // API backend cần tạo
export const adminDashboardService = { getStats };
*/

// src/services/admin.booking.service.js
/*
import apiClient from './api';
const getBookings = (params = {}) => apiClient.get('/admin/bookings', { params });
// ... các hàm khác cho admin booking ...
export const adminBookingService = { getBookings, ... };
*/

// src/services/admin.review.service.js
/*
import apiClient from './api';
const getReviews = (params = {}) => apiClient.get('/admin/reviews', { params });
// ... các hàm khác cho admin review ...
export const adminReviewService = { getReviews, ... };
*/

// --- Cần tạo hook ---
// src/hooks/useAuthAdmin.js (Đã có)