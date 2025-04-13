// src/pages/admin/AdminUserListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Table, Spinner, Alert, Pagination, Form, Row, Col, Badge, InputGroup, Tooltip, OverlayTrigger, Modal } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom'; // Thêm Link nếu cần link chi tiết user
import { adminUserService } from '../../services/admin.user.service'; // <<--- TẠO SERVICE NÀY
import { membershipService } from '../../services/membership.service'; // Để lấy danh sách hạng cho bộ lọc
import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // Optional
import { toast } from 'react-hot-toast';

// --- Tooltip Component ---
const renderTooltip = (props, text) => ( <Tooltip {...props}>{text}</Tooltip> );

// --- Modal Đổi Mật Khẩu ---
function ChangePasswordModal({ show, handleClose, userId, userName, onSuccess }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (show) {
            setNewPassword('');
            setConfirmPassword('');
            setError(null);
            setValidationErrors({});
        }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setValidationErrors({});

        // Kiểm tra mật khẩu
        if (newPassword.length < 6) {
            setValidationErrors({ password: ['Mật khẩu phải có ít nhất 6 ký tự'] });
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setValidationErrors({ confirmPassword: ['Mật khẩu xác nhận không khớp'] });
            setLoading(false);
            return;
        }

        try {
            const response = await adminUserService.changeUserPassword(userId, newPassword);
            if (response.data?.success) {
                toast.success(`Đã đổi mật khẩu cho ${userName} thành công!`);
                onSuccess();
                handleClose();
            } else {
                setError(response.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
            }
        } catch (err) {
            console.error('Error changing password:', err);
            if (err.response?.status === 422 && err.response.data?.errors) {
                setValidationErrors(err.response.data.errors);
            } else {
                setError(err.response?.data?.message || err.message || 'Lỗi kết nối.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Đổi Mật Khẩu</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <p>Bạn đang đổi mật khẩu cho người dùng: <strong>{userName}</strong></p>
                    <Form.Group className="mb-3" controlId="newPassword">
                        <Form.Label>Mật khẩu mới</Form.Label>
                        <Form.Control
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            isInvalid={!!validationErrors.password}
                            disabled={loading}
                        />
                        <Form.Control.Feedback type="invalid">
                            {validationErrors.password?.[0]}
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="confirmPassword">
                        <Form.Label>Xác nhận mật khẩu</Form.Label>
                        <Form.Control
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            isInvalid={!!validationErrors.confirmPassword}
                            disabled={loading}
                        />
                        <Form.Control.Feedback type="invalid">
                            {validationErrors.confirmPassword?.[0]}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Đổi mật khẩu'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

// --- Modal Form User ---
function UserFormModal({ show, handleClose, user, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone_number: '',
        points: 0,
        membership_tier_id: '',
        is_active: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [tiers, setTiers] = useState([]);

    // Load membership tiers
    useEffect(() => {
        const fetchTiers = async () => {
            try {
                const response = await membershipService.getMembershipTiers();
                if (response.data?.success) {
                    setTiers(response.data.data || []);
                }
            } catch (err) {
                console.error('Error fetching tiers:', err);
            }
        };
        fetchTiers();
    }, []);

    // Reset form when modal opens/closes or user changes
    useEffect(() => {
        if (show) {
            if (user) {
                // Edit mode
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    password: '', // Don't set password for edit
                    phone_number: user.phone_number || '',
                    points: user.points || 0,
                    membership_tier_id: user.membership_tier_id || '',
                    is_active: user.is_active
                });
            } else {
                // Create mode
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone_number: '',
                    points: 0,
                    membership_tier_id: '',
                    is_active: true
                });
            }
            setError(null);
            setValidationErrors({});
        }
    }, [show, user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setValidationErrors({});

        try {
            let response;
            if (user) {
                // Update existing user
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password; // Don't send empty password
                response = await adminUserService.updateUser(user.id, updateData);
            } else {
                // Create new user
                response = await adminUserService.createUser(formData);
            }

            if (response.data?.success) {
                toast.success(user ? 'Cập nhật người dùng thành công!' : 'Tạo người dùng thành công!');
                onSuccess();
                handleClose();
            } else {
                setError(response.data?.message || 'Có lỗi xảy ra.');
            }
        } catch (err) {
            console.error('Error submitting form:', err);
            if (err.response?.status === 422 && err.response.data?.errors) {
                setValidationErrors(err.response.data.errors);
            } else {
                setError(err.response?.data?.message || err.message || 'Lỗi kết nối.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{user ? 'Sửa Người Dùng' : 'Thêm Người Dùng'}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form.Group className="mb-3" controlId="name">
                        <Form.Label>Họ tên <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            isInvalid={!!validationErrors.name}
                            disabled={loading}
                            required
                        />
                        <Form.Control.Feedback type="invalid">
                            {validationErrors.name?.[0]}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="email">
                        <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            isInvalid={!!validationErrors.email}
                            disabled={loading}
                            required
                        />
                        <Form.Control.Feedback type="invalid">
                            {validationErrors.email?.[0]}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="password">
                        <Form.Label>{user ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'} <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            isInvalid={!!validationErrors.password}
                            disabled={loading}
                            required={!user}
                        />
                        <Form.Control.Feedback type="invalid">
                            {validationErrors.password?.[0]}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="phone_number">
                        <Form.Label>Số điện thoại</Form.Label>
                        <Form.Control
                            type="text"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            isInvalid={!!validationErrors.phone_number}
                            disabled={loading}
                        />
                        <Form.Control.Feedback type="invalid">
                            {validationErrors.phone_number?.[0]}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="points">
                        <Form.Label>Điểm</Form.Label>
                        <Form.Control
                            type="number"
                            name="points"
                            value={formData.points}
                            onChange={handleChange}
                            isInvalid={!!validationErrors.points}
                            disabled={loading}
                            min="0"
                        />
                        <Form.Control.Feedback type="invalid">
                            {validationErrors.points?.[0]}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="membership_tier_id">
                        <Form.Label>Hạng thành viên</Form.Label>
                        <Form.Select
                            name="membership_tier_id"
                            value={formData.membership_tier_id}
                            onChange={handleChange}
                            isInvalid={!!validationErrors.membership_tier_id}
                            disabled={loading}
                        >
                            <option value="">Chọn hạng</option>
                            {tiers.map(tier => (
                                <option key={tier.id} value={tier.id}>{tier.name}</option>
                            ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {validationErrors.membership_tier_id?.[0]}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="is_active">
                        <Form.Check
                            type="switch"
                            name="is_active"
                            label="Tài khoản hoạt động"
                            checked={formData.is_active}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : (user ? 'Cập nhật' : 'Tạo mới')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

// --- Component Trang Chính ---
function AdminUserListPage() {
    // const { isAdminAuthenticated } = useAuthAdmin(); // Kiểm tra quyền
    const [users, setUsers] = useState([]);
    const [tiers, setTiers] = useState([]); // Danh sách các hạng thành viên
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [searchParams, setSearchParams] = useSearchParams();
    const [processingId, setProcessingId] = useState(null); // ID user đang xử lý khóa/mở
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);

    // --- State bộ lọc ---
    const [filterActive, setFilterActive] = useState(searchParams.get('is_active') || '');
    const [filterTier, setFilterTier] = useState(searchParams.get('membership_tier_id') || '');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    const currentPage = parseInt(searchParams.get('page') || '1');

    // --- Hàm Fetch Membership Tiers (chỉ gọi 1 lần) ---
     const fetchAllTiers = useCallback(async () => {
        try {
             const response = await membershipService.getMembershipTiers(); // Dùng service đã tạo
             if (response.data?.success) { setTiers(response.data.data || []); }
             else { console.warn("Could not fetch membership tiers for filter"); }
        } catch (err) { console.error("Error fetching all tiers:", err); }
     }, []);

     useEffect(() => { fetchAllTiers(); }, [fetchAllTiers]);


    // --- Hàm Fetch Users ---
    const fetchUsers = useCallback(async (page, filters) => {
        setLoading(true); setError(null);
        try {
            const params = {
                page,
                search: filters.search || undefined,
                is_active: filters.active === '' ? undefined : (filters.active === '1' ? 1 : 0), // Gửi 1 hoặc 0
                membership_tier_id: filters.tier || undefined,
                sort_by: 'id', // Sắp xếp theo ID
                sort_dir: 'asc', // Từ bé đến lớn
                per_page: 15,
            };
             Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await adminUserService.getUsers(params); // Gọi service
            if (response.data?.success) {
                // Sắp xếp lại dữ liệu theo ID từ bé đến lớn nếu API không sắp xếp
                const sortedUsers = [...(response.data.data.data || [])].sort((a, b) => a.id - b.id);
                setUsers(sortedUsers);
                setPagination({ /* ... lưu phân trang ... */ });
            } else { setError(response.data?.message || 'Lỗi tải danh sách người dùng.'); setUsers([]); setPagination({ current_page: 1, last_page: 1, total: 0 }); }
        } catch (err) {
            if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); }
            setUsers([]); setPagination({ current_page: 1, last_page: 1, total: 0 });
        } finally { setLoading(false); }
    }, []); // Dependency rỗng

    // --- useEffect gọi fetch khi trang hoặc filter thay đổi ---
    useEffect(() => {
        const currentSearch = searchParams.get('search') || '';
        const currentActive = searchParams.get('is_active') || '';
        const currentTier = searchParams.get('membership_tier_id') || '';

        setSearchTerm(currentSearch);
        setFilterActive(currentActive);
        setFilterTier(currentTier);

        fetchUsers(currentPage, { search: currentSearch, active: currentActive, tier: currentTier });
    }, [searchParams, fetchUsers, currentPage]);


    // --- Handler Khóa/Mở Khóa User ---
    const handleToggleActive = async (user) => {
        if (!user || processingId === user.id) return;
        const action = user.is_active ? 'Khóa' : 'Kích hoạt';
        if (window.confirm(`Bạn có chắc muốn ${action} tài khoản "${user.name}" (${user.email})?`)) {
            setProcessingId(user.id);
            setError(null);
            try {
                const response = await adminUserService.toggleUserActive(user.id);
                if (response.data?.success) {
                    toast.success(`Đã ${action} tài khoản thành công!`);
                    // Cập nhật lại user trong state với dữ liệu đầy đủ từ response
                    setUsers(prev => prev.map(u => {
                        if (u.id === user.id) {
                            // Giữ lại thông tin cũ và cập nhật với dữ liệu mới
                            return {
                                ...u,
                                ...response.data.data,
                                is_active: response.data.data.is_active
                            };
                        }
                        return u;
                    }));
                } else {
                    setError(response.data?.message || `Lỗi ${action} tài khoản.`);
                }
            } catch (err) {
                toast.error(`Lỗi ${action}: ${err.response?.data?.message || err.message}`);
                setError(`Lỗi ${action}: ${err.response?.data?.message || err.message}`);
            } finally {
                setProcessingId(null);
            }
        }
    };

    // --- Handlers Tìm kiếm & Lọc ---
     const handleSearchChange = (e) => setSearchTerm(e.target.value);
     const handleFilterChange = (e) => { // Dùng chung
         const { name, value } = e.target;
         if (name === 'is_active') setFilterActive(value);
         if (name === 'membership_tier_id') setFilterTier(value);
     };
     const applyFilters = () => {
         const newSearchParams = new URLSearchParams();
         if (searchTerm.trim()) newSearchParams.set('search', searchTerm.trim());
         if (filterActive !== '') newSearchParams.set('is_active', filterActive);
         if (filterTier) newSearchParams.set('membership_tier_id', filterTier);
         newSearchParams.set('page', '1');
         setSearchParams(newSearchParams);
     };
      const clearFilters = () => {
         setSearchTerm(''); setFilterActive(''); setFilterTier('');
         setSearchParams({ page: '1' });
     };


    // --- Handler Phân Trang ---
    const handlePageChange = (pageNumber) => { /* ... (Giữ nguyên logic) ... */ };
    // --- Render Phân Trang ---
    const renderPagination = () => { /* ... (Copy từ trang trước) ... */ };

    // --- Handler Đổi Mật Khẩu ---
    const handleShowPasswordModal = (user) => {
        setSelectedUser(user);
        setShowPasswordModal(true);
    };

    const handleClosePasswordModal = () => {
        setShowPasswordModal(false);
        setSelectedUser(null);
    };

    const handlePasswordChangeSuccess = () => {
        // Có thể refresh lại danh sách nếu cần
    };

    // --- Handler Xóa User ---
    const handleDeleteUser = async (user) => {
        if (!user || deletingId === user.id) return;
        
        if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.name}" (${user.email})? Hành động này không thể hoàn tác.`)) {
            setDeletingId(user.id);
            setError(null);
            
            try {
                const response = await adminUserService.deleteUser(user.id);
                if (response.data?.success) {
                    toast.success('Xóa người dùng thành công!');
                    // Cập nhật lại danh sách
                    fetchUsers(currentPage, { search: searchTerm, active: filterActive, tier: filterTier });
                } else {
                    setError(response.data?.message || 'Có lỗi xảy ra khi xóa người dùng.');
                }
            } catch (err) {
                console.error('Error deleting user:', err);
                toast.error(err.response?.data?.message || err.message || 'Lỗi kết nối.');
                setError(err.response?.data?.message || err.message || 'Lỗi kết nối.');
            } finally {
                setDeletingId(null);
            }
        }
    };

    // --- Handler Thêm/Sửa User ---
    const handleShowUserModal = (user = null) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const handleCloseUserModal = () => {
        setShowUserModal(false);
        setSelectedUser(null);
    };

    const handleUserSuccess = () => {
        fetchUsers(currentPage, { search: searchTerm, active: filterActive, tier: filterTier });
    };

    // ---- Render ----
    return (
        <Container fluid className="py-3">
            <Card className="shadow-sm">
                <Card.Header as="h5" className="bg-dark text-white d-flex justify-content-between align-items-center"> {/* Đổi màu header */}
                    Quản Lý Người Dùng (Khách Hàng)
                    <Button variant="light" size="sm" onClick={() => handleShowUserModal()}>
                        <i className="bi bi-person-plus-fill me-1"></i> Thêm User
                    </Button>
                </Card.Header>
                <Card.Body>
                    {/* --- Bộ lọc --- */}
                    <Form className="mb-3 p-3 bg-light border rounded">
                        <Row className="g-2 align-items-end">
                            <Col md={4} xl={4}>
                                <Form.Group controlId="searchUser">
                                     <Form.Label className='small mb-1 fw-semibold'>Tìm kiếm</Form.Label>
                                     <InputGroup size="sm">
                                        <Form.Control type="text" placeholder="Tên, email, SĐT..." value={searchTerm} onChange={handleSearchChange}/>
                                        {searchTerm && <Button variant="outline-secondary" onClick={clearFilters} title="Xóa"><i className="bi bi-x-lg"></i></Button>}
                                     </InputGroup>
                                </Form.Group>
                            </Col>
                             <Col md={3} xl={2}>
                                <Form.Group controlId="filterActive">
                                    <Form.Label className='small mb-1 fw-semibold'>Trạng thái</Form.Label>
                                    <Form.Select size="sm" name="is_active" value={filterActive} onChange={handleFilterChange} disabled={loading}>
                                        <option value="">Tất cả</option>
                                        <option value="1">Đang hoạt động</option>
                                        <option value="0">Đã khóa</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3} xl={3}>
                                <Form.Group controlId="filterTier">
                                    <Form.Label className='small mb-1 fw-semibold'>Hạng thành viên</Form.Label>
                                    <Form.Select size="sm" name="membership_tier_id" value={filterTier} onChange={handleFilterChange} disabled={loading || tiers.length === 0}>
                                        <option value="">Tất cả hạng</option>
                                        {tiers.map(tier => <option key={tier.id} value={tier.id}>{tier.name}</option>)}
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
                    {loading && <div className="text-center my-5"><Spinner animation="border" variant="dark"/></div>}
                    {error && !loading && <Alert variant="danger">Lỗi: {error}</Alert>}
                    {!loading && !error && users.length === 0 && ( <Alert variant="light" className='text-center border'>Không tìm thấy người dùng nào.</Alert> )}
                    {!loading && !error && users.length > 0 && (
                        <>
                            <Table responsive striped bordered hover size="sm" className="align-middle">
                                <thead className='table-light'>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên</th>
                                        <th>Email</th>
                                        <th>SĐT</th>
                                        <th className='text-center'>Hạng</th>
                                        <th className='text-end'>Điểm</th>
                                        <th className='text-center'>Trạng thái</th>
                                        <th>Ngày ĐK</th>
                                        <th className='text-center' style={{ width: '80px' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => {
                                        const isProcessing = processingId === user.id;
                                        return (
                                            <tr key={user.id}>
                                                <td>{user.id}</td>
                                                <td className="fw-medium">{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>{user.phone_number || '-'}</td>
                                                <td className='text-center'>
                                                    <Badge bg={user.membership_tier?.name === 'Kim Cương' ? 'dark' : (user.membership_tier?.name === 'Vàng' ? 'warning' : (user.membership_tier?.name === 'Bạc' ? 'secondary' : 'info'))} pill>
                                                        {user.membership_tier?.name || 'Đồng'}
                                                    </Badge>
                                                </td>
                                                <td className='text-end'>{user.points || 0}</td>
                                                <td className='text-center'>
                                                    <Badge bg={user.is_active ? 'success' : 'danger'} pill>
                                                        {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                                                    </Badge>
                                                </td>
                                                <td className='small text-muted'>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                                                <td className='text-center'>
                                                     {/* Nút Chi tiết (Optional) */}
                                                     {/* <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Xem chi tiết")}>
                                                         <Button variant="outline-info" size="sm" as={Link} to={`/admin/users/${user.id}`} className="me-1 px-1 py-0"> <i className="bi bi-eye-fill"></i> </Button>
                                                     </OverlayTrigger> */}
                                                      {/* Nút Khóa/Mở khóa */}
                                                      <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, user.is_active ? "Khóa tài khoản" : "Kích hoạt tài khoản")}>
                                                        <Button
                                                            variant={user.is_active ? "outline-danger" : "outline-success"}
                                                            size="sm"
                                                            onClick={() => handleToggleActive(user)}
                                                            className="px-1 py-0 me-1"
                                                            disabled={isProcessing}
                                                        >
                                                            {isProcessing ? <Spinner size="sm" animation="border"/> : (user.is_active ? <i className="bi bi-lock-fill"></i> : <i className="bi bi-unlock-fill"></i>)}
                                                        </Button>
                                                     </OverlayTrigger>
                                                     {/* Nút Đổi mật khẩu */}
                                                     <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Đổi mật khẩu")}>
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            onClick={() => handleShowPasswordModal(user)}
                                                            className="px-1 py-0 me-1"
                                                        >
                                                            <i className="bi bi-key-fill"></i>
                                                        </Button>
                                                     </OverlayTrigger>
                                                     {/* Nút Xóa */}
                                                     <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Xóa người dùng")}>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="px-1 py-0"
                                                            disabled={deletingId === user.id}
                                                        >
                                                            {deletingId === user.id ? <Spinner size="sm" animation="border"/> : <i className="bi bi-trash-fill"></i>}
                                                        </Button>
                                                     </OverlayTrigger>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                            {/* Phân trang */}
                            {renderPagination()}
                         </>
                    )}
                </Card.Body>
            </Card>

             {/* TODO: Modal xem chi tiết user nếu cần */}
             {/* <UserDetailModal show={showDetail} handleClose={handleCloseDetail} userId={selectedUserId} /> */}

            {/* Modal đổi mật khẩu */}
            {selectedUser && (
                <ChangePasswordModal
                    show={showPasswordModal}
                    handleClose={handleClosePasswordModal}
                    userId={selectedUser.id}
                    userName={selectedUser.name}
                    onSuccess={handlePasswordChangeSuccess}
                />
            )}

            {/* Modal thêm/sửa user */}
            <UserFormModal
                show={showUserModal}
                handleClose={handleCloseUserModal}
                user={selectedUser}
                onSuccess={handleUserSuccess}
            />
        </Container>
    );
}

export default AdminUserListPage;

// --- Cần tạo service ---
// src/services/admin.user.service.js
/*
import apiClient from './api';
const getUsers = (params = {}) => apiClient.get('/admin/users', { params });
const getUserDetail = (id) => apiClient.get(`/admin/users/${id}`);
const toggleUserActive = (id) => apiClient.patch(`/admin/users/${id}/toggle-active`);
export const adminUserService = { getUsers, getUserDetail, toggleUserActive };
*/