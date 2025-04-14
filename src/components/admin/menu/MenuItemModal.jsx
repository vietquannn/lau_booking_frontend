// // src/components/admin/menu/MenuItemModal.jsx
// import React, { useState, useEffect, useRef } from 'react';
// import { Modal, Button, Form, Spinner, Alert, Row, Col, Image } from 'react-bootstrap';
// import { adminMenuItemService } from '../../../services/admin.menuitem.service'; // Service

// // Base URL ảnh (để hiển thị ảnh cũ)
// const API_IMAGE_BASE_URL = import.meta.env.VITE_API_IMAGE_BASE_URL || 'https://vietquannn.id.vn';

// function MenuItemModal({ show, handleClose, menuItemData, categories = [], onSave }) {
//     const [formData, setFormData] = useState({});
//     const [imagePreview, setImagePreview] = useState(null); // URL xem trước ảnh mới
//     const [imageFile, setImageFile] = useState(null); // File ảnh mới được chọn
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);
//     const [validationErrors, setValidationErrors] = useState({});
//     const isEditing = !!menuItemData?.id;
//     const fileInputRef = useRef(null); // Ref để reset input file

//     // --- Reset form khi mở modal hoặc đổi item ---
//     useEffect(() => {
//         if (show) {
//             setFormData({
//                 name: menuItemData?.name || '',
//                 category_id: menuItemData?.category_id || '', // Cần ID của category
//                 description: menuItemData?.description || '',
//                 price: menuItemData?.price || '',
//                 status: menuItemData?.status || 'available',
//                 is_hot: menuItemData?.is_hot || false,
//                 is_vegetarian: menuItemData?.is_vegetarian || false,
//                 spice_level: menuItemData?.spice_level || 0,
//                 image_url: menuItemData?.image_url || null // Lưu URL ảnh cũ để hiển thị
//             });
//             setImagePreview(null); // Xóa preview cũ
//             setImageFile(null);    // Xóa file cũ
//             if(fileInputRef.current) fileInputRef.current.value = null; // Reset input file
//             setError(null);
//             setValidationErrors({});
//             setLoading(false);
//         }
//     }, [show, menuItemData]);

//     // --- Xử lý thay đổi input form ---
//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         const val = type === 'checkbox' ? checked : value;
//         setFormData(prev => ({ ...prev, [name]: val }));
//         if (validationErrors[name]) {
//             setValidationErrors(prev => ({ ...prev, [name]: null }));
//         }
//          setError(null);
//     };

//      // --- Xử lý chọn file ảnh ---
//     const handleImageChange = (e) => {
//         const file = e.target.files[0];
//         if (file) {
//             // Kiểm tra kích thước và loại file cơ bản phía client
//             if (file.size > 2 * 1024 * 1024) { // Giới hạn 2MB
//                 setError("Lỗi: Kích thước ảnh không được vượt quá 2MB.");
//                 setImagePreview(null);
//                 setImageFile(null);
//                  if(fileInputRef.current) fileInputRef.current.value = null;
//                 return;
//             }
//             const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
//             if (!allowedTypes.includes(file.type)) {
//                  setError("Lỗi: Chỉ chấp nhận ảnh định dạng JPG, PNG, GIF, WEBP.");
//                  setImagePreview(null);
//                  setImageFile(null);
//                   if(fileInputRef.current) fileInputRef.current.value = null;
//                  return;
//             }

//             setError(null); // Xóa lỗi cũ
//             setImageFile(file); // Lưu file object
//             // Tạo URL tạm thời để xem trước
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setImagePreview(reader.result);
//             };
//             reader.readAsDataURL(file);
//         } else {
//             setImagePreview(null);
//             setImageFile(null);
//         }
//     };


//     // --- Xử lý Submit Form ---
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true); setError(null); setValidationErrors({});

