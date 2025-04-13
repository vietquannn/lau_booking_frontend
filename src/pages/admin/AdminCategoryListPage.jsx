// src/pages/admin/AdminCategoryListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Table, Spinner, Alert, Modal, Form, InputGroup, Pagination, Tooltip, OverlayTrigger, Row, Col } from 'react-bootstrap';
import { adminCategoryService } from '../../services/admin.category.service'; // Service để gọi API Category Admin
import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // Hook để kiểm tra admin đăng nhập (nếu cần)
import { useSearchParams } from 'react-router-dom';


// Component Tooltip (tái sử dụng)
const renderTooltip = (props, text) => ( <Tooltip {...props}>{text}</Tooltip> );

// --- Modal Thêm/Sửa Category ---
function CategoryFormModal({ show, handleClose, currentCategory, onSaveSuccess }) {
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const isEditing = !!currentCategory; // Xác định là đang sửa hay thêm mới

    useEffect(() => {
        if (isEditing && currentCategory) {
            setFormData({
                name: currentCategory.name || '',
                description: currentCategory.description || '',
            });
        } else {
            // Reset form khi mở để thêm mới
            setFormData({ name: '', description: '' });
        }
        // Reset lỗi khi modal mở hoặc category thay đổi
        setError(null);
        setValidationErrors({});
    }, [currentCategory, isEditing, show]); // Chạy lại khi các giá trị này thay đổi

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
         // Xóa lỗi validation của trường đang nhập
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
        setError(null); // Xóa lỗi chung
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null); setValidationErrors({});

        try {
            let response;
            if (isEditing) {
                // Gọi API Update
                response = await adminCategoryService.updateCategory(currentCategory.slug || currentCategory.id, formData); // Ưu tiên slug nếu có
            } else {
                // Gọi API Create
                response = await adminCategoryService.createCategory(formData);
            }

            if (response.data?.success) {
                alert(isEditing ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!');
                onSaveSuccess(); // Gọi callback để load lại danh sách ở trang cha
                handleClose(); // Đóng modal
            } else {
                setError(response.data?.message || 'Có lỗi xảy ra.');
            }
        } catch (err) {
             console.error("Category form error:", err);
             let errorMessage = 'Đã có lỗi xảy ra.';
             if (err.response) {
                 errorMessage = err.response.data?.message || errorMessage;
                 if (err.response.status === 422 && err.response.data?.errors) {
                      setValidationErrors(err.response.data.errors);
                      errorMessage = "Dữ liệu không hợp lệ.";
                 }
             } else { errorMessage = err.message || 'Lỗi mạng.'; }
             setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{isEditing ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit} noValidate>
                <Modal.Body>
                    {error && <Alert variant="danger" size="sm">{error}</Alert>}
                    <Form.Group className="mb-3" controlId="categoryName">
                        <Form.Label>Tên Danh Mục <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text" name="name" value={formData.name} onChange={handleChange}
                            required disabled={loading} isInvalid={!!validationErrors.name}
                            placeholder="Ví dụ: Lẩu Hải Sản Chua Cay"
                         />
                        <Form.Control.Feedback type="invalid">{validationErrors.name?.[0]}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="categoryDescription">
                        <Form.Label>Mô tả (Tùy chọn)</Form.Label>
                        <Form.Control
                            as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange}
                            disabled={loading} isInvalid={!!validationErrors.description}
                            placeholder="Mô tả ngắn về danh mục này..."
                        />
                         <Form.Control.Feedback type="invalid">{validationErrors.description?.[0]}</Form.Control.Feedback>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>Hủy</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : (isEditing ? 'Lưu Thay Đổi' : 'Thêm Danh Mục')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}


// --- Component Trang Chính ---
function AdminCategoryListPage() {
    // const { isAdminAuthenticated } = useAuthAdmin(); // Kiểm tra quyền nếu cần phân quyền chi tiết hơn
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    // State cho Modal
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null); // null: thêm mới, object: sửa

    // Lấy trang và từ khóa tìm kiếm từ URL
    const currentPage = parseInt(searchParams.get('page') || '1');
    const currentSearch = searchParams.get('search') || '';

    // --- Hàm Fetch Categories ---
    const fetchCategories = useCallback(async (page, search) => {
        setLoading(true); setError(null);
        try {
            const params = { page, search: search || undefined , per_page: 10 }; // Gửi per_page nếu muốn
            const response = await adminCategoryService.getCategories(params); // Gọi service
            if (response.data?.success) {
                setCategories(response.data.data.data || []);
                setPagination({ // Cập nhật phân trang
                    current_page: response.data.data.current_page,
                    last_page: response.data.data.last_page,
                    total: response.data.data.total,
                 });
            } else {
                 setError(response.data?.message || 'Lỗi tải danh mục.');
                 setCategories([]); setPagination({ current_page: 1, last_page: 1, total: 0 });
            }
        } catch (err) {
            console.error("Lỗi tải danh mục admin:", err);
            if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); }
            setCategories([]); setPagination({ current_page: 1, last_page: 1, total: 0 });
        } finally { setLoading(false); }
    }, []);

    // --- useEffect gọi fetch khi trang hoặc tìm kiếm thay đổi ---
    useEffect(() => {
        fetchCategories(currentPage, currentSearch);
    }, [currentPage, currentSearch, fetchCategories]);

    // --- Handlers cho Modal ---
    const handleShowAddModal = () => {
        setEditingCategory(null); // Đặt là null để biết là thêm mới
        setShowModal(true);
    };
    const handleShowEditModal = (category) => {
        setEditingCategory(category); // Truyền category cần sửa vào
        setShowModal(true);
    };
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null); // Reset khi đóng
    };
    const handleSaveSuccess = () => {
        fetchCategories(currentPage, currentSearch); // Load lại danh sách sau khi lưu thành công
    };

    // --- Handler cho việc xóa ---
    const handleDelete = async (category) => {
        if (!category) return;
        const categoryIdentifier = category.slug || category.id; // Ưu tiên slug
        if (window.confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"? \nLƯU Ý: Các món ăn thuộc danh mục này cũng có thể bị xóa (tùy cấu hình)!`)) {
            setLoading(true); // Có thể thêm loading riêng cho việc xóa
            setError(null);
            try {
                await adminCategoryService.deleteCategory(categoryIdentifier);
                alert('Xóa danh mục thành công!');
                // Load lại trang hiện tại hoặc trang đầu nếu trang hiện tại hết dữ liệu
                if(categories.length === 1 && currentPage > 1){
                     handlePageChange(currentPage - 1);
                } else {
                     fetchCategories(currentPage, currentSearch);
                }
            } catch (err) {
                 console.error("Lỗi xóa category:", err);
                 alert(`Lỗi xóa: ${err.response?.data?.message || err.message}`);
                 setLoading(false); // Dừng loading nếu lỗi
            }
            // setLoading sẽ tự tắt nếu fetchCategories được gọi lại
        }
    };

    // --- Handler cho tìm kiếm ---
     const handleSearchChange = (e) => {
         setSearchTerm(e.target.value);
     };
     const handleSearchSubmit = (e) => {
         e.preventDefault();
         const newSearchParams = new URLSearchParams(searchParams);
         if (searchTerm.trim()) { newSearchParams.set('search', searchTerm.trim()); }
         else { newSearchParams.delete('search'); }
         newSearchParams.set('page', '1'); // Về trang 1 khi tìm kiếm
         setSearchParams(newSearchParams);
     };
      const clearSearch = () => {
         setSearchTerm('');
         const newSearchParams = new URLSearchParams(searchParams);
         newSearchParams.delete('search');
         newSearchParams.set('page', '1');
         setSearchParams(newSearchParams);
     };


    // --- Handler Phân Trang ---
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= pagination.last_page && pageNumber !== currentPage && !loading) {
           const newSearchParams = new URLSearchParams(searchParams);
           newSearchParams.set('page', pageNumber.toString());
           setSearchParams(newSearchParams);
        }
    };

     // --- Render Phân Trang ---
     const renderPagination = () => { /* ... (Copy hàm renderPagination từ MyBookingsPage) ... */ };


    // ---- Render ----
    return (
        <Container fluid className="py-3"> {/* Container fluid */}
            <Card className="shadow-sm">
                <Card.Header as="h5" className="bg-primary text-white d-flex justify-content-between align-items-center">
                    Quản Lý Danh Mục Món Ăn
                    <Button variant="light" size="sm" onClick={handleShowAddModal}>
                        <i className="bi bi-plus-circle-fill me-1"></i> Thêm Danh Mục
                    </Button>
                </Card.Header>
                <Card.Body>
                    {/* Form Tìm kiếm */}
                    <Form onSubmit={handleSearchSubmit} className="mb-3">
                        <Row>
                            <Col md={4}>
                                <InputGroup size="sm">
                                    <Form.Control
                                        type="text"
                                        placeholder="Tìm theo tên danh mục..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                    />
                                    {searchTerm && <Button variant="outline-secondary" onClick={clearSearch} title="Xóa tìm kiếm"><i className="bi bi-x-lg"></i></Button>}
                                    <Button variant="outline-primary" type="submit"><i className="bi bi-search"></i></Button>
                                </InputGroup>
                            </Col>
                        </Row>
                    </Form>


                    {/* Hiển thị Loading/Error/Danh sách */}
                    {loading && <div className="text-center my-5"><Spinner animation="border" variant="primary"/></div>}
                    {error && !loading && <Alert variant="danger">Lỗi: {error}</Alert>}
                    {!loading && !error && categories.length === 0 && (
                        <Alert variant="light" className='text-center border'>Không tìm thấy danh mục nào {currentSearch ? `với từ khóa "${currentSearch}"` : ''}.</Alert>
                    )}
                    {!loading && !error && categories.length > 0 && (
                        <>
                            <Table responsive striped bordered hover size="sm" className="align-middle">
                                <thead className='table-light'>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên Danh Mục</th>
                                        <th>Slug</th>
                                        <th>Mô tả</th>
                                        <th className='text-center' style={{ width: '100px' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(category => (
                                        <tr key={category.id}>
                                            <td>{category.id}</td>
                                            <td className="fw-medium">{category.name}</td>
                                            <td><code>{category.slug}</code></td>
                                            <td className="text-muted small">{category.description || '-'}</td>
                                            <td className='text-center'>
                                                 <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Sửa")}>
                                                    <Button variant="outline-primary" size="sm" onClick={() => handleShowEditModal(category)} className="me-1 px-1 py-0"> <i className="bi bi-pencil-fill"></i> </Button>
                                                 </OverlayTrigger>
                                                 <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Xóa")}>
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(category)} className="px-1 py-0"> <i className="bi bi-trash-fill"></i> </Button>
                                                 </OverlayTrigger>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                             {/* Phân trang */}
                             {renderPagination()}
                         </>
                    )}
                </Card.Body>
            </Card>

            {/* --- Modal Thêm/Sửa --- */}
            <CategoryFormModal
                show={showModal}
                handleClose={handleCloseModal}
                currentCategory={editingCategory} // Truyền category đang sửa (null nếu thêm mới)
                onSaveSuccess={handleSaveSuccess} // Callback để load lại danh sách
            />

        </Container>
    );
}

export default AdminCategoryListPage;

// Cần tạo service admin.category.service.js
// Cần tạo hook useAuthAdmin (hoặc dùng token admin trực tiếp trong service)