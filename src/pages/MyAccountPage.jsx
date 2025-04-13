// src/pages/MyAccountPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Row, Col, Card, ListGroup, Button, Spinner, Alert, ProgressBar, Badge, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Hook xác thực (lấy user ban đầu, logout)
import { authService } from '../services/auth.service'; // Service gọi API /user
import { membershipService } from '../services/membership.service'; // Service gọi API /membership-tiers
import EditProfileModal from '../components/account/EditProfileModal.jsx';
import ChangePasswordModal from '../components/account/ChangePasswordModal.jsx';
// --- Component Modal Hiển Thị Quyền Lợi Hạng Thành Viên ---
// (Tách ra file riêng nếu muốn: src/components/account/MembershipTiersModal.jsx)
function MembershipTiersModal({ show, handleClose, tiers = [], currentUserTierId }) {
    const getTierVariant = (tierId, currentId) => {
        if (tierId === currentId) return 'primary';
        // Thêm màu sắc/logic khác nếu cần phân biệt các hạng khác nhau
        return 'light'; // Mặc định màu sáng
    };
    const getTierText = (tierId, currentId) => {
         if (tierId === currentId) return 'dark'; // Chữ tối trên nền sáng primary
         return 'dark'; // Chữ tối trên nền sáng light
    }

    return (
        <Modal show={show} onHide={handleClose} centered size="lg" scrollable>
            <Modal.Header closeButton>
                <Modal.Title><i className="bi bi-gem me-2"></i>Các Hạng Thành Viên & Quyền Lợi</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {tiers.length > 0 ? (
                    <ListGroup variant="flush">
                        {tiers.map((tier) => (
                            <ListGroup.Item
                                key={tier.id}
                                // Highlight hạng hiện tại rõ ràng hơn
                                className={`mb-2 p-3 border rounded ${tier.id === currentUserTierId ? 'border-2 border-primary shadow-sm' : 'border-light'}`}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap">
                                    <h5 className="mb-0 me-2">
                                        {/* Icon có thể thay đổi theo hạng */}
                                        {tier.name === 'Kim Cương' ? <i className="bi bi-gem me-1 text-info"></i> :
                                         tier.name === 'Vàng' ? <i className="bi bi-star-fill me-1 text-warning"></i> :
                                         tier.name === 'Bạc' ? <i className="bi bi-shield-fill me-1 text-secondary"></i> :
                                         <i className="bi bi-check-circle me-1 text-success"></i>}
                                        <Badge bg={getTierVariant(tier.id, currentUserTierId)} text={getTierText(tier.id, currentUserTierId)} pill className='me-2 align-middle fs-6'>{tier.name}</Badge> {/* Tăng cỡ chữ Badge */}
                                        <span className="align-middle small text-muted">(từ {tier.min_points?.toLocaleString('vi-VN') || 0} điểm)</span>
                                    </h5>
                                    {tier.discount_percentage > 0 && (
                                         <Badge bg="success" pill><i className="bi bi-tags-fill me-1"></i>Giảm {parseFloat(tier.discount_percentage)}%</Badge>
                                    )}
                                </div>
                                <small className="text-muted d-block">{tier.description || 'Thông tin quyền lợi đang được cập nhật.'}</small>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                ) : (
                    <p className='text-muted text-center'>Chưa có thông tin về các hạng thành viên.</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Đóng
                </Button>
            </Modal.Footer>
        </Modal>
    );
}


// --- Component Chính Của Trang ---
function MyAccountPage() {
    const { user: authUser, isAuthenticated, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);
    const [allTiers, setAllTiers] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);

    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showTiersModal, setShowTiersModal] = useState(false);

    // --- Hàm Fetch dữ liệu ---
    const fetchData = useCallback(async () => {
        if (!isAuthenticated) { setLoadingData(false); return; }
        console.log("MyAccountPage: Fetching data...");
        setLoadingData(true); setError(null);
        try {
            const [userResponse, tiersResponse] = await Promise.all([
                authService.getUser(),
                membershipService.getMembershipTiers()
            ]);

            if (userResponse.data) {
                console.log("Fetched User Data:", userResponse.data);
                setCurrentUser(userResponse.data);
                localStorage.setItem('userData', JSON.stringify(userResponse.data));
            } else { throw new Error("Không thể lấy thông tin người dùng."); }

            if (tiersResponse.data?.success) {
                 const fetchedTiers = Array.isArray(tiersResponse.data.data) ? tiersResponse.data.data : [];
                 const sortedTiers = [...fetchedTiers].sort((a, b) => (a.min_points || 0) - (b.min_points || 0));
                 console.log("Fetched and Sorted Tiers:", sortedTiers);
                 setAllTiers(sortedTiers);
            } else { console.warn("Could not fetch membership tiers."); setAllTiers([]); }

        } catch (err) {
            console.error("Lỗi tải dữ liệu trang tài khoản:", err);
            if (err.response?.status === 401) { logout(); navigate('/login?message=session_expired'); }
            else if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); }
            setCurrentUser(null); setAllTiers([]);
        } finally { setLoadingData(false); }
    }, [isAuthenticated, logout, navigate]);

    // --- useEffect gọi fetchData ---
    useEffect(() => {
        if (!authLoading && isAuthenticated) { fetchData(); }
        else if (!authLoading && !isAuthenticated) { setLoadingData(false); }
    }, [isAuthenticated, authLoading, fetchData]);


    // --- Tính toán thông tin hạng tiếp theo ---
    const nextTierInfo = useMemo(() => {
        if (!currentUser || !Array.isArray(allTiers) || allTiers.length === 0) {
            return { nextTier: null, pointsNeeded: 0, progress: 0, currentTier: null };
        }

        // Sắp xếp các hạng theo điểm tối thiểu
        const sortedTiers = [...allTiers].sort((a, b) => (a.min_points || 0) - (b.min_points || 0));
        
        // Lấy hạng hiện tại của user dựa trên điểm
        const userPoints = currentUser.points || 0;
        const currentTier = sortedTiers.reduce((prev, curr) => {
            if ((curr.min_points || 0) <= userPoints) {
                return curr;
            }
            return prev;
        }, sortedTiers[0]);

        // Tìm hạng tiếp theo
        const nextTier = sortedTiers.find(tier => 
            (tier.min_points || 0) > userPoints
        );

        if (!nextTier) {
            // Nếu không tìm thấy hạng tiếp theo, nghĩa là đã ở hạng cao nhất
            return { 
                nextTier: null, 
                pointsNeeded: 0, 
                progress: 100,
                currentTier: currentTier
            };
        }

        const pointsNeeded = nextTier.min_points - userPoints;
        const currentTierPoints = currentTier.min_points || 0;
        const pointsRange = nextTier.min_points - currentTierPoints;
        const pointsEarnedInRange = userPoints - currentTierPoints;
        const progress = Math.min(100, Math.round((pointsEarnedInRange / pointsRange) * 100));

        return { 
            nextTier: nextTier, 
            pointsNeeded: pointsNeeded, 
            progress: progress,
            currentTier: currentTier
        };
    }, [currentUser, allTiers]);


    // --- Render Loading / Error / Not Authenticated ---
    if (authLoading || (isAuthenticated && loadingData)) {
        return <Container className="page-container text-center d-flex justify-content-center align-items-center"><Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} /></Container>;
    }
    if (!isAuthenticated) {
         return <Container className="page-container"><Alert variant="warning" className="text-center">Vui lòng <Link to="/login?redirect=/my-account" className="alert-link">đăng nhập</Link> để xem thông tin.</Alert></Container>;
    }
    if (error) {
         return <Container className="page-container"><Alert variant="danger">Lỗi tải thông tin: {error}</Alert></Container>;
    }
     if (!currentUser) {
         return <Container className="page-container"><Alert variant="warning">Không thể tải dữ liệu người dùng.</Alert></Container>;
     }

    // ---- Render Nội dung chính ----
    // Xác định màu Badge dựa trên tên hạng hiện tại (sử dụng optional chaining)
     const getCurrentTierBadgeVariant = () => {
         const tierName = currentUser?.membershipTier?.name;
         switch (tierName) {
             case 'Kim Cương': return 'dark';
             case 'Vàng': return 'warning';
             case 'Bạc': return 'secondary'; // <<-- Màu cho Bạc
             default: return 'info'; // Đồng hoặc chưa có
         }
     };
     
     // Callback được gọi khi cập nhật profile thành công từ modal
     const handleProfileUpdateSuccess = (updatedUser) => {
        setCurrentUser(updatedUser); // Cập nhật state cục bộ ngay lập tức
         // Không cần gọi fetchData lại vì AuthContext cũng đã được cập nhật
         // và user data mới nhất đã được trả về
    };

    return (
        <Container className="page-container">
             <h1 className="mb-4">Tài Khoản Của Tôi</h1>
             <Row className="gy-4">
                {/* --- Cột Thông Tin Cá Nhân --- */}
                <Col lg={4} md={6}>
                    <Card className="h-100 shadow-sm">
                        <Card.Header as="h5"><i className="bi bi-person-vcard-fill me-2 text-primary"></i>Thông Tin Cá Nhân</Card.Header>
                        <ListGroup variant="flush">
                            <ListGroup.Item><span className='fw-medium'>Tên:</span> {currentUser.name}</ListGroup.Item>
                            <ListGroup.Item><span className='fw-medium'>Email:</span> {currentUser.email}</ListGroup.Item>
                            <ListGroup.Item><span className='fw-medium'>Điện thoại:</span> {currentUser.phone_number || <span className="text-muted fst-italic">Chưa cập nhật</span>}</ListGroup.Item>
                            <ListGroup.Item className="text-end bg-light">
                                 <Button variant="outline-primary" size="sm" onClick={() => setShowEditProfileModal(true)}>
                                    <i className="bi bi-pencil-fill me-1"></i> Chỉnh sửa
                                </Button>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card>
                </Col>

                 {/* --- Cột Thành Viên & Điểm Thưởng --- */}
                <Col lg={4} md={6}>
                     <Card className="h-100 shadow-sm">
                        <Card.Header as="h5"><i className="bi bi-award-fill me-2 text-warning"></i>Thành Viên & Điểm</Card.Header>
                         <ListGroup variant="flush">
                            <ListGroup.Item>
                                <span className='fw-medium'>Hạng hiện tại:</span> {' '}
                                <Badge bg={getCurrentTierBadgeVariant()} pill>
                                    {nextTierInfo.currentTier?.name || 'Chưa có hạng'}
                                </Badge>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <span className='fw-medium'>Điểm tích lũy:</span> {' '}
                                <span className='fw-bold text-success'>{currentUser.points?.toLocaleString('vi-VN') || 0} điểm</span>
                            </ListGroup.Item>
                            {/* Thông tin lên hạng */}
                             <ListGroup.Item style={{minHeight: '80px'}}>
                                {nextTierInfo.nextTier ? (
                                     <>
                                         <small className="d-block text-muted mb-1">
                                             Cần thêm <strong className='text-primary'>{nextTierInfo.pointsNeeded.toLocaleString('vi-VN')}</strong> điểm để lên hạng <strong className='text-primary'>{nextTierInfo.nextTier.name}</strong> ({nextTierInfo.nextTier.min_points.toLocaleString('vi-VN')}+ điểm).
                                         </small>
                                         <ProgressBar
                                             now={nextTierInfo.progress} label={`${nextTierInfo.progress}%`}
                                             variant="success" animated striped style={{height: '12px'}}
                                             title={`Đã đạt ${nextTierInfo.progress}% lên hạng ${nextTierInfo.nextTier.name}`}
                                         />
                                     </>
                                ) : (
                                     <div className="d-flex align-items-center justify-content-center text-info fw-semibold pt-2">
                                         <i className="bi bi-gem fs-5 me-2"></i> <span>Bạn đang ở hạng cao nhất!</span>
                                     </div>
                                )}
                            </ListGroup.Item>
                            {/* Link xem quyền lợi */}
                             <ListGroup.Item className="text-end bg-light">
                                 <Button variant="link" size="sm" className="p-0 text-decoration-none fw-medium" onClick={() => setShowTiersModal(true)}>
                                     Xem quyền lợi các hạng <i className="bi bi-chevron-double-right small"></i>
                                 </Button>
                            </ListGroup.Item>
                         </ListGroup>
                    </Card>
                </Col>

                 {/* --- Cột Quản Lý Khác --- */}
                 <Col lg={4} md={12}>
                     <Card className="h-100 shadow-sm">
                        <Card.Header as="h5"><i className="bi bi-gear-wide-connected me-2 text-secondary"></i>Quản Lý Khác</Card.Header>
                         <ListGroup variant="flush">
                            <ListGroup.Item action as={Link} to="/my-bookings" className="d-flex justify-content-between align-items-center"> <span><i className="bi bi-calendar-check me-2"></i>Lịch sử đặt bàn</span> <i className="bi bi-chevron-right small text-muted"></i> </ListGroup.Item>
                            <ListGroup.Item action as={Link} to="/my-favorites" className="d-flex justify-content-between align-items-center"> <span><i className="bi bi-heart me-2"></i>Món ăn yêu thích</span> <i className="bi bi-chevron-right small text-muted"></i> </ListGroup.Item>
                            <ListGroup.Item action onClick={() => setShowChangePasswordModal(true)} style={{cursor: 'pointer'}} className="d-flex justify-content-between align-items-center"> <span><i className="bi bi-key-fill me-2"></i>Đổi mật khẩu</span> <i className="bi bi-chevron-right small text-muted"></i> </ListGroup.Item>
                         </ListGroup>
                    </Card>
                </Col>
             </Row>

            {/* --- Render Modals --- */}
             <MembershipTiersModal
                 show={showTiersModal}
                 handleClose={() => setShowTiersModal(false)}
                 tiers={allTiers} // Truyền danh sách tất cả các hạng
                 currentUserTierId={currentUser?.membershipTier?.id} // Truyền ID hạng hiện tại (có thể null)
             />

             {/* --- Render Modal Chỉnh Sửa --- */}
             <EditProfileModal
                 show={showEditProfileModal}
                 handleClose={() => setShowEditProfileModal(false)}
                 currentUser={currentUser} // Truyền user hiện tại vào modal
                 onUpdateSuccess={handleProfileUpdateSuccess} // Truyền callback
             />

             {/* --- Render Modal Đổi Mật Khẩu --- */}
             <ChangePasswordModal
                 show={showChangePasswordModal}
                 handleClose={() => setShowChangePasswordModal(false)}
             />

        </Container>
    );
}

export default MyAccountPage;