//         // Tạo đối tượng FormData để gửi dữ liệu (bao gồm cả file)
//         const submissionData = new FormData();
//         submissionData.append('name', formData.name.trim());
//         submissionData.append('category_id', formData.category_id);
//         submissionData.append('price', formData.price);
//         submissionData.append('status', formData.status);
//          // Gửi giá trị boolean dạng 1 hoặc 0
//         submissionData.append('is_hot', formData.is_hot ? '1' : '0');
//         submissionData.append('is_vegetarian', formData.is_vegetarian ? '1' : '0');
//         // Gửi giá trị nullable
//         if (formData.description) submissionData.append('description', formData.description.trim());
//         if (formData.spice_level !== null && formData.spice_level !== '') submissionData.append('spice_level', formData.spice_level);
//         // Chỉ gửi file ảnh nếu người dùng chọn file mới
//         if (imageFile) {
//             submissionData.append('image', imageFile);
//         }
//          // Nếu là sửa, thêm _method=PATCH
//         if (isEditing) {
//             submissionData.append('_method', 'PATCH');
//         }


//         console.log("Submitting MenuItem FormData:", Object.fromEntries(submissionData)); // Log dữ liệu gửi đi (trừ file)


//         try {
//             let response;
//             if (isEditing) {
//                 // Gọi API Update với ID và FormData
//                 response = await adminMenuItemService.updateMenuItem(menuItemData.id, submissionData);
//             } else {
//                 // Gọi API Create với FormData
//                 response = await adminMenuItemService.createMenuItem(submissionData);
//             }

//             if (response.data?.success) {
//                 onSave(); // Gọi callback load lại danh sách
//                 handleClose(); // Đóng modal
//             } else {
//                 setError(response.data?.message || (isEditing ? 'Lỗi cập nhật' : 'Lỗi tạo mới'));
//             }

//         } catch (err) {
//              console.error("MenuItem save error:", err);
//              let errorMessage = 'Đã có lỗi xảy ra.';
//              if (err.response) {
//                  errorMessage = err.response.data?.message || errorMessage;
//                  if (err.response.status === 422 && err.response.data?.errors) {
//                      setValidationErrors(err.response.data.errors);
//                      errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường.";
//                  }
//              } else { errorMessage = err.message || 'Lỗi mạng.'; }
//              setError(errorMessage);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // --- Hiển thị ảnh cũ hoặc preview ảnh mới ---
//      const currentImage = imagePreview || (formData.image_url ? (formData.image_url.startsWith('http') ? formData.image_url : `${API_IMAGE_BASE_URL}${formData.image_url}`) : '/images/placeholder.jpg');


//     return (
//         <Modal show={show} onHide={handleClose} size="lg" backdrop="static" centered>
//             <Modal.Header closeButton>
//                 <Modal.Title>{isEditing ? 'Sửa Món Ăn' : 'Thêm Món Ăn Mới'}</Modal.Title>
//             </Modal.Header>
//             <Form onSubmit={handleSubmit} noValidate encType="multipart/form-data"> {/* Quan trọng: encType */}
//                 <Modal.Body>
//                     {error && <Alert variant='danger' size='sm' onClose={()=>setError(null)} dismissible>{error}</Alert>}

//                     <Row>
//                          {/* Cột trái: Thông tin cơ bản */}
//                          <Col md={7}>
//                             <Form.Group className="mb-3" controlId="menuItemName">
//                                 <Form.Label>Tên Món Ăn <span className="text-danger">*</span></Form.Label>
//                                 <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required disabled={loading} isInvalid={!!validationErrors.name} />
//                                 <Form.Control.Feedback type="invalid">{validationErrors.name?.[0]}</Form.Control.Feedback>
//                             </Form.Group>

//                             <Form.Group className="mb-3" controlId="menuItemCategory">
//                                 <Form.Label>Danh Mục <span className="text-danger">*</span></Form.Label>
//                                 <Form.Select name="category_id" value={formData.category_id} onChange={handleChange} required disabled={loading} isInvalid={!!validationErrors.category_id}>
//                                     <option value="">-- Chọn Danh Mục --</option>
//                                     {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
//                                 </Form.Select>
//                                  <Form.Control.Feedback type="invalid">{validationErrors.category_id?.[0]}</Form.Control.Feedback>
//                             </Form.Group>

//                             <Form.Group className="mb-3" controlId="menuItemDescription">
//                                 <Form.Label>Mô tả</Form.Label>
//                                 <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} disabled={loading} isInvalid={!!validationErrors.description} />
//                                 <Form.Control.Feedback type="invalid">{validationErrors.description?.[0]}</Form.Control.Feedback>
//                             </Form.Group>

