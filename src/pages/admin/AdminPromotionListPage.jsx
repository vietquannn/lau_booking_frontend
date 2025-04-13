// src/pages/admin/AdminPromotionListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Table, Spinner, Alert, Pagination, Form, Row, Col, Badge, InputGroup, Tooltip, OverlayTrigger, Modal } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom';
import { adminPromotionService } from '../../services/admin.promotion.service'; // <<--- TẠO SERVICE NÀY
import { adminCategoryService } from '../../services/admin.category.service'; // Để lấy category cho form
import { adminMenuItemService } from '../../services/admin.menuitem.service'; // Để lấy menu item cho form
import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // Optional
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import vi from 'date-fns/locale/vi';
import { registerLocale } from 'react-datepicker';
registerLocale('vi', vi);

// --- Tooltip Component ---
const renderTooltip = (props, text) => ( <Tooltip {...props}>{text}</Tooltip> );

// --- Modal Thêm/Sửa Promotion ---
// (Component này khá phức tạp, nên tách ra file riêng: src/components/admin/PromotionFormModal.jsx)
function PromotionFormModal({ show, handleClose, currentPromotion, categories, menuItems, onSaveSuccess }) {
    const initialFormData = {
        code: '', description: '', type: 'percentage', value: '', max_uses: null,
        max_uses_per_user: null, min_order_value: null, start_date: null, end_date: null,
        is_active: true, applicable_scope: 'all', category_ids: [], menu_item_ids: []
    };
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const isEditing = !!currentPromotion;

    useEffect(() => {
        if (show) {
            if (isEditing && currentPromotion) {
                 // Chuyển đổi ngày giờ từ chuỗi ISO (nếu API trả về vậy) sang object Date
                 const startDate = currentPromotion.start_date ? new Date(currentPromotion.start_date) : null;
                 const endDate = currentPromotion.end_date ? new Date(currentPromotion.end_date) : null;

                setFormData({
                    code: currentPromotion.code || '',
                    description: currentPromotion.description || '',
                    type: currentPromotion.type || 'percentage',
                    value: currentPromotion.value || '',
                    max_uses: currentPromotion.max_uses ?? '', // Dùng ?? để hiện chuỗi rỗng thay vì null
                    max_uses_per_user: currentPromotion.max_uses_per_user ?? '',
                    min_order_value: currentPromotion.min_order_value ?? '',
                    start_date: startDate, // Dùng object Date
                    end_date: endDate,     // Dùng object Date
                    is_active: currentPromotion.is_active ?? true,
                    applicable_scope: currentPromotion.applicable_scope || 'all',
                    // Lấy IDs từ quan hệ đã load (cần đảm bảo API show load kèm)
                    category_ids: currentPromotion.categories?.map(cat => cat.id) || [],
                    menu_item_ids: currentPromotion.menu_items?.map(item => item.id) || [],
                });
            } else {
                setFormData({ // Reset, đặt ngày mặc định là ngày mai, kết thúc sau 1 tuần
                     ...initialFormData,
                     start_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Ngày mai
                     end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) // 1 tuần sau ngày mai
                });
            }
            setError(null); setValidationErrors({}); setLoading(false);
        }
    }, [currentPromotion, isEditing, show]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' || type === 'switch' ? checked : value;

        // Nếu đổi scope, reset mảng IDs không liên quan
        if (name === 'applicable_scope') {
             setFormData(prev => ({
                 ...prev,
                 [name]: val,
                 category_ids: val === 'categories' ? prev.category_ids : [],
                 menu_item_ids: val === 'menu_items' ? prev.menu_item_ids : [],
             }));
        } else {
            setFormData(prev => ({ ...prev, [name]: val }));
        }

        if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: null }));
        setError(null);
    };

     // Handler cho DatePicker
    const handleDateChange = (date, fieldName) => {
        setFormData(prev => ({ ...prev, [fieldName]: date }));
         if (validationErrors[fieldName]) setValidationErrors(prev => ({ ...prev, [fieldName]: null }));
         // Validate lại end_date nếu start_date thay đổi
         if (fieldName === 'start_date' && formData.end_date && date >= formData.end_date) {
              setValidationErrors(prev => ({ ...prev, end_date: ['Ngày kết thúc phải sau ngày bắt đầu.'] }));
         } else if (fieldName === 'end_date' && validationErrors.end_date){
              setValidationErrors(prev => ({ ...prev, end_date: null }));
         }
    };

    // Handler cho Select nhiều (Category/Menu Item)
    const handleMultiSelectChange = (e) => {
         const { name, options } = e.target;
         const selectedIds = Array.from(options).filter(option => option.selected).map(option => parseInt(option.value));
         setFormData(prev => ({ ...prev, [name]: selectedIds }));
          if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: null }));
          setError(null);
    };


    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(null); setValidationErrors({});

        // Format lại ngày giờ trước khi gửi
        const formatDateTime = (date) => {
            if (!date) return null;
            // Format YYYY-MM-DD HH:MM:SS
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
        };

        const dataToSend = {
            ...formData,
            // Chuyển đổi giá trị số (tránh lỗi validation nếu là chuỗi rỗng)
            value: parseFloat(formData.value) || 0,
            max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
            max_uses_per_user: formData.max_uses_per_user ? parseInt(formData.max_uses_per_user) : null,
            min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
            // Format ngày giờ
            start_date: formatDateTime(formData.start_date),
            end_date: formatDateTime(formData.end_date),
            // Chuyển đổi boolean
            is_active: !!formData.is_active,
             // Chỉ gửi mảng IDs tương ứng với scope
            category_ids: formData.applicable_scope === 'categories' ? formData.category_ids : [],
            menu_item_ids: formData.applicable_scope === 'menu_items' ? formData.menu_item_ids : [],
        };
         // Xóa các key không cần thiết nếu scope là 'all'
         if (dataToSend.applicable_scope === 'all') {
             delete dataToSend.category_ids;
             delete dataToSend.menu_item_ids;
         } else if (dataToSend.applicable_scope === 'categories') {
             delete dataToSend.menu_item_ids;
         } else { // menu_items
             delete dataToSend.category_ids;
         }


        console.log("Submitting Promotion Data:", dataToSend);

        try {
            let response;
            if (isEditing) {
                response = await adminPromotionService.updatePromotion(currentPromotion.id, dataToSend);
            } else {
                response = await adminPromotionService.createPromotion(dataToSend);
            }
            if (response.data?.success) {
                alert(isEditing ? 'Cập nhật KM thành công!' : 'Thêm KM thành công!');
                onSaveSuccess(); handleClose();
            } else { setError(response.data?.message || 'Có lỗi xảy ra.'); setLoading(false); }
        } catch (err) {
             console.error("Promotion form error:", err);
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
            <Modal.Header closeButton><Modal.Title>{isEditing ? 'Sửa Khuyến Mãi' : 'Thêm Khuyến Mãi Mới'}</Modal.Title></Modal.Header>
            <Form onSubmit={handleSubmit} noValidate>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}> {/* Scroll nếu nội dung dài */}
                    {error && <Alert variant="danger" size="sm">{error}</Alert>}
                    <Row>
                        {/* Cột Trái */}
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="promoCode">
                                <Form.Label>Mã Code <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="code" value={formData.code} onChange={handleChange} required disabled={loading} isInvalid={!!validationErrors.code} placeholder="VD: HELLO20, LAU50K..."/>
                                <Form.Control.Feedback type="invalid">{validationErrors.code?.[0]}</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="promoDescription">
                                <Form.Label>Mô tả</Form.Label>
                                <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} disabled={loading} isInvalid={!!validationErrors.description} placeholder="Mô tả chương trình khuyến mãi..."/>
                                <Form.Control.Feedback type="invalid">{validationErrors.description?.[0]}</Form.Control.Feedback>
                            </Form.Group>
                             <Row>
                                <Col sm={6}>
                                    <Form.Group className="mb-3" controlId="promoType">
                                        <Form.Label>Loại giảm <span className="text-danger">*</span></Form.Label>
                                        <Form.Select name="type" value={formData.type} onChange={handleChange} required disabled={loading} isInvalid={!!validationErrors.type}>
                                            <option value="percentage">Theo %</option>
                                            <option value="fixed_amount">Số tiền cố định</option>
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">{validationErrors.type?.[0]}</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col sm={6}>
                                     <Form.Group className="mb-3" controlId="promoValue">
                                        <Form.Label>Giá trị <span className="text-danger">*</span></Form.Label>
                                         <InputGroup>
                                            <Form.Control type="number" name="value" value={formData.value} onChange={handleChange} min="0" step={formData.type === 'percentage' ? '0.01' : '1000'} required disabled={loading} isInvalid={!!validationErrors.value}/>
                                             <InputGroup.Text>{formData.type === 'percentage' ? '%' : 'đ'}</InputGroup.Text>
                                             <Form.Control.Feedback type="invalid">{validationErrors.value?.[0]}</Form.Control.Feedback>
                                         </InputGroup>
                                    </Form.Group>
                                </Col>
                             </Row>
                              <Row>
                                <Col sm={6}>
                                     <Form.Group className="mb-3" controlId="promoMaxUses">
                                        <Form.Label>Tổng lượt dùng (Để trống = ∞)</Form.Label>
                                        <Form.Control type="number" name="max_uses" value={formData.max_uses} onChange={handleChange} min="0" disabled={loading} isInvalid={!!validationErrors.max_uses}/>
                                        <Form.Control.Feedback type="invalid">{validationErrors.max_uses?.[0]}</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                 <Col sm={6}>
                                    <Form.Group className="mb-3" controlId="promoMaxUsesPerUser">
                                        <Form.Label>Lượt dùng / User (Để trống = ∞)</Form.Label>
                                        <Form.Control type="number" name="max_uses_per_user" value={formData.max_uses_per_user} onChange={handleChange} min="0" disabled={loading} isInvalid={!!validationErrors.max_uses_per_user}/>
                                         <Form.Control.Feedback type="invalid">{validationErrors.max_uses_per_user?.[0]}</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                             </Row>
                             <Form.Group className="mb-3" controlId="promoMinOrderValue">
                                <Form.Label>Giá trị đơn tối thiểu (Để trống = 0)</Form.Label>
                                 <InputGroup>
                                    <Form.Control type="number" name="min_order_value" value={formData.min_order_value} onChange={handleChange} min="0" step="1000" disabled={loading} isInvalid={!!validationErrors.min_order_value}/>
                                     <InputGroup.Text>đ</InputGroup.Text>
                                     <Form.Control.Feedback type="invalid">{validationErrors.min_order_value?.[0]}</Form.Control.Feedback>
                                 </InputGroup>
                             </Form.Group>
                             <Form.Group className="mb-3" controlId="promoIsActive">
                                  <Form.Check type="switch" name="is_active" label="Kích hoạt khuyến mãi?" checked={!!formData.is_active} onChange={handleChange} disabled={loading}/>
                             </Form.Group>
                        </Col>

                        {/* Cột Phải */}
                        <Col md={6}>
                             <Row>
                                <Col sm={6}>
                                     <Form.Group className="mb-3" controlId="promoStartDate">
                                        <Form.Label>Ngày bắt đầu <span className="text-danger">*</span></Form.Label>
                                        <DatePicker
                                            selected={formData.start_date}
                                            onChange={(date) => handleDateChange(date, 'start_date')}
                                            selectsStart
                                            startDate={formData.start_date}
                                            endDate={formData.end_date}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="dd/MM/yyyy HH:mm"
                                            className={`form-control ${validationErrors.start_date ? 'is-invalid' : ''}`}
                                            locale="vi" required disabled={loading}
                                            minDate={isEditing ? null : new Date()} // Chỉ giới hạn ngày quá khứ khi thêm mới
                                        />
                                         <Form.Control.Feedback type="invalid" style={{display: validationErrors.start_date ? 'block' : 'none'}}>{validationErrors.start_date?.[0]}</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col sm={6}>
                                    <Form.Group className="mb-3" controlId="promoEndDate">
                                        <Form.Label>Ngày kết thúc <span className="text-danger">*</span></Form.Label>
                                        <DatePicker
                                            selected={formData.end_date}
                                            onChange={(date) => handleDateChange(date, 'end_date')}
                                            selectsEnd
                                            startDate={formData.start_date}
                                            endDate={formData.end_date}
                                            minDate={formData.start_date || new Date()} // Kết thúc phải sau bắt đầu
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="dd/MM/yyyy HH:mm"
                                            className={`form-control ${validationErrors.end_date ? 'is-invalid' : ''}`}
                                            locale="vi" required disabled={loading}
                                        />
                                         <Form.Control.Feedback type="invalid" style={{display: validationErrors.end_date ? 'block' : 'none'}}>{validationErrors.end_date?.[0]}</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                             </Row>
                              <Form.Group className="mb-3" controlId="promoApplicableScope">
                                <Form.Label>Phạm vi áp dụng <span className="text-danger">*</span></Form.Label>
                                <Form.Select name="applicable_scope" value={formData.applicable_scope} onChange={handleChange} required disabled={loading} isInvalid={!!validationErrors.applicable_scope}>
                                    <option value="all">Toàn bộ đơn hàng</option>
                                    <option value="categories">Danh mục cụ thể</option>
                                    <option value="menu_items">Món ăn cụ thể</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{validationErrors.applicable_scope?.[0]}</Form.Control.Feedback>
                            </Form.Group>

                             {/* Hiển thị lựa chọn Category/MenuItem dựa trên scope */}
                            {formData.applicable_scope === 'categories' && (
                                 <Form.Group className="mb-3" controlId="promoCategoryIds">
                                    <Form.Label>Chọn danh mục áp dụng <span className="text-danger">*</span></Form.Label>
                                     <Form.Select
                                        multiple // Cho phép chọn nhiều
                                        htmlSize={5} // Hiển thị 5 dòng
                                        name="category_ids"
                                        value={formData.category_ids} // value là mảng các ID đã chọn
                                        onChange={handleMultiSelectChange} // Handler riêng cho multi-select
                                        required={formData.applicable_scope === 'categories'}
                                        disabled={loading || categories.length === 0}
                                        isInvalid={!!validationErrors.category_ids || !!validationErrors['category_ids.*']}
                                    >
                                         {/* <option value="" disabled>Giữ Ctrl/Cmd để chọn nhiều</option> */}
                                         {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                     </Form.Select>
                                      <Form.Control.Feedback type="invalid">{validationErrors.category_ids?.[0] || validationErrors['category_ids.*']?.[0]}</Form.Control.Feedback>
                                      <Form.Text muted>Giữ phím Ctrl (hoặc Cmd trên Mac) để chọn nhiều danh mục.</Form.Text>
                                 </Form.Group>
                            )}
                             {formData.applicable_scope === 'menu_items' && (
                                 <Form.Group className="mb-3" controlId="promoMenuItemIds">
                                    <Form.Label>Chọn món ăn áp dụng <span className="text-danger">*</span></Form.Label>
                                    {/* TODO: Cần có cách load và chọn món ăn hiệu quả hơn (Searchable Select,...) */}
                                    {/* Tạm thời dùng multi-select nếu số lượng món ít */}
                                    <Form.Select
                                        multiple htmlSize={8} name="menu_item_ids"
                                        value={formData.menu_item_ids} onChange={handleMultiSelectChange}
                                        required={formData.applicable_scope === 'menu_items'}
                                        disabled={loading /* || menuItems.length === 0 */}
                                        isInvalid={!!validationErrors.menu_item_ids || !!validationErrors['menu_item_ids.*']}
                                    >
                                         {menuItems?.map(item => <option key={item.id} value={item.id}>{item.name} ({item.category?.name})</option>)}
                                         {/* Cần truyền menuItems prop vào Modal */}
                                         {(!menuItems || menuItems.length === 0) && <option disabled>Cần load danh sách món ăn...</option>}
                                     </Form.Select>
                                      <Form.Control.Feedback type="invalid">{validationErrors.menu_item_ids?.[0] || validationErrors['menu_item_ids.*']?.[0]}</Form.Control.Feedback>
                                       <Form.Text muted>Giữ phím Ctrl/Cmd để chọn nhiều món.</Form.Text>
                                 </Form.Group>
                             )}

                        </Col>
                    </Row>

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>Hủy</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : (isEditing ? 'Lưu Thay Đổi' : 'Thêm Khuyến Mãi')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}


// --- Component Trang Chính ---
function AdminPromotionListPage() {
    const [promotions, setPromotions] = useState([]);
    const [categories, setCategories] = useState([]); // Dùng cho modal form
    const [menuItems, setMenuItems] = useState([]);   // Dùng cho modal form (cần load nhiều)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [searchParams, setSearchParams] = useSearchParams();
    const [processingId, setProcessingId] = useState(null);

    // --- State bộ lọc ---
    const [filterActive, setFilterActive] = useState(searchParams.get('is_active') || '');
    const [filterType, setFilterType] = useState(searchParams.get('type') || '');
    const [filterScope, setFilterScope] = useState(searchParams.get('scope') || '');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    // State cho Modal
    const [showModal, setShowModal] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);

    const currentPage = parseInt(searchParams.get('page') || '1');

    // --- Fetch Categories & MenuItems (chỉ gọi 1 lần hoặc khi cần) ---
    const loadSupportData = useCallback(async () => {
        try {
            const [catRes, itemRes] = await Promise.all([
                adminCategoryService.getCategories({ per_page: -1 }), // Lấy hết category
                 // Lấy hết menu items? --> Có thể rất nhiều, nên có cơ chế search/select tốt hơn trong modal
                 // Tạm thời lấy 100 món đầu
                 adminMenuItemService.getMenuItems({ per_page: 100, sort_by: 'name', sort_dir: 'asc' })
            ]);
             if (catRes.data?.success) setCategories(catRes.data.data || []);
             if (itemRes.data?.success) setMenuItems(itemRes.data.data.data || []); // Lấy từ data.data của pagination
        } catch (err) { console.error("Error loading support data for promo form:", err); }
    }, []);
     useEffect(() => { loadSupportData(); }, [loadSupportData]);


    // --- Hàm Fetch Promotions ---
    const fetchPromotions = useCallback(async (page, filters) => {
        setLoading(true); setError(null);
        try {
            const params = { page, search: filters.search || undefined, is_active: filters.active === '' ? undefined : filters.active, type: filters.type || undefined, scope: filters.scope || undefined, sort_by: 'created_at', sort_dir: 'desc', per_page: 15, };
             Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
            const response = await adminPromotionService.getPromotions(params);
            if (response.data?.success) { setPromotions(response.data.data.data || []); setPagination({ /* ... */ }); }
            else { setError(response.data?.message || 'Lỗi tải KM.'); setPromotions([]); setPagination({ current_page: 1, last_page: 1, total: 0 }); }
        } catch (err) { if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); } setPromotions([]); setPagination({ current_page: 1, last_page: 1, total: 0 }); }
        finally { setLoading(false); }
    }, []);

    // --- useEffect gọi fetch khi trang hoặc filter thay đổi ---
    useEffect(() => {
        const s = searchParams.get('search')||''; const a = searchParams.get('is_active')||''; const t = searchParams.get('type')||''; const sc = searchParams.get('scope')||'';
        setSearchTerm(s); setFilterActive(a); setFilterType(t); setFilterScope(sc);
        fetchPromotions(currentPage, { search: s, active: a, type: t, scope: sc });
    }, [searchParams, fetchPromotions, currentPage]);

    // --- Handlers Modal ---
    const handleShowAddModal = () => { setEditingPromotion(null); setShowModal(true); };
    const handleShowEditModal = async (promotion) => {
         // Cần load chi tiết promotion (bao gồm cả categories/menuItems đã liên kết) trước khi mở modal sửa
         setProcessingId(promotion.id); // Hiển thị loading tạm thời trên dòng đó
         setError(null);
         try {
              const response = await adminPromotionService.getPromotionDetail(promotion.id);
              if(response.data?.success){
                   setEditingPromotion(response.data.data); // Truyền dữ liệu đầy đủ vào modal
                   setShowModal(true);
              } else {
                   alert("Lỗi: Không tải được chi tiết khuyến mãi.");
              }
         } catch(err){
              alert(`Lỗi tải chi tiết: ${err.response?.data?.message || err.message}`);
         } finally {
              setProcessingId(null);
         }
    };
    const handleCloseModal = () => { setShowModal(false); setEditingPromotion(null); };
    const handleSaveSuccess = () => { fetchPromotions(currentPage, { search: searchTerm, active: filterActive, type: filterType, scope: filterScope }); };

    // --- Handler Xóa ---
    const handleDelete = async (promo) => {
        if (!promo || processingId === promo.id) return;
        if (window.confirm(`Xóa khuyến mãi "${promo.code}"?`)) {
            setProcessingId(promo.id); setError(null);
            try {
                await adminPromotionService.deletePromotion(promo.id);
                alert('Xóa KM thành công!');
                if(promotions.length === 1 && currentPage > 1){ handlePageChange(currentPage - 1); }
                else { fetchPromotions(currentPage, { search: searchTerm, active: filterActive, type: filterType, scope: filterScope }); }
            } catch (err) {
                 alert(`Lỗi xóa: ${err.response?.data?.message || err.message}`);
                 setError(`Lỗi xóa: ${err.response?.data?.message || err.message}`);
            } finally { setProcessingId(null); }
        }
    };

    // --- Handlers Tìm kiếm & Lọc ---
     const handleSearchChange = (e) => setSearchTerm(e.target.value);
     const handleFilterChange = (e) => {
         const { name, value } = e.target;
         if (name === 'is_active') setFilterActive(value);
         if (name === 'type') setFilterType(value);
         if (name === 'scope') setFilterScope(value);
     };
     const applyFilters = () => { /* ... (cập nhật searchParams như trước) ... */ };
      const clearFilters = () => { setSearchTerm(''); setFilterActive(''); setFilterType(''); setFilterScope(''); setSearchParams({ page: '1' }); };

    // --- Handler Phân Trang ---
    const handlePageChange = (pageNumber) => { /* ... */ };
    // --- Render Phân Trang ---
    const renderPagination = () => { /* ... */ };

    // --- Format ngày giờ ---
     const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '-';
        try { return new Date(dateTimeString).toLocaleString('vi-VN'); }
        catch { return dateTimeString; }
     };


    // ---- Render ----
    return (
        <Container fluid className="py-3">
            <Card className="shadow-sm">
                <Card.Header as="h5" className="bg-purple text-white d-flex justify-content-between align-items-center"> {/* Màu khác */}
                    Quản Lý Khuyến Mãi
                    <Button variant="light" size="sm" onClick={handleShowAddModal}> <i className="bi bi-plus-circle-fill me-1"></i> Thêm KM Mới </Button>
                </Card.Header>
                <Card.Body>
                    {/* --- Bộ lọc --- */}
                    <Form className="mb-3 p-3 bg-light border rounded">
                         <Row className="g-2 align-items-end">
                             <Col md={3} xl={3}>
                                <Form.Group controlId="searchPromo">
                                    <Form.Label className='small mb-1 fw-semibold'>Tìm Code/Mô tả</Form.Label>
                                    <InputGroup size="sm"> {/* ... input và nút ... */} </InputGroup>
                                </Form.Group>
                            </Col>
                             <Col md={2} xl={2}>
                                <Form.Group controlId="filterPromoActive">
                                    <Form.Label className='small mb-1 fw-semibold'>Trạng thái</Form.Label>
                                    <Form.Select size="sm" name="is_active" value={filterActive} onChange={handleFilterChange} disabled={loading}>
                                        <option value="">Tất cả</option>
                                        <option value="1">Đang hoạt động</option>
                                        <option value="0">Không hoạt động</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                             <Col md={2} xl={2}>
                                <Form.Group controlId="filterPromoType">
                                    <Form.Label className='small mb-1 fw-semibold'>Loại giảm</Form.Label>
                                    <Form.Select size="sm" name="type" value={filterType} onChange={handleFilterChange} disabled={loading}>
                                         <option value="">Tất cả</option>
                                         <option value="percentage">Theo %</option>
                                         <option value="fixed_amount">Tiền cố định</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                              <Col md={2} xl={2}>
                                <Form.Group controlId="filterPromoScope">
                                    <Form.Label className='small mb-1 fw-semibold'>Phạm vi</Form.Label>
                                     <Form.Select size="sm" name="scope" value={filterScope} onChange={handleFilterChange} disabled={loading}>
                                         <option value="">Tất cả</option>
                                         <option value="all">Toàn bộ đơn</option>
                                         <option value="categories">Theo danh mục</option>
                                         <option value="menu_items">Theo món ăn</option>
                                     </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md="auto" className="mt-3 mt-md-0"> {/* ... nút lọc/xóa lọc ... */} </Col>
                        </Row>
                    </Form>

                    {/* --- Hiển thị Loading/Error/Danh sách --- */}
                    {loading && <div className="text-center my-5"><Spinner animation="border" variant="primary"/></div>}
                    {error && !loading && <Alert variant="danger">Lỗi: {error}</Alert>}
                    {!loading && !error && promotions.length === 0 && ( <Alert variant="light" className='text-center border'>Không tìm thấy khuyến mãi nào.</Alert> )}
                    {!loading && !error && promotions.length > 0 && (
                        <>
                            <Table responsive striped bordered hover size="sm" className="align-middle">
                                <thead className='table-light'>
                                    <tr>
                                        {/* <th>ID</th> */}
                                        <th>Code</th>
                                        <th>Mô tả</th>
                                        <th className='text-center'>Loại</th>
                                        <th className='text-end'>Giá trị</th>
                                        <th className='text-center'>Phạm vi</th>
                                        <th>Hiệu lực</th>
                                        <th className='text-center'>Lượt dùng</th>
                                        <th className='text-center'>Active</th>
                                        <th className='text-center' style={{ width: '100px' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotions.map(promo => {
                                        const isProcessing = processingId === promo.id;
                                        const isExpired = new Date(promo.end_date) < new Date();
                                        return (
                                            <tr key={promo.id} className={isExpired ? 'text-muted' : ''}>
                                                {/* <td>{promo.id}</td> */}
                                                <td><code className='fw-bold'>{promo.code}</code></td>
                                                <td className='small'>{promo.description || '-'}</td>
                                                <td className='text-center'><Badge bg={promo.type === 'percentage' ? 'info' : 'success'} pill>{promo.type === 'percentage' ? '%' : 'Tiền'}</Badge></td>
                                                <td className='text-end fw-medium'>{promo.type === 'percentage' ? `${parseFloat(promo.value)}%` : `${parseInt(promo.value).toLocaleString('vi-VN')} đ`}</td>
                                                <td className='text-center small'>{promo.applicable_scope}</td>
                                                <td className='small'>{formatDateTime(promo.start_date)}<br/>{formatDateTime(promo.end_date)}</td>
                                                <td className='text-center'>{promo.uses_count} / {promo.max_uses ?? '∞'}</td>
                                                <td className='text-center'>{promo.is_active ? <i className="bi bi-check-circle-fill text-success"></i> : <i className="bi bi-x-circle-fill text-danger"></i>}</td>
                                                <td className='text-center'>
                                                     <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Sửa")}>
                                                         <Button variant="outline-primary" size="sm" onClick={() => handleShowEditModal(promo)} className="me-1 px-1 py-0" disabled={isProcessing}>{isProcessing ? <Spinner size="sm"/> : <i className="bi bi-pencil-fill"></i>}</Button>
                                                     </OverlayTrigger>
                                                     <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Xóa")}>
                                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(promo)} className="px-1 py-0" disabled={isProcessing}> {isProcessing ? <Spinner size="sm"/> : <i className="bi bi-trash-fill"></i>} </Button>
                                                     </OverlayTrigger>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                            {renderPagination()}
                         </>
                    )}
                </Card.Body>
            </Card>

             {/* --- Modal Thêm/Sửa --- */}
             {showModal && (
                <PromotionFormModal
                    show={showModal}
                    handleClose={handleCloseModal}
                    currentPromotion={editingPromotion}
                    categories={categories} // Truyền danh sách category
                    menuItems={menuItems}   // Truyền danh sách menu item
                    onSaveSuccess={handleSaveSuccess}
                />
            )}

        </Container>
    );
}

// Helper format ngày giờ (nên đưa ra utils)
const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    try { return new Date(dateTimeString).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}); }
    catch { return dateTimeString; }
};

export default AdminPromotionListPage;

// --- Cần tạo service ---
// src/services/admin.promotion.service.js
/*
import apiClient from './api';
const getPromotions = (params={}) => apiClient.get('/admin/promotions', {params});
const getPromotionDetail = (id) => apiClient.get(`/admin/promotions/${id}`); // Cần API này để load data cho form sửa
const createPromotion = (data) => apiClient.post('/admin/promotions', data);
const updatePromotion = (id, data) => apiClient.patch(`/admin/promotions/${id}`, data); // Hoặc PUT/POST
const deletePromotion = (id) => apiClient.delete(`/admin/promotions/${id}`);
export const adminPromotionService = { getPromotions, getPromotionDetail, createPromotion, updatePromotion, deletePromotion };
*/