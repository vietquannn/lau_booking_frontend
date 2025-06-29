// src/pages/admin/AdminTableListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Table, Spinner, Alert, Pagination, Form, Row, Col, Badge, InputGroup, Tooltip, OverlayTrigger, Modal } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom'; // Thêm Link nếu cần
import { adminTableService } from '../../services/admin.table.service'; // <<--- TẠO SERVICE NÀY
import { adminTableTypeService } from '../../services/admin.tabletype.service'; // Để lấy danh sách loại bàn cho bộ lọc & form
import { useAuthAdmin } from '../../hooks/useAuthAdmin'; // Optional

// --- Tooltip Component ---
const renderTooltip = (props, text) => ( <Tooltip {...props}>{text}</Tooltip> );

// --- Modal Thêm/Sửa Bàn ---
// (Component này có thể tách ra file riêng src/components/admin/TableFormModal.jsx)
function TableFormModal({ show, handleClose, currentTable, tableTypes, onSaveSuccess }) {
    const initialFormData = {
        table_number: '',
        table_type_id: '',
        capacity: '',
        status: 'available', // Mặc định là available
        location_description: '',
    };
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const isEditing = !!currentTable;

    useEffect(() => {
        if (show) {
            if (isEditing && currentTable) {
                setFormData({
                    table_number: currentTable.table_number || '',
                    table_type_id: currentTable.table_type_id || '',
                    capacity: currentTable.capacity || '',
                    status: currentTable.status || 'available', // Lấy status hiện tại
                    location_description: currentTable.location_description || '',
                });
            } else {
                setFormData(initialFormData); // Reset form cho thêm mới
            }
            setError(null); setValidationErrors({}); setLoading(false);
        }
    }, [currentTable, isEditing, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: null }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(null); setValidationErrors({});

        // Đảm bảo capacity là số nguyên
        const dataToSend = {
            ...formData,
            capacity: parseInt(formData.capacity) || 0,
            // Không gửi status occupied/reserved từ form này
             status: formData.status === 'maintenance' ? 'maintenance' : 'available',
        };

        // Bỏ qua status nếu là editing và không phải available/maintenance? (Tuỳ logic)
         if (isEditing && currentTable && !['available', 'maintenance'].includes(dataToSend.status)) {
             // delete dataToSend.status; // Không cho update status khác ở đây
         }


        console.log("Submitting Table Data:", dataToSend);

        try {
            let response;
            if (isEditing) {
                // Gọi API Update Table (cần id)
                response = await adminTableService.updateTable(currentTable.id, dataToSend);
            } else {
                // Gọi API Create Table
                response = await adminTableService.createTable(dataToSend);
            }
            if (response.data?.success) {
                alert(isEditing ? 'Cập nhật bàn thành công!' : 'Thêm bàn thành công!');
                onSaveSuccess(); handleClose();
            } else { setError(response.data?.message || 'Có lỗi xảy ra.'); setLoading(false); }
        } catch (err) {
             console.error("Table form error:", err);
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
            <Modal.Header closeButton><Modal.Title>{isEditing ? 'Sửa Thông Tin Bàn' : 'Thêm Bàn Mới'}</Modal.Title></Modal.Header>
            <Form onSubmit={handleSubmit} noValidate>
                <Modal.Body>
                    {error && <Alert variant="danger" size="sm">{error}</Alert>}
                    <Row>
                        <Col md={6}>
                             <Form.Group className="mb-3" controlId="tableNumber">
                                <Form.Label>Số Bàn <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="table_number" value={formData.table_number} onChange={handleChange} required disabled={loading} isInvalid={!!validationErrors.table_number} placeholder="Ví dụ: T01, V02, W03..."/>
                                <Form.Control.Feedback type="invalid">{validationErrors.table_number?.[0]}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                         <Col md={6}>
                            <Form.Group className="mb-3" controlId="tableCapacity">
                                <Form.Label>Sức chứa (người) <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" required disabled={loading} isInvalid={!!validationErrors.capacity}/>
                                <Form.Control.Feedback type="invalid">{validationErrors.capacity?.[0]}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                     <Form.Group className="mb-3" controlId="tableType">
                        <Form.Label>Loại Bàn <span className="text-danger">*</span></Form.Label>
                        <Form.Select name="table_type_id" value={formData.table_type_id} onChange={handleChange} required disabled={loading || tableTypes.length === 0} isInvalid={!!validationErrors.table_type_id}>
                            <option value="">-- Chọn loại bàn --</option>
                            {tableTypes.map(type => <option key={type.id} value={type.id}>{type.name} {type.surcharge > 0 ? `(+${parseInt(type.surcharge).toLocaleString('vi-VN')}đ)`: ''}</option>)}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{validationErrors.table_type_id?.[0]}</Form.Control.Feedback>
                    </Form.Group>
                    {/* Chỉ cho phép đặt là Available hoặc Maintenance khi thêm/sửa cơ bản */}
                    <Form.Group className="mb-3" controlId="tableStatusBasic">
                        <Form.Label>Trạng Thái Ban Đầu</Form.Label>
                         <Form.Select name="status" value={formData.status} onChange={handleChange} disabled={loading} isInvalid={!!validationErrors.status}>
                             <option value="available">Sẵn sàng (Available)</option>
                             <option value="maintenance">Bảo trì (Maintenance)</option>
                             {/* Không hiện reserved/occupied ở đây */}
                         </Form.Select>
                         <Form.Control.Feedback type="invalid">{validationErrors.status?.[0]}</Form.Control.Feedback>
                          <Form.Text muted>Các trạng thái "Đã đặt" hoặc "Đang dùng" sẽ được cập nhật tự động.</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="tableLocation">
                        <Form.Label>Mô tả vị trí (Tùy chọn)</Form.Label>
                        <Form.Control as="textarea" rows={2} name="location_description" value={formData.location_description} onChange={handleChange} disabled={loading} isInvalid={!!validationErrors.location_description} placeholder="Ví dụ: Gần cửa sổ tầng 2, khu sân vườn..."/>
                         <Form.Control.Feedback type="invalid">{validationErrors.location_description?.[0]}</Form.Control.Feedback>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>Hủy</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : (isEditing ? 'Lưu Thay Đổi' : 'Thêm Bàn')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}


// --- Component Trang Chính ---
function AdminTableListPage() {
    const [tables, setTables] = useState([]);
    const [tableTypes, setTableTypes] = useState([]); // Danh sách loại bàn để lọc/dùng trong modal
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [searchParams, setSearchParams] = useSearchParams();

    // --- State bộ lọc ---
    const [filterType, setFilterType] = useState(searchParams.get('table_type_id') || '');
    const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
    const [filterCapacity, setFilterCapacity] = useState(searchParams.get('capacity') || '');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    // State cho Modal
    const [showModal, setShowModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [processingId, setProcessingId] = useState(null); // ID bàn đang xóa hoặc đổi status

    const currentPage = parseInt(searchParams.get('page') || '1');

    // --- Hàm Fetch Table Types (chỉ gọi 1 lần) ---
     const fetchAllTableTypes = useCallback(async () => {
        try {
             const response = await adminTableTypeService.getTableTypes({ per_page: -1 }); // Lấy hết
             if (response.data?.success) { setTableTypes(response.data.data || []); }
             else { console.warn("Could not fetch table types"); }
        } catch (err) { console.error("Error fetching all table types:", err); }
     }, []);

     useEffect(() => { fetchAllTableTypes(); }, [fetchAllTableTypes]);

    // --- Hàm Fetch Tables ---
    const fetchTables = useCallback(async (page, filters) => {
        setLoading(true); setError(null);
        try {
            const params = {
                page,
                search: filters.search || undefined,
                table_type_id: filters.type || undefined,
                status: filters.status || undefined,
                capacity: filters.capacity || undefined,
                sort_by: 'table_number', // Mặc định sort theo số bàn
                sort_dir: 'asc',
                per_page: 15,
            };
             Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await adminTableService.getTables(params); // Gọi service
            if (response.data?.success) {
                // Lấy dữ liệu từ API
                let tablesData = response.data.data.data || [];
                
                // Sắp xếp dữ liệu theo ID từ bé đến lớn
                tablesData = [...tablesData].sort((a, b) => a.id - b.id);
                
                // Cập nhật state với dữ liệu đã sắp xếp
                setTables(tablesData);
                
                // Cập nhật thông tin phân trang từ API response
                const paginationData = response.data.data;
                setPagination({
                    current_page: paginationData.current_page || 1,
                    last_page: paginationData.last_page || 1,
                    total: paginationData.total || 0,
                    per_page: paginationData.per_page || 15,
                    from: paginationData.from || 0,
                    to: paginationData.to || 0
                });
            } else { setError(response.data?.message || 'Lỗi tải danh sách bàn.'); setTables([]); setPagination({ current_page: 1, last_page: 1, total: 0 }); }
        } catch (err) {
            if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); }
            setTables([]); setPagination({ current_page: 1, last_page: 1, total: 0 });
        } finally { setLoading(false); }
    }, []);

    // --- useEffect gọi fetch khi trang hoặc filter thay đổi ---
    useEffect(() => {
        const currentSearch = searchParams.get('search') || '';
        const currentType = searchParams.get('table_type_id') || '';
        const currentStatus = searchParams.get('status') || '';
        const currentCapacity = searchParams.get('capacity') || '';

        setSearchTerm(currentSearch);
        setFilterType(currentType);
        setFilterStatus(currentStatus);
        setFilterCapacity(currentCapacity);

        fetchTables(currentPage, { search: currentSearch, type: currentType, status: currentStatus, capacity: currentCapacity });
    }, [searchParams, fetchTables, currentPage]); // Thêm currentPage


    // --- Handlers Modal ---
    const handleShowAddModal = () => { setEditingTable(null); setShowModal(true); };
    const handleShowEditModal = (table) => { setEditingTable(table); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setEditingTable(null); };
    const handleSaveSuccess = () => { fetchTables(currentPage, { search: searchTerm, type: filterType, status: filterStatus, capacity: filterCapacity }); }; // Load lại

    // --- Handler Xóa ---
    const handleDelete = async (table) => {
        if (!table || processingId === table.id) return;
        if (window.confirm(`Xóa bàn "${table.table_number}"?`)) {
            setProcessingId(table.id); setError(null);
            try {
                await adminTableService.deleteTable(table.id);
                alert('Xóa bàn thành công!');
                if(tables.length === 1 && currentPage > 1){ handlePageChange(currentPage - 1); }
                else { fetchTables(currentPage, { search: searchTerm, type: filterType, status: filterStatus, capacity: filterCapacity }); }
            } catch (err) {
                 alert(`Lỗi xóa: ${err.response?.data?.message || err.message}`);
                 setError(`Lỗi xóa: ${err.response?.data?.message || err.message}`);
            } finally { setProcessingId(null); }
        }
    };

    // --- Handler Cập nhật Trạng thái (Maintenance/Available) ---
    const handleUpdateStatus = async (table, newStatus) => {
         if (!table || processingId === table.id || !['available', 'maintenance'].includes(newStatus)) return;
         const confirmMsg = newStatus === 'maintenance'
            ? `Chuyển bàn "${table.table_number}" sang trạng thái BẢO TRÌ? (Sẽ không thể đặt bàn này)`
            : `Chuyển bàn "${table.table_number}" sang trạng thái SẴN SÀNG?`;

         if(window.confirm(confirmMsg)){
              setProcessingId(table.id); setError(null);
              try {
                   await adminTableService.updateTableStatus(table.id, newStatus);
                   alert('Cập nhật trạng thái bàn thành công!');
                   fetchTables(currentPage, { search: searchTerm, type: filterType, status: filterStatus, capacity: filterCapacity });
              } catch(err) {
                   alert(`Lỗi cập nhật trạng thái: ${err.response?.data?.message || err.message}`);
                   setError(`Lỗi cập nhật trạng thái: ${err.response?.data?.message || err.message}`);
              } finally {
                   setProcessingId(null);
              }
         }
    };


    // --- Handlers Tìm kiếm & Lọc ---
     const handleSearchChange = (e) => setSearchTerm(e.target.value);
     const handleFilterChange = (e) => { // Dùng chung
         const { name, value } = e.target;
         if (name === 'table_type_id') setFilterType(value);
         if (name === 'status') setFilterStatus(value);
         if (name === 'capacity') setFilterCapacity(value);
     };
     const applyFilters = () => {
         const newSearchParams = new URLSearchParams();
         if (searchTerm.trim()) newSearchParams.set('search', searchTerm.trim());
         if (filterType) newSearchParams.set('table_type_id', filterType);
         if (filterStatus) newSearchParams.set('status', filterStatus);
         if (filterCapacity) newSearchParams.set('capacity', filterCapacity);
         newSearchParams.set('page', '1');
         setSearchParams(newSearchParams);
     };
      const clearFilters = () => {
         setSearchTerm(''); setFilterType(''); setFilterStatus(''); setFilterCapacity('');
         setSearchParams({ page: '1' });
     };


    // --- Handler Phân Trang ---
    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > pagination.last_page || pageNumber === currentPage) return;
        
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', pageNumber.toString());
        setSearchParams(newSearchParams);
    };

    // --- Render Phân Trang ---
    const renderPagination = () => {
        if (pagination.last_page <= 1) return null;

        const { current_page, last_page, total, from, to } = pagination;
        const items = [];

        // Nút Previous
        items.push(
            <Pagination.Prev
                key="prev"
                onClick={() => handlePageChange(current_page - 1)}
                disabled={current_page === 1}
            />
        );

        // Hiển thị các trang
        const maxVisiblePages = 5;
        let startPage = Math.max(1, current_page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(last_page, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Nút First Page nếu cần
        if (startPage > 1) {
            items.push(
                <Pagination.Item
                    key={1}
                    onClick={() => handlePageChange(1)}
                >
                    1
                </Pagination.Item>
            );
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="ellipsis1" />);
            }
        }

        // Các trang chính
        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <Pagination.Item
                    key={page}
                    active={page === current_page}
                    onClick={() => handlePageChange(page)}
                >
                    {page}
                </Pagination.Item>
            );
        }

        // Nút Last Page nếu cần
        if (endPage < last_page) {
            if (endPage < last_page - 1) {
                items.push(<Pagination.Ellipsis key="ellipsis2" />);
            }
            items.push(
                <Pagination.Item
                    key={last_page}
                    onClick={() => handlePageChange(last_page)}
                >
                    {last_page}
                </Pagination.Item>
            );
        }

        // Nút Next
        items.push(
            <Pagination.Next
                key="next"
                onClick={() => handlePageChange(current_page + 1)}
                disabled={current_page === last_page}
            />
        );

        return (
            <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted small">
                    Hiển thị {from} - {to} trong tổng số {total} bàn
                </div>
                <Pagination className="mb-0">
                    {items}
                </Pagination>
            </div>
        );
    };

    // Hàm lấy variant màu cho status bàn
     const getTableStatusVariant = (status) => {
        switch (status) {
            case 'available': return 'success';
            case 'reserved': return 'warning';
            case 'occupied': return 'danger';
            case 'maintenance': return 'secondary';
            default: return 'light';
        }
     };
     // Hàm dịch status bàn
      const translateTableStatus = (status) => {
         const map = { available: 'Sẵn sàng', reserved: 'Đã đặt', occupied: 'Đang dùng', maintenance: 'Bảo trì'};
         return map[status] || status;
      };


    // ---- Render ----
    return (
        <Container fluid className="py-3">
            <Card className="shadow-sm">
                <Card.Header as="h5" className="bg-secondary text-white d-flex justify-content-between align-items-center"> {/* Đổi màu header */}
                    Quản Lý Bàn
                    <Button variant="light" size="sm" onClick={handleShowAddModal}>
                        <i className="bi bi-plus-circle-fill me-1"></i> Thêm Bàn Mới
                    </Button>
                </Card.Header>
                <Card.Body>
                    {/* --- Bộ lọc --- */}
                    <Form className="mb-3 p-3 bg-light border rounded">
                        <Row className="g-2 align-items-end">
                            <Col md={3} xl={3}>
                                <Form.Group controlId="searchTable">
                                     <Form.Label className='small mb-1 fw-semibold'>Tìm số bàn</Form.Label>
                                     <InputGroup size="sm">
                                        <Form.Control type="text" placeholder="Nhập số bàn..." value={searchTerm} onChange={handleSearchChange}/>
                                        {searchTerm && <Button variant="outline-secondary" onClick={clearFilters} title="Xóa"><i className="bi bi-x-lg"></i></Button>}
                                     </InputGroup>
                                </Form.Group>
                            </Col>
                             <Col md={3} xl={2}>
                                <Form.Group controlId="filterTableType">
                                    <Form.Label className='small mb-1 fw-semibold'>Loại bàn</Form.Label>
                                    <Form.Select size="sm" name="table_type_id" value={filterType} onChange={handleFilterChange} disabled={loading}>
                                        <option value="">Tất cả</option>
                                        {tableTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                             <Col md={2} xl={2}>
                                <Form.Group controlId="filterTableStatus">
                                    <Form.Label className='small mb-1 fw-semibold'>Trạng thái</Form.Label>
                                    <Form.Select size="sm" name="status" value={filterStatus} onChange={handleFilterChange} disabled={loading}>
                                        <option value="">Tất cả</option>
                                        <option value="available">Sẵn sàng</option>
                                        <option value="reserved">Đã đặt</option>
                                        <option value="occupied">Đang dùng</option>
                                        <option value="maintenance">Bảo trì</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2} xl={2}>
                                <Form.Group controlId="filterCapacity">
                                    <Form.Label className='small mb-1 fw-semibold'>Sức chứa ≥</Form.Label>
                                    <Form.Control type="number" placeholder="Số khách..." size="sm" name="capacity" value={filterCapacity} onChange={handleFilterChange} min="1" disabled={loading}/>
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
                    {loading && <div className="text-center my-5"><Spinner animation="border" variant="secondary"/></div>}
                    {error && !loading && <Alert variant="danger">Lỗi: {error}</Alert>}
                    {!loading && !error && tables.length === 0 && ( <Alert variant="light" className='text-center border'>Không tìm thấy bàn nào.</Alert> )}
                    {!loading && !error && tables.length > 0 && (
                        <>
                            <Table responsive striped bordered hover size="sm" className="align-middle">
                                <thead className='table-light'>
                                    <tr>
                                        <th>ID</th>
                                        <th>Số Bàn</th>
                                        <th>Loại Bàn</th>
                                        <th className='text-center'>Sức Chứa</th>
                                        <th>Vị Trí</th>
                                        <th className='text-center'>Trạng Thái</th>
                                        <th className='text-center' style={{ width: '120px' }}>Hành động</th> {/* Tăng độ rộng */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tables.map(table => {
                                        const isProcessing = processingId === table.id;
                                        return (
                                            <tr key={table.id}>
                                                <td>{table.id}</td>
                                                <td className="fw-medium">{table.table_number}</td>
                                                <td>{tableTypes.find(type => type.id === table.table_type_id)?.name || '-'}</td>
                                                <td className='text-center'>{table.capacity}</td>
                                                <td className="text-muted small">{table.location_description || '-'}</td>
                                                <td className='text-center'>
                                                    <Badge bg={getTableStatusVariant(table.status)} pill>{translateTableStatus(table.status)}</Badge>
                                                </td>
                                                <td className='text-center'>
                                                     {/* Nút Sửa */}
                                                     <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Sửa")}>
                                                        <Button variant="outline-primary" size="sm" onClick={() => handleShowEditModal(table)} className="me-1 px-1 py-0" disabled={isProcessing}> <i className="bi bi-pencil-fill"></i> </Button>
                                                     </OverlayTrigger>
                                                     {/* Nút Bảo trì/Sẵn sàng */}
                                                     {table.status === 'available' && (
                                                          <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Bảo trì")}>
                                                            <Button variant="outline-warning" size="sm" onClick={() => handleUpdateStatus(table, 'maintenance')} className="me-1 px-1 py-0" disabled={isProcessing}>{isProcessing ? <Spinner size="sm"/> : <i className="bi bi-tools"></i>}</Button>
                                                         </OverlayTrigger>
                                                     )}
                                                     {table.status === 'maintenance' && (
                                                         <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Sẵn sàng")}>
                                                            <Button variant="outline-success" size="sm" onClick={() => handleUpdateStatus(table, 'available')} className="me-1 px-1 py-0" disabled={isProcessing}>{isProcessing ? <Spinner size="sm"/> : <i className="bi bi-check-circle-fill"></i>}</Button>
                                                         </OverlayTrigger>
                                                     )}
                                                     {/* Nút Xóa */}
                                                     <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, "Xóa")}>
                                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(table)} className="px-1 py-0" disabled={isProcessing || ['reserved', 'occupied'].includes(table.status)}> {/* Disable nếu đang dùng */}
                                                            {isProcessing ? <Spinner size="sm"/> : <i className="bi bi-trash-fill"></i>}
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

            {/* --- Modal Thêm/Sửa --- */}
            {showModal && (
                <TableFormModal
                    show={showModal}
                    handleClose={handleCloseModal}
                    currentTable={editingTable}
                    tableTypes={tableTypes} // Truyền danh sách loại bàn vào modal
                    onSaveSuccess={handleSaveSuccess}
                />
            )}

        </Container>
    );
}

export default AdminTableListPage;

// Cần tạo service admin.table.service.js
/*
// src/services/admin.table.service.js
import apiClient from './api';
const getTables = (params = {}) => apiClient.get('/admin/tables', { params });
const createTable = (data) => apiClient.post('/admin/tables', data);
const updateTable = (id, data) => apiClient.patch(`/admin/tables/${id}`, data); // Hoặc PUT/POST với _method
const deleteTable = (id) => apiClient.delete(`/admin/tables/${id}`);
const updateTableStatus = (id, status) => apiClient.patch(`/admin/tables/${id}/update-status`, { status });
export const adminTableService = { getTables, createTable, updateTable, deleteTable, updateTableStatus };
*/