//                             <Row>
//                                 <Col sm={6}>
//                                     <Form.Group className="mb-3" controlId="menuItemPrice">
//                                         <Form.Label>Giá (VNĐ) <span className="text-danger">*</span></Form.Label>
//                                         <Form.Control type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="1000" disabled={loading} isInvalid={!!validationErrors.price} />
//                                         <Form.Control.Feedback type="invalid">{validationErrors.price?.[0]}</Form.Control.Feedback>
//                                     </Form.Group>
//                                 </Col>
//                                 <Col sm={6}>
//                                     <Form.Group className="mb-3" controlId="menuItemStatus">
//                                         <Form.Label>Trạng thái <span className="text-danger">*</span></Form.Label>
//                                         <Form.Select name="status" value={formData.status} onChange={handleChange} required disabled={loading} isInvalid={!!validationErrors.status}>
//                                             <option value="available">Còn hàng</option>
//                                             <option value="unavailable">Hết hàng</option>
//                                         </Form.Select>
//                                         <Form.Control.Feedback type="invalid">{validationErrors.status?.[0]}</Form.Control.Feedback>
//                                     </Form.Group>
//                                 </Col>
//                             </Row>
//                              <Row>
//                                  <Col sm={6}>
//                                      <Form.Group className="mb-3" controlId="menuItemSpiceLevel">
//                                          <Form.Label>Độ cay (0-5)</Form.Label>
//                                          <Form.Control type="number" name="spice_level" value={formData.spice_level} onChange={handleChange} min="0" max="5" disabled={loading} isInvalid={!!validationErrors.spice_level} />
//                                          <Form.Control.Feedback type="invalid">{validationErrors.spice_level?.[0]}</Form.Control.Feedback>
//                                      </Form.Group>
//                                  </Col>
//                                  <Col sm={6} className="d-flex align-items-center pt-3"> {/* Căn chỉnh checkbox */}
//                                      <Form.Group controlId="menuItemIsHot" className="me-4">
//                                          <Form.Check type="switch" name="is_hot" label="Món Hot?" checked={!!formData.is_hot} onChange={handleChange} disabled={loading} />
//                                      </Form.Group>
//                                      <Form.Group controlId="menuItemIsVegetarian">
//                                          <Form.Check type="switch" name="is_vegetarian" label="Món Chay?" checked={!!formData.is_vegetarian} onChange={handleChange} disabled={loading} />
//                                      </Form.Group>
//                                  </Col>
//                             </Row>

//                          </Col>

//                          {/* Cột phải: Ảnh */}
//                          <Col md={5}>
//                             <Form.Group controlId="menuItemImage" className="mb-3">
//                                 <Form.Label>Ảnh đại diện</Form.Label>
//                                 <Form.Control type="file" name="image" onChange={handleImageChange} accept="image/png, image/jpeg, image/gif, image/webp" disabled={loading} ref={fileInputRef}/>
//                                 <Form.Text muted> Định dạng: JPG, PNG, GIF, WEBP. Tối đa 2MB. </Form.Text>
//                                 {validationErrors.image && <div className="text-danger small mt-1">{validationErrors.image[0]}</div>}
//                             </Form.Group>
//                              {/* Preview ảnh */}
//                             <div className="text-center">
//                                  <Image src={currentImage} alt="Xem trước ảnh" thumbnail fluid style={{maxHeight: '250px', objectFit: 'contain'}}/>
//                                  {/* Hiển thị tên file ảnh cũ nếu có và không có preview ảnh mới */}
//                                  {!imagePreview && formData.image_url && <small className="d-block text-muted mt-1">Ảnh hiện tại</small>}
//                             </div>
//                          </Col>
//                     </Row>

//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={handleClose} disabled={loading}>Hủy</Button>
//                     <Button variant="primary" type="submit" disabled={loading}>
//                         {loading ? <Spinner size="sm"/> : ''}
//                         {loading ? ' Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Thêm Món Ăn')}
//                     </Button>
//                 </Modal.Footer>
//             </Form>
//         </Modal>
//     );
// }

// export default MenuItemModal;