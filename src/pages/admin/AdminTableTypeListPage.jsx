// src/pages/admin/AdminTableTypeListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Table, Spinner, Alert, Modal, Form, InputGroup, Pagination, Tooltip, OverlayTrigger, Row, Col } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom'; // Dùng để quản lý state trên URL (nếu cần phân trang/lọc)
import { adminTableTypeService } from '../../services/admin.tabletype.service'; // <<--- TẠO SERVICE NÀY
import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // Kiểm tra đăng nhập Admin (optional)
// --- Tooltip Component ---
const renderTooltip = (props, text) => ( <Tooltip {...props}>{text}</Tooltip> );

// --- Modal Thêm/Sửa Loại Bàn ---
// (Component này giống hệt CategoryFormModal, chỉ đổi tên biến và service gọi)
function TableTypeFormModal({ show, handleClose, currentTableType, onSaveSuccess }) {
    const [formData, setFormData] = useState({ name: '', description: '', surcharge: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const isEditing = !!currentTableType;

    useEffect(() => {
        if (show) {
            if (isEditing && currentTableType) {
                setFormData({
                    name: currentTableType.name || '',
                    description: currentTableType.description || '',
                    surcharge: currentTableType.surcharge || 0, // Lấy surcharge
                });
            } else {
                setFormData({ name: '', description: '', surcharge: 0 }); // Reset cho form thêm mới
            }
            setError(null); setValidationErrors({}); setLoading(false);
        }
    }, [currentTableType, isEditing, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: null }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(null); setValidationErrors({});
        // Chuyển surcharge thành số trước khi gửi
        const dataToSend = {
            ...formData,
            surcharge: parseFloat(formData.surcharge) || 0 // Đảm bảo là số, mặc định 0 nếu không hợp lệ
        };

        try {
            let response;
            if (isEditing) {
                // Gọi API Update Table Type (cần id)
                response = await adminTableTypeService.updateTableType(currentTableType.id, dataToSend);
            } else {
                // Gọi API Create Table Type
                response = await adminTableTypeService.createTableType(dataToSend);
            }
            if (response.data?.success) {
                alert(isEditing ? 'Cập nhật loại bàn thành công!' : 'Thêm loại bàn thành công!');
                onSaveSuccess(); handleClose();
            } else { setError(response.data?.message || 'Có lỗi xảy ra.'); setLoading(false); }
        } catch (err) {
             console.error("Table Type form error:", err);
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
        <Modal show={show} onHide={handleClose} centered backdrop="static">
            <Modal.Header closeButton><Modal.Title>{isEditing ? 'Sửa Loại Bàn' : 'Thêm Loại Bàn Mới'}</Modal.Title></Modal.Header>
            <Form onSubmit={handleSubmit} noValidate>
                <Modal.Body>
                    {error && <Alert variant="danger" size="sm">{error}</Alert>}
                    <Form.Group className="mb-3" controlId="tableTypeName">
                        <Form.Label>Tên Loại Bàn <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required disabled={loading} isInvalid={!!validationErrors.name} placeholder="Ví dụ: VIP Ngoài Trời"/>
                        <Form.Control.Feedback type="invalid">{validationErrors.name?.[0]}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="tableTypeDescription">
                        <Form.Label>Mô tả</Form.Label>
                        <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} disabled={loading} isInvalid={!!validationErrors.description} placeholder="Mô tả ngắn..."/>
                        <Form.Control.Feedback type="invalid">{validationErrors.description?.[0]}</Form.Control.Feedback>
                    </Form.Group>
                     <Form.Group className="mb-3" controlId="tableTypeSurcharge">
                        <Form.Label>Phụ Phí</Form.Label>
                         <InputGroup>
                            <Form.Control type="number" name="surcharge" value={formData.surcharge} onChange={handleChange} min="0" step="1000" disabled={loading} isInvalid={!!validationErrors.surcharge}/>
                             <InputGroup.Text>đ</InputGroup.Text>
                             <Form.Control.Feedback type="invalid">{validationErrors.surcharge?.[0]}</Form.Control.Feedback>
                         </InputGroup>
                         <Form.Text muted>Phụ phí sẽ được cộng thêm vào hóa đơn nếu khách chọn loại bàn này (để 0 nếu không có).</Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>Hủy</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : (isEditing ? 'Lưu Thay Đổi' : 'Thêm Loại Bàn')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}


// --- Component Trang Chính ---
function AdminTableTypeListPage() {
    const [searchParams] = useSearchParams();
    const [tableTypes, setTableTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Không cần phân trang cho loại bàn vì thường ít
    // const [pagination, setPagination] = useState({});
    // const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');

    // State cho Modal
    const [showModal, setShowModal] = useState(false);
    const [editingTableType, setEditingTableType] = useState(null);
    const [deletingId, setDeletingId] = useState(null); // State khi đang xóa

    // --- Hàm Fetch Table Types ---
    const fetchTableTypes = useCallback(async (search) => {
        setLoading(true); setError(null);
        try {
            const params = { search: search || undefined }; // Chỉ gửi search nếu có giá trị
            const response = await adminTableTypeService.getTableTypes(params); // Gọi service
            if (response.data?.success) {
                setTableTypes(response.data.data || []); // API Index của loại bàn thường trả về mảng trực tiếp
                 // Reset phân trang nếu có
                 // setPagination({});
            } else {
                 setError(response.data?.message || 'Lỗi tải danh sách loại bàn.');
                 setTableTypes([]);
            }
        } catch (err) {
            console.error("Lỗi tải loại bàn admin:", err);
            if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); }
            setTableTypes([]);
        } finally { setLoading(false); }
    }, []);

    // --- useEffect gọi fetch khi component mount hoặc tìm kiếm thay đổi ---
    useEffect(() => {
        // Chỉ fetch khi searchParams thay đổi (hoặc lần đầu)
        const currentSearch = searchParams.get('search') || '';
        fetchTableTypes(currentSearch);
    }, [searchParams, fetchTableTypes]);

    // --- Handlers cho Modal ---
    const handleShowAddModal = () => { setEditingTableType(null); setShowModal(true); };
    const handleShowEditModal = (type) => { setEditingTableType(type); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setEditingTableType(null); };
    const handleSaveSuccess = () => { fetchTableTypes(searchTerm); }; // Load lại sau khi lưu

    // --- Handler cho việc xóa ---
    const handleDelete = async (type) => {
        if (!type || deletingId === type.id) return;
        if (window.confirm(`Bạn chắc chắn muốn xóa loại bàn "${type.name}"? \nLƯU Ý: Bạn sẽ không thể xóa nếu có bàn đang sử dụng loại này.`)) {
            setDeletingId(type.id); setError(null);
            try {
                await adminTableTypeService.deleteTableType(type.id); // Gọi API xóa bằng ID
                alert('Xóa loại bàn thành công!');
                fetchTableTypes(searchTerm); // Load lại danh sách
            } catch (err) {
                 console.error("Lỗi xóa loại bàn:", err);
                 alert(`Lỗi xóa: ${err.response?.data?.message || err.message}`);
                 setError(`Lỗi xóa: ${err.response?.data?.message || err.message}`); // Hiển thị lỗi trên trang
            } finally {
                setDeletingId(null);
            }
        }
    };

    // --- Handler cho tìm kiếm ---
     const handleSearchChange = (e) => { setSearchTerm(e.target.value); };
     const handleSearchSubmit = (e) => {
         e.preventDefault();
         const newSearchParams = new URLSearchParams(searchParams);
         if (searchTerm.trim()) { newSearchParams.set('search', searchTerm.trim()); }
         else { newSearchParams.delete('search'); }
         // newSearchParams.set('page', '1'); // Nếu có phân trang
         setSearchParams(newSearchParams);
     };
      const clearSearch = () => {
         setSearchTerm('');
         const newSearchParams = new URLSearchParams(searchParams);
         newSearchParams.delete('search');
         // newSearchParams.set('page', '1'); // Nếu có phân trang
         setSearchParams(newSearchParams);
     };

    // ---- Render ----
    return (
        <Container fluid className="py-3">
            <Card className="shadow-sm">
                <Card.Header as="h5" className="bg-info text-white d-flex justify-content-between align-items-center">
                    Quản Lý Loại Bàn
                    <Button variant="light" size="sm" onClick={handleShowAddModal}>
                        <i className="bi bi-plus-circle-fill me-1"></i> Thêm Loại Bàn
                    </Button>
                </Card.Header>
                <Card.Body>
                    {/* Form Tìm kiếm */}
                    <Form onSubmit={handleSearchSubmit} className="mb-3">
                        <Row>
                            <Col md={4}>
                                <InputGroup size="sm">
                                    <Form.Control type="text" placeholder="Tìm theo tên loại bàn..." value={searchTerm} onChange={handleSearchChange}/>
                                    {searchTerm && <Button variant="outline-secondary" onClick={clearSearch} title="Xóa tìm kiếm"><i className="bi bi-x-lg"></i></Button>}
                                    <Button variant="outline-primary" type="submit"><i className="bi bi-search"></i></Button>
                                </InputGroup>
                            </Col>
                        </Row>
                    </Form>

                    {/* Hiển thị Loading/Error/Danh sách */}
                    {loading && <div className="text-center my-5"><Spinner animation="border" variant="info"/></div>}
                    {error && !loading && <Alert variant="danger">Lỗi: {error}</Alert>}
                    {!loading && !error && tableTypes.length === 0 && (
                        <Alert variant="light" className='text-center border'>Không tìm thấy loại bàn nào {searchTerm ? `với từ khóa "${searchTerm}"` : ''}.</Alert>
                    )}
                    {!loading && !error && tableTypes.length > 0 && (
                        <Table responsive striped bordered hover size="sm" className="align-middle">
                            <thead className='table-light'>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên Loại Bàn</th>
                                    <th>Mô Tả</th>
                                    <th className='text-end'>Phụ Phí</th>
                                    <th className='text-center' style={{ width: '100px' }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableTypes.map(type => (
                                    <tr key={type.id}>
                                        <td>{type.id}</td>
                                        <td className="fw-medium">{type.name}</td>
                                        <td className="text-muted small">{type.description || '-'}</td>
                                        <td className='text-end'>{parseInt(type.surcharge || 0).toLocaleString('vi-VN')} đ</td>
                                        <td className='text-center'>
                                            <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Sửa")}>
                                                <Button variant="outline-primary" size="sm" onClick={() => handleShowEditModal(type)} className="me-1 px-1 py-0" disabled={deletingId === type.id}> <i className="bi bi-pencil-fill"></i> </Button>
                                            </OverlayTrigger>
                                            <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Xóa")}>
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(type)} className="px-1 py-0" disabled={deletingId === type.id}>
                                                     {deletingId === type.id ? <Spinner size="sm" animation="border"/> : <i className="bi bi-trash-fill"></i>}
                                                </Button>
                                            </OverlayTrigger>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                     {/* TODO: Thêm phân trang nếu danh sách có thể dài */}
                     {/* {renderPagination()} */}
                </Card.Body>
            </Card>

            {/* --- Modal Thêm/Sửa --- */}
            {/* Render modal chỉ khi showModal=true để useEffect trong modal chạy đúng */}
            {showModal && (
                <TableTypeFormModal
                    show={showModal}
                    handleClose={handleCloseModal}
                    currentTableType={editingTableType}
                    onSaveSuccess={handleSaveSuccess}
                />
            )}

        </Container>
    );
}

export default AdminTableTypeListPage;

// Cần tạo service admin.tabletype.service.js
// Ví dụ nội dung service:
/*
// src/services/admin.tabletype.service.js
import apiClient from './api';

const getTableTypes = (params = {}) => apiClient.get('/admin/table-types', { params });
const createTableType = (data) => apiClient.post('/admin/table-types', data);
const updateTableType = (id, data) => apiClient.patch(`/admin/table-types/${id}`, data); // Hoặc PUT/POST với _method
const deleteTableType = (id) => apiClient.delete(`/admin/table-types/${id}`);

export const adminTableTypeService = { getTableTypes, createTableType, updateTableType, deleteTableType };
*/

// Cần tạo hook useAuthAdmin (hoặc đảm bảo interceptor xử lý token admin đúng)
// Ví dụ hook useAuthAdmin đã được tạo ở các bước trước.