// src/pages/admin/AdminMenuItemListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Table, Spinner, Alert, Pagination, Form, Row, Col, Badge, InputGroup, Tooltip, OverlayTrigger, Modal, Image } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom'; // Thêm Link nếu cần link chi tiết
import { adminMenuItemService } from '../../services/admin.menuitem.service'; // <<--- TẠO SERVICE NÀY
import { adminCategoryService } from '../../services/admin.category.service'; // Để lấy danh sách category cho bộ lọc & form
import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // Optional

// Base URL ảnh
const API_IMAGE_BASE_URL = import.meta.env.VITE_API_IMAGE_BASE_URL || 'https://vietquannn.id.vn';
const DEFAULT_PLACEHOLDER_IMAGE = `${API_IMAGE_BASE_URL}/menu_images/placeholder.jpg`;

// --- Tooltip Component ---
const renderTooltip = (props, text) => ( <Tooltip {...props}>{text}</Tooltip> );

// --- Modal Thêm/Sửa Món Ăn ---
// Component này sẽ khá lớn, có thể tách ra file riêng src/components/admin/MenuItemFormModal.jsx
function MenuItemFormModal({ show, handleClose, currentItem, categories, onSaveSuccess }) {
    console.log("MenuItemFormModal - Danh mục nhận được:", categories);
    
    const initialFormData = {
        name: '',
        category_id: '',
        price: '',
        description: '',
        status: 'available',
        is_hot: false,
        is_vegetarian: false,
        spice_level: 0,
        image: null, // Để lưu file ảnh mới chọn
    };
    const [formData, setFormData] = useState(initialFormData);
    const [imagePreview, setImagePreview] = useState(null); // Xem trước ảnh upload
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const isEditing = !!currentItem;

    useEffect(() => {
        if (show) {
            if (isEditing && currentItem) {
                setFormData({
                    name: currentItem.name || '',
                    category_id: currentItem.category_id || '',
                    price: currentItem.price || '',
                    description: currentItem.description || '',
                    status: currentItem.status || 'available',
                    is_hot: currentItem.is_hot || false,
                    is_vegetarian: currentItem.is_vegetarian || false,
                    spice_level: currentItem.spice_level || 0,
                    image: null, // Reset file ảnh khi mở modal
                });
                 // Hiển thị ảnh hiện tại nếu đang sửa
                const currentImageUrl = currentItem.image_url
                    ? (currentItem.image_url.startsWith('http') || currentItem.image_url.startsWith('') ? currentItem.image_url : `${API_IMAGE_BASE_URL}${currentItem.image_url}`)
                    : null;
                setImagePreview(currentImageUrl);
            } else {
                setFormData(initialFormData); // Reset form cho thêm mới
                setImagePreview(null);
            }
            setError(null); setValidationErrors({}); setLoading(false);
        }
    }, [currentItem, isEditing, show]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
        if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: null }));
        setError(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            // Tạo URL xem trước
            const reader = new FileReader();
            reader.onloadend = () => { setImagePreview(reader.result); };
            reader.readAsDataURL(file);
             if (validationErrors.image) setValidationErrors(prev => ({ ...prev, image: null }));
             setError(null);
        } else {
             // Nếu hủy chọn file, giữ lại ảnh preview cũ (nếu đang sửa) hoặc xóa đi
             setFormData(prev => ({ ...prev, image: null }));
             const currentImageUrl = isEditing && currentItem?.image_url
                ? (currentItem.image_url.startsWith('http') || currentItem.image_url.startsWith('') ? currentItem.image_url : `${API_IMAGE_BASE_URL}${currentItem.image_url}`)
                : null;
             setImagePreview(currentImageUrl);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(null); setValidationErrors({});

        // Tạo FormData để gửi file ảnh và dữ liệu
        const submissionData = new FormData();
        submissionData.append('name', formData.name);
        submissionData.append('category_id', formData.category_id);
        submissionData.append('price', formData.price);
        submissionData.append('description', formData.description || ''); // Gửi chuỗi rỗng nếu null
        submissionData.append('status', formData.status);
        submissionData.append('is_hot', formData.is_hot ? '1' : '0'); // Gửi 1/0 cho boolean
        submissionData.append('is_vegetarian', formData.is_vegetarian ? '1' : '0');
        submissionData.append('spice_level', formData.spice_level || '0');
        // Chỉ thêm ảnh nếu có file mới được chọn
        if (formData.image instanceof File) {
            submissionData.append('image', formData.image);
        }
        // Nếu là update, thêm _method
        if (isEditing) {
            submissionData.append('_method', 'PATCH'); // Hoặc PUT
        }

        console.log("Submitting MenuItem Data (FormData):", Object.fromEntries(submissionData.entries())); // Log FormData (ảnh sẽ hiển thị là [object File])

        try {
            let response;
            if (isEditing) {
                // Gọi API Update MenuItem (dùng POST vì có FormData)
                // Backend Route::post('/menu-items/{menuItem}', ...) sẽ nhận _method=PATCH
                response = await adminMenuItemService.updateMenuItem(currentItem.slug || currentItem.id, submissionData);
            } else {
                // Gọi API Create MenuItem
                response = await adminMenuItemService.createMenuItem(submissionData);
            }

            if (response.data?.success) {
                alert(isEditing ? 'Cập nhật món ăn thành công!' : 'Thêm món ăn thành công!');
                onSaveSuccess(); handleClose();
            } else { setError(response.data?.message || 'Có lỗi xảy ra.'); setLoading(false); }
        } catch (err) {
             console.error("MenuItem form error:", err);
             let errMsg = 'Đã có lỗi xảy ra.';
             if (err.response) {
                 errMsg = err.response.data?.message || errMsg;
                 if (err.response.status === 422 && err.response.data?.errors) {
                      setValidationErrors(err.response.data.errors); errMsg = "Dữ liệu không hợp lệ.";
                 }
             } else { errMsg = err.message || 'Lỗi mạng.'; }
             setError(errMsg); setLoading(false);
        }
    };


    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static" size="lg"> {/* Size lg */}
            <Modal.Header closeButton><Modal.Title>{isEditing ? 'Sửa Món Ăn' : 'Thêm Món Ăn Mới'}</Modal.Title></Modal.Header>
            <Form onSubmit={handleSubmit} noValidate encType="multipart/form-data"> {/* Thêm encType */}
                <Modal.Body>
                    {error && <Alert variant="danger" size="sm">{error}</Alert>}
                    <Row>
                        <Col md={6}>
                             <Form.Group className="mb-3" controlId="menuItemName">
                                <Form.Label>Tên Món Ăn <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required disabled={loading} isInvalid={!!validationErrors.name}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.name?.[0]}</Form.Control.Feedback>
                            </Form.Group>
                             <Form.Group className="mb-3" controlId="menuItemCategory">
                                <Form.Label>Danh Mục <span className="text-danger">*</span></Form.Label>
                                <Form.Select name="category_id" value={formData.category_id} onChange={handleChange} required disabled={loading || categories.length === 0} isInvalid={!!validationErrors.category_id}>
                                    <option value="">-- Chọn danh mục --</option>
                                    {Array.isArray(categories) && categories.map(cat => {
                                        console.log("Rendering category option:", cat);
                                        return <option key={cat.id} value={cat.id}>{cat.name}</option>;
                                    })}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{validationErrors.category_id?.[0]}</Form.Control.Feedback>
                            </Form.Group>
                             <Form.Group className="mb-3" controlId="menuItemPrice">
                                <Form.Label>Giá (VNĐ) <span className="text-danger">*</span></Form.Label>
                                 <InputGroup>
                                    <Form.Control type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="1000" required disabled={loading} isInvalid={!!validationErrors.price}/>
                                     <InputGroup.Text>đ</InputGroup.Text>
                                     <Form.Control.Feedback type="invalid">{validationErrors.price?.[0]}</Form.Control.Feedback>
                                 </InputGroup>
                            </Form.Group>
                             <Form.Group className="mb-3" controlId="menuItemStatus">
                                <Form.Label>Trạng Thái <span className="text-danger">*</span></Form.Label>
                                <Form.Select name="status" value={formData.status} onChange={handleChange} required disabled={loading} isInvalid={!!validationErrors.status}>
                                    <option value="available">Còn hàng</option>
                                    <option value="unavailable">Hết hàng</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{validationErrors.status?.[0]}</Form.Control.Feedback>
                            </Form.Group>
                             <Form.Group className="mb-3" controlId="menuItemSpiceLevel">
                                <Form.Label>Độ cay (0-5)</Form.Label>
                                <Form.Select name="spice_level" value={formData.spice_level} onChange={handleChange} disabled={loading} isInvalid={!!validationErrors.spice_level}>
                                    <option value="0">0 - Không cay</option>
                                    <option value="1">1 - Ít cay</option>
                                    <option value="2">2 - Cay vừa</option>
                                    <option value="3">3 - Cay</option>
                                    <option value="4">4 - Rất cay</option>
                                    <option value="5">5 - Siêu cay</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{validationErrors.spice_level?.[0]}</Form.Control.Feedback>
                            </Form.Group>
                             <div className="d-flex gap-3 mb-3">
                                 <Form.Check type="switch" id="is_hot" name="is_hot" label="Món Hot?" checked={!!formData.is_hot} onChange={handleChange} disabled={loading}/>
                                 <Form.Check type="switch" id="is_vegetarian" name="is_vegetarian" label="Món Chay?" checked={!!formData.is_vegetarian} onChange={handleChange} disabled={loading}/>
                             </div>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="menuItemDescription">
                                <Form.Label>Mô tả</Form.Label>
                                <Form.Control as="textarea" rows={4} name="description" value={formData.description} onChange={handleChange} disabled={loading} isInvalid={!!validationErrors.description} placeholder="Mô tả chi tiết về món ăn..."/>
                                <Form.Control.Feedback type="invalid">{validationErrors.description?.[0]}</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group controlId="menuItemImage" className="mb-3">
                                <Form.Label>{isEditing ? 'Thay đổi ảnh' : 'Ảnh đại diện'}</Form.Label>
                                <Form.Control type="file" name="image" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/webp" disabled={loading} isInvalid={!!validationErrors.image}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.image?.[0]}</Form.Control.Feedback>
                                {imagePreview && (
                                     <div className="mt-2 text-center">
                                         <Image src={imagePreview} alt="Xem trước" thumbnail style={{ maxHeight: '150px' }} />
                                         <Button variant="link" size="sm" onClick={() => { setImagePreview(null); setFormData(prev=>({...prev, image: null})) }} className="d-block mx-auto text-danger" disabled={loading}>Xóa ảnh chọn</Button>
                                     </div>
                                )}
                                {!imagePreview && isEditing && currentItem?.image_url && (
                                    <div className="mt-2 text-muted small">Giữ ảnh hiện tại nếu không chọn ảnh mới.</div>
                                )}
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>Hủy</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : (isEditing ? 'Lưu Thay Đổi' : 'Thêm Món Ăn')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}


// --- Component Trang Chính ---
function AdminMenuItemListPage() {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]); // Danh sách category để lọc và dùng trong modal
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [searchParams, setSearchParams] = useSearchParams();

    // --- State cho bộ lọc ---
    const [filterCategory, setFilterCategory] = useState(searchParams.get('category_id') || '');
    const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
    const [filterHot, setFilterHot] = useState(searchParams.get('is_hot') || '');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    // State cho Modal
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingId, setDeletingId] = useState(null); // ID item đang xóa

    const currentPage = parseInt(searchParams.get('page') || '1');

    // --- Hàm Fetch Categories (chỉ cần gọi 1 lần) ---
    const fetchAllCategories = useCallback(async () => {
        try {
            console.log("Đang gọi API lấy danh mục...");
            
            // Thử sử dụng hàm getAllCategories mới
            try {
                const response = await adminCategoryService.getAllCategories();
                console.log("Kết quả API danh mục (getAllCategories):", response.data);
                
                if (response.data?.success) {
                    const categoriesData = response.data.data || [];
                    console.log("Danh mục đã xử lý (getAllCategories):", categoriesData);
                    setCategories(categoriesData);
                    return; // Thoát nếu thành công
                }
            } catch (allCategoriesError) {
                console.warn("Không thể lấy tất cả danh mục, thử phương pháp khác:", allCategoriesError);
            }
            
            // Fallback: Thử với per_page lớn
            const response = await adminCategoryService.getCategories({ per_page: 100 }); 
            console.log("Kết quả API danh mục (fallback):", response.data);
            
            if (response.data?.success) {
                // Kiểm tra cấu trúc dữ liệu trả về
                console.log("Cấu trúc dữ liệu danh mục:", response.data.data);
                
                // Xử lý dữ liệu trả về - có thể là mảng trực tiếp hoặc nằm trong data.data
                let categoriesData = [];
                
                if (Array.isArray(response.data.data)) {
                    // Nếu là mảng trực tiếp
                    categoriesData = response.data.data;
                } else if (response.data.data && Array.isArray(response.data.data.data)) {
                    // Nếu là dữ liệu phân trang
                    categoriesData = response.data.data.data;
                }
                
                console.log("Danh mục đã xử lý:", categoriesData);
                
                // Nếu vẫn không có dữ liệu, thử gọi API không có tham số phân trang
                if (categoriesData.length === 0) {
                    console.log("Không có danh mục, thử gọi API không có tham số phân trang");
                    const fallbackResponse = await adminCategoryService.getCategories();
                    console.log("Kết quả API fallback:", fallbackResponse.data);
                    
                    if (fallbackResponse.data?.success) {
                        if (Array.isArray(fallbackResponse.data.data)) {
                            categoriesData = fallbackResponse.data.data;
                        } else if (fallbackResponse.data.data && Array.isArray(fallbackResponse.data.data.data)) {
                            categoriesData = fallbackResponse.data.data.data;
                        }
                    }
                }
                
                setCategories(categoriesData);
            } else { 
                console.warn("Could not fetch categories for filter/form", response.data);
            }
        } catch (err) { 
            console.error("Error fetching all categories:", err);
            console.error("Chi tiết lỗi:", err.response || err);
        }
    }, []);

    useEffect(() => { fetchAllCategories(); }, [fetchAllCategories]); // Gọi khi mount

    // --- Hàm Fetch Menu Items ---
    const fetchMenuItems = useCallback(async (page, filters) => {
        setLoading(true); setError(null);
        try {
            const params = {
                page,
                search: filters.search || undefined,
                category_id: filters.category || undefined,
                status: filters.status || undefined,
                is_hot: filters.hot === '' ? undefined : (filters.hot === '1' ? 1 : 0), // Gửi 1 hoặc 0
                sort_by: 'id', // Sắp xếp theo ID
                sort_dir: 'asc', // Từ bé đến lớn
                per_page: 15,
            };
             Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await adminMenuItemService.getMenuItems(params); // Gọi service
            if (response.data?.success) {
                setMenuItems(response.data.data.data || []);
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
                setError(response.data?.message || 'Lỗi tải món ăn.'); 
                setMenuItems([]); 
                setPagination({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 15 }); 
            }
        } catch (err) {
            if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); }
             setMenuItems([]); 
             setPagination({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 15 });
        } finally { setLoading(false); }
    }, []); // Dependency rỗng

    // --- useEffect gọi fetch khi trang hoặc filter thay đổi ---
    useEffect(() => {
        const currentSearch = searchParams.get('search') || '';
        const currentCategory = searchParams.get('category_id') || '';
        const currentStatus = searchParams.get('status') || '';
        const currentHot = searchParams.get('is_hot') || '';

        setSearchTerm(currentSearch);
        setFilterCategory(currentCategory);
        setFilterStatus(currentStatus);
        setFilterHot(currentHot);

        fetchMenuItems(currentPage, { search: currentSearch, category: currentCategory, status: currentStatus, hot: currentHot });
    }, [searchParams, fetchMenuItems, currentPage]); // Chạy lại khi searchParams thay đổi

    // --- Handlers Modal ---
    const handleShowAddModal = () => { 
        console.log("Mở modal thêm mới, danh mục hiện tại:", categories);
        setEditingItem(null); 
        setShowModal(true); 
    };
    const handleShowEditModal = (item) => { setEditingItem(item); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setEditingItem(null); };
    const handleSaveSuccess = () => { fetchMenuItems(currentPage, { search: searchTerm, category: filterCategory, status: filterStatus, hot: filterHot }); }; // Load lại danh sách

    // --- Handler Xóa ---
    const handleDelete = async (item) => {
        if (!item || deletingId === item.id) return;
        const itemIdentifier = item.slug || item.id;
        if (window.confirm(`Xóa món "${item.name}"?`)) {
            setDeletingId(item.id); setError(null);
            try {
                await adminMenuItemService.deleteMenuItem(itemIdentifier);
                alert('Xóa món ăn thành công!');
                // Load lại trang hiện tại hoặc trang trước nếu cần
                if(menuItems.length === 1 && currentPage > 1){ handlePageChange(currentPage - 1); }
                else { fetchMenuItems(currentPage, { search: searchTerm, category: filterCategory, status: filterStatus, hot: filterHot }); }
            } catch (err) {
                 alert(`Lỗi xóa: ${err.response?.data?.message || err.message}`);
                 setError(`Lỗi xóa: ${err.response?.data?.message || err.message}`);
            } finally { setDeletingId(null); }
        }
    };

    // --- Handlers Tìm kiếm & Lọc ---
     const handleSearchChange = (e) => setSearchTerm(e.target.value);
     const handleFilterChange = (e) => { // Dùng chung cho các select filter
         const { name, value } = e.target;
         const newSearchParams = new URLSearchParams(searchParams);
         if (value) { newSearchParams.set(name, value); }
         else { newSearchParams.delete(name); }
         newSearchParams.set('page', '1');
         setSearchParams(newSearchParams);
     };
      const applyFilters = () => { // Nút lọc áp dụng tất cả filter state
         const newSearchParams = new URLSearchParams();
         if (searchTerm.trim()) newSearchParams.set('search', searchTerm.trim());
         if (filterCategory) newSearchParams.set('category_id', filterCategory);
         if (filterStatus) newSearchParams.set('status', filterStatus);
         if (filterHot !== '') newSearchParams.set('is_hot', filterHot);
         newSearchParams.set('page', '1');
         setSearchParams(newSearchParams);
     };
      const clearFilters = () => {
         setSearchTerm(''); setFilterCategory(''); setFilterStatus(''); setFilterHot('');
         setSearchParams({ page: '1' });
     };


    // --- Handler Phân Trang ---
    const handlePageChange = (pageNumber) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', pageNumber.toString());
        setSearchParams(newSearchParams);
    };

    // --- Render Phân Trang ---
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
                    Hiển thị {pagination.from} - {pagination.to} / {pagination.total} món ăn
                </div>
                <Pagination className="mb-0">{items}</Pagination>
            </div>
        );
    };

    // Hàm xử lý lỗi ảnh
    const handleImageError = (e) => { 
        e.target.onerror = null; 
        e.target.src = DEFAULT_PLACEHOLDER_IMAGE; 
    };

    // Hàm xử lý đường dẫn ảnh
    const getImageUrl = (imageUrl) => {
    
        if (!imageUrl) return DEFAULT_PLACEHOLDER_IMAGE;
    
        // Nếu đã là URL đầy đủ, trả về nguyên
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
    
        // Nếu là đường dẫn bắt đầu bằng /menu_images thì gắn domain vào
        if (imageUrl.startsWith('/menu_images')) {
            return `${API_IMAGE_BASE_URL}${imageUrl}`;
        }
    
        // Trường hợp fallback
        return DEFAULT_PLACEHOLDER_IMAGE;
    };

    // ---- Render ----
    return (
        <Container fluid className="py-3">
            <Card className="shadow-sm">
                <Card.Header as="h5" className="bg-success text-white d-flex justify-content-between align-items-center">
                    Quản Lý Món Ăn
                    <Button variant="light" size="sm" onClick={handleShowAddModal}>
                        <i className="bi bi-plus-circle-fill me-1"></i> Thêm Món Mới
                    </Button>
                </Card.Header>
                <Card.Body>
                    {/* --- Bộ lọc --- */}
                    <Form className="mb-3 p-3 bg-light border rounded">
                        <Row className="g-2 align-items-end">
                            <Col md={4} xl={3}>
                                <Form.Group controlId="searchMenuItem">
                                     <Form.Label className='small mb-1 fw-semibold'>Tìm tên món</Form.Label>
                                     <InputGroup size="sm">
                                        <Form.Control type="text" placeholder="Nhập tên món..." value={searchTerm} onChange={handleSearchChange}/>
                                        {searchTerm && <Button variant="outline-secondary" onClick={clearFilters} title="Xóa tìm kiếm"><i className="bi bi-x-lg"></i></Button>}
                                        {/* <Button variant="outline-primary" onClick={applyFilters}><i className="bi bi-search"></i></Button> */}
                                     </InputGroup>
                                </Form.Group>
                            </Col>
                             <Col md={3} xl={2}>
                                <Form.Group controlId="filterCategory">
                                    <Form.Label className='small mb-1 fw-semibold'>Danh mục</Form.Label>
                                    <Form.Select size="sm" name="category_id" value={filterCategory} onChange={handleFilterChange} disabled={loading}>
                                        <option value="">Tất cả</option>
                                        {Array.isArray(categories) && categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                             <Col md={2} xl={2}>
                                <Form.Group controlId="filterStatus">
                                    <Form.Label className='small mb-1 fw-semibold'>Trạng thái</Form.Label>
                                    <Form.Select size="sm" name="status" value={filterStatus} onChange={handleFilterChange} disabled={loading}>
                                        <option value="">Tất cả</option>
                                        <option value="available">Còn hàng</option>
                                        <option value="unavailable">Hết hàng</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                             <Col md={2} xl={2}>
                                <Form.Group controlId="filterHot">
                                    <Form.Label className='small mb-1 fw-semibold'>Nổi bật (Hot)</Form.Label>
                                    <Form.Select size="sm" name="is_hot" value={filterHot} onChange={handleFilterChange} disabled={loading}>
                                        <option value="">Tất cả</option>
                                        <option value="1">Có</option>
                                        <option value="0">Không</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md="auto" className="mt-3 mt-md-0">
                                <Button variant="primary" size="sm" onClick={applyFilters} disabled={loading}> <i className="bi bi-funnel-fill"></i> Lọc </Button>
                            </Col>
                        </Row>
                    </Form>

                    {/* --- Hiển thị Loading/Error/Danh sách --- */}
                    {loading && <div className="text-center my-5"><Spinner animation="border" variant="success"/></div>}
                    {error && !loading && <Alert variant="danger">Lỗi: {error}</Alert>}
                    {!loading && !error && menuItems.length === 0 && ( <Alert variant="light" className='text-center border'>Không tìm thấy món ăn nào.</Alert> )}
                    {!loading && !error && menuItems.length > 0 && (
                        <>
                            <Table responsive striped bordered hover size="sm" className="align-middle">
                                <thead className='table-light'>
                                    <tr>
                                        <th style={{width: '60px'}}>ID</th>
                                        <th style={{width: '60px'}}>Ảnh</th>
                                        <th>Tên Món Ăn</th>
                                        <th>Danh Mục</th>
                                        <th className='text-end'>Giá</th>
                                        <th className='text-center'>Trạng Thái</th>
                                        <th className='text-center'>Hot</th>
                                        <th className='text-center'>Chay</th>
                                        <th className='text-center' style={{ width: '100px' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menuItems.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.id}</td>
                                            <td>
                                                 <Image
                                                     src={getImageUrl(item.image_url)}
                                                     alt={item.name} 
                                                     onError={handleImageError} 
                                                     rounded 
                                                     style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                                                 />
                                            </td>
                                            <td className="fw-medium">{item.name}</td>
                                            <td className="small text-muted">{item.category?.name || '-'}</td>
                                            <td className='text-end'>{parseInt(item.price).toLocaleString('vi-VN')} đ</td>
                                            <td className='text-center'>
                                                 <Badge bg={item.status === 'available' ? 'success' : 'secondary'} pill>{item.status === 'available' ? 'Còn' : 'Hết'}</Badge>
                                            </td>
                                            <td className='text-center'>{item.is_hot ? <i className="bi bi-check-circle-fill text-danger"></i> : <i className="bi bi-dash-circle text-muted"></i>}</td>
                                            <td className='text-center'>{item.is_vegetarian ? <i className="bi bi-check-circle-fill text-success"></i> : <i className="bi bi-dash-circle text-muted"></i>}</td>
                                            <td className='text-center'>
                                                 <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Sửa")}>
                                                     <Button variant="outline-primary" size="sm" onClick={() => handleShowEditModal(item)} className="me-1 px-1 py-0" disabled={deletingId === item.id}> <i className="bi bi-pencil-fill"></i> </Button>
                                                 </OverlayTrigger>
                                                 <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Xóa")}>
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item)} className="px-1 py-0" disabled={deletingId === item.id}>
                                                        {deletingId === item.id ? <Spinner size="sm" animation="border"/> : <i className="bi bi-trash-fill"></i>}
                                                    </Button>
                                                </OverlayTrigger>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            {/* Phân trang */}
                            {pagination.total > 0 && (
                                <Card.Footer className="text-muted small d-flex justify-content-between align-items-center flex-wrap bg-light border-top-0 pt-2 pb-1">
                                    {renderPagination()}
                                </Card.Footer>
                            )}
                         </>
                    )}
                </Card.Body>
            </Card>

            {/* --- Modal Thêm/Sửa --- */}
            {showModal && (
                <MenuItemFormModal
                    show={showModal}
                    handleClose={handleCloseModal}
                    currentItem={editingItem}
                    categories={categories} // Truyền danh sách category vào modal
                    menuItems={menuItems}
                    onSaveSuccess={handleSaveSuccess}
                />
            )}
        </Container>
    );
}

export default AdminMenuItemListPage;

// Cần tạo service admin.menuitem.service.js
// Ví dụ:
/*
// src/services/admin.menuitem.service.js
import apiClient from './api';
const getMenuItems = (params = {}) => apiClient.get('/admin/menu-items', { params });
const createMenuItem = (formData) => apiClient.post('/admin/menu-items', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
const updateMenuItem = (identifier, formData) => apiClient.post(`/admin/menu-items/${identifier}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); // Dùng POST + _method=PATCH
const deleteMenuItem = (identifier) => apiClient.delete(`/admin/menu-items/${identifier}`);
// ... các hàm khác như uploadImage, toggleHot, updateStatus ...
export const adminMenuItemService = { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, ... };
*/