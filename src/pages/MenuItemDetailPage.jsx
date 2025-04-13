// src/pages/MenuItemDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Image, Spinner, Alert, Badge, Button, Breadcrumb, Form, Toast, ToastContainer, Tooltip, OverlayTrigger, Card } from 'react-bootstrap'; // Import đầy đủ components
import { menuService } from '../services/menu.service';
import { useCart } from '../hooks/useCart'; // Hook giỏ hàng
import { useAuth } from '../hooks/useAuth'; // Hook xác thực & yêu thích
import { favoriteService } from '../services/favorite.service'; // Service yêu thích

// Base URL ảnh
const API_IMAGE_BASE_URL = import.meta.env.VITE_API_IMAGE_BASE_URL || 'http://vietquannn.id.vn';

// Component Tooltip
const renderTooltip = (props, text) => (
  <Tooltip id="button-tooltip" {...props}>
    {text}
  </Tooltip>
);

function MenuItemDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem: addItemToCart } = useCart();
  // Lấy đầy đủ các giá trị từ AuthContext
  const { user, isAuthenticated, favoriteIds, addFavoriteId, removeFavoriteId, loading: authLoading } = useAuth();

  // State cho dữ liệu món ăn
  const [menuItem, setMenuItem] = useState(null);
  const [loading, setLoading] = useState(true); // Loading cho trang chi tiết
  const [error, setError] = useState(null);

  // State cho tương tác người dùng
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // State cho chức năng yêu thích
  const [isFavorited, setIsFavorited] = useState(false); // State này sẽ được cập nhật từ context
  const [favLoading, setFavLoading] = useState(false); // Loading riêng cho nút yêu thích

  // --- useEffect kiểm tra trạng thái yêu thích từ context ---
  useEffect(() => {
      // Cập nhật isFavorited bất cứ khi nào favoriteIds hoặc menuItem thay đổi
      if (isAuthenticated && menuItem?.id && favoriteIds) {
          setIsFavorited(favoriteIds.has(menuItem.id));
      } else {
          setIsFavorited(false);
      }
      // Không cần gọi API check riêng ở đây nữa
  }, [isAuthenticated, menuItem, favoriteIds]); // Dependencies


  // --- useEffect fetch dữ liệu chi tiết món ăn ---
  useEffect(() => {
    const fetchMenuItem = async () => {
      if (!slug) { setError('Không tìm thấy món ăn.'); setLoading(false); return; };
      setLoading(true); setError(null); setMenuItem(null); setQuantity(1); setShowToast(false); // Reset states
      try {
        console.log(`Fetching menu item detail for slug: ${slug}`);
        const response = await menuService.getMenuItemDetail(slug);
        console.log("API Response (Detail):", response);

        if (response.data?.success) {
          const fetchedItem = response.data.data;
           console.log("Fetched MenuItem Data (Detail):", fetchedItem);
           if (!fetchedItem.category) { console.warn("MenuItem is missing category data:", fetchedItem); }
          setMenuItem(fetchedItem);
          // Việc kiểm tra fav sẽ tự động chạy bởi useEffect ở trên khi menuItem được set
        } else {
          setError(response.data?.message || 'Không tìm thấy món ăn.');
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết món ăn:", err);
        if (err.response?.status === 404) { setError('Rất tiếc, món ăn bạn tìm không tồn tại hoặc đã bị xóa.'); }
        else { setError(err.response?.data?.message || err.message || 'Lỗi kết nối hoặc lỗi không xác định.'); }
      } finally { setLoading(false); }
    };
    fetchMenuItem();
    window.scrollTo(0, 0); // Cuộn lên đầu trang
  }, [slug]); // Chỉ phụ thuộc slug


  // --- Hàm Xử Lý Ảnh Lỗi ---
  const handleImageError = (e) => { 
    console.warn("Image failed to load:", e.target.src);
    e.target.onerror = null; 
    e.target.src = '/images/placeholder.jpg'; 
  };

  // --- Hàm Xử Lý URL Ảnh ---
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

  // --- Hàm Thêm Vào Giỏ Hàng ---
  const handleAddToCart = () => {
      if (!menuItem || menuItem.status !== 'available') return; // Chỉ thêm nếu món available
      const currentQuantity = parseInt(quantity) || 1;
      const itemToAdd = { id: menuItem.id, name: menuItem.name, price: parseInt(menuItem.price), image_url: menuItem.image_url, quantity: currentQuantity };
      try {
           addItemToCart(itemToAdd);
           setToastVariant('success');
           setToastMessage(`Đã thêm ${currentQuantity} "${menuItem.name}" vào giỏ!`);
           setShowToast(true);
      } catch (error) {
           console.error("Lỗi thêm vào giỏ:", error);
           setToastVariant('danger');
           setToastMessage("Lỗi khi thêm vào giỏ hàng.");
           setShowToast(true);
      }
  };

   // --- Hàm Xử Lý Toggle Yêu Thích ---
   const handleToggleFavorite = async () => {
       if (!isAuthenticated) { navigate('/login', { state: { from: location }, replace: true }); return; }
       if (!menuItem || favLoading) return;

       setFavLoading(true);
       const identifier = menuItem.slug || menuItem.id;
       const currentIsFavorited = favoriteIds.has(menuItem.id); // Lấy trạng thái từ context

       try {
           if (currentIsFavorited) {
               await favoriteService.removeFavorite(identifier);
               removeFavoriteId(menuItem.id); // Cập nhật context
               setToastVariant('info');
               setToastMessage(`Đã xóa "${menuItem.name}" khỏi yêu thích.`);
           } else {
                await favoriteService.addFavorite(identifier);
                addFavoriteId(menuItem.id); // Cập nhật context
                setToastVariant('success');
                setToastMessage(`Đã thêm "${menuItem.name}" vào yêu thích!`);
           }
           setShowToast(true);
       } catch (error) {
           console.error("Favorite toggle error:", error);
           setToastVariant('danger');
           setToastMessage("Lỗi xử lý yêu thích: " + (error.response?.data?.message || error.message));
           setShowToast(true);
           // Không cần rollback isFavorited vì nó đọc từ context
       } finally {
           setFavLoading(false);
       }
   };

  // ---- Render ----
  // Hiển thị loading nếu trang đang tải hoặc context auth đang tải ban đầu
  if (loading || authLoading) {
    return ( <Container className="page-container text-center d-flex justify-content-center align-items-center"><Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }}/></Container> );
  }

  // Hiển thị lỗi nếu có (và không có toast đang hiện)
  if (error && !showToast) {
    return ( <Container className="page-container"><Alert variant="danger" className="text-center"><Alert.Heading>Lỗi</Alert.Heading><p>{error}</p><Button variant="outline-primary" onClick={() => navigate('/menu')}><i className="bi bi-arrow-left"></i> Quay lại thực đơn</Button></Alert></Container> );
  }

   // Hiển thị cảnh báo nếu không có menuItem sau khi đã hết loading và không có lỗi
   if (!menuItem && !loading && !error) {
    return <Container className="page-container"><Alert variant="warning">Không có thông tin chi tiết cho món ăn này.</Alert></Container>;
  }

   // Xác định URL ảnh an toàn
   const imageUrl = menuItem?.image_url ? getImageUrl(menuItem.image_url) : '/images/placeholder.jpg';

  return (
    <Container className="page-container">
        {/* Toast Container */}
        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1055 }}>
            <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg={toastVariant} text={toastVariant === 'light' ? 'dark' : 'white'}>
                <Toast.Header closeButton={true} className={`bg-${toastVariant} text-white`}>
                     <strong className="me-auto">{toastVariant === 'success' ? 'Thành công!' : (toastVariant === 'danger' ? 'Lỗi!' : 'Thông báo')}</strong>
                </Toast.Header>
                <Toast.Body>{toastMessage}</Toast.Body>
            </Toast>
        </ToastContainer>

        {/* Breadcrumb */}
        <Breadcrumb className="bg-light px-3 py-2 rounded mb-4 shadow-sm">
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }} className="text-decoration-none"><i className="bi bi-house-door-fill"></i> Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/menu" }} className="text-decoration-none">Thực đơn</Breadcrumb.Item>
            {menuItem?.category && ( <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/menu?category=${menuItem.category.slug}` }} className="text-decoration-none"> {menuItem.category.name} </Breadcrumb.Item> )}
            <Breadcrumb.Item active>{menuItem?.name}</Breadcrumb.Item>
        </Breadcrumb>

        {/* Nội dung chi tiết */}
        {menuItem && ( // Render chỉ khi menuItem có dữ liệu
            <Card className="shadow-sm border-0">
                <Card.Body>
                    <Row className="g-4">
                        <Col md={5} lg={6}>
                            <div className="position-relative">
                                <Image 
                                    src={imageUrl} 
                                    alt={menuItem.name} 
                                    fluid 
                                    rounded 
                                    className="w-100 h-auto" 
                                    style={{ maxHeight: '400px', objectFit: 'cover' }}
                                    onError={handleImageError}
                                />
                                {menuItem.is_hot && (
                                    <Badge bg="danger" className="position-absolute top-0 end-0 m-2 fs-6">
                                        <i className="bi bi-fire me-1"></i> Hot
                                    </Badge>
                                )}
                                {menuItem.status === 'unavailable' && (
                                    <Badge bg="secondary" className="position-absolute top-0 start-0 m-2 fs-6">
                                        <i className="bi bi-x-circle me-1"></i> Hết hàng
                                    </Badge>
                                )}
                            </div>
                        </Col>
                        <Col md={7} lg={6}>
                            <div className='d-flex align-items-center flex-wrap mb-2'>
                                <h1 className="fw-bold mb-0 me-2">{menuItem.name}</h1>
                            </div>
                            <div className="mb-3">
                                <span className="text-muted me-3 small"><i className="bi bi-tag-fill me-1"></i><Link to={`/menu?category=${menuItem.category?.slug ?? 'all'}`} className="text-decoration-none text-muted"> {menuItem.category?.name || 'Khác'} </Link></span>
                                {menuItem.is_vegetarian === 1 && <Badge bg="success-subtle" text="success-emphasis" className="me-2 p-2 border border-success-subtle small"><i className="bi bi-leaf me-1"></i>Món chay</Badge>}
                                {menuItem.spice_level > 0 && <Badge bg="warning-subtle" text="warning-emphasis" className='p-2 border border-warning-subtle small'><i className="bi bi-fire me-1"></i>Độ cay: {'🌶️'.repeat(parseInt(menuItem.spice_level))}</Badge>}
                            </div>
                            <p className="mb-3">{menuItem.description || 'Chưa có mô tả chi tiết.'}</p>
                            <h2 className="text-primary mb-4 fw-bolder">{(menuItem.price !== null && !isNaN(menuItem.price)) ? parseInt(menuItem.price).toLocaleString('vi-VN') + ' đ' : 'Liên hệ giá'}</h2>

                            {menuItem.status === 'available' ? (
                                <>
                                    <Row className="align-items-center mb-3 gx-2">
                                        <Col xs="auto"><Form.Label htmlFor={`quantitySelect-${menuItem.id}`} className="mb-0 fw-semibold">Số lượng:</Form.Label></Col>
                                        <Col xs={4} sm={3} md={3} lg={2}>
                                            <Form.Control id={`quantitySelect-${menuItem.id}`} type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} min="1" max="20" style={{ width: '70px' }} className="text-center form-control-sm"/>
                                        </Col>
                                    </Row>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Button variant="success" onClick={handleAddToCart} size="lg" className="flex-grow-1 flex-md-grow-0"> <i className="bi bi-cart-plus-fill me-2"></i> Thêm vào giỏ </Button>
                                        {/* Nút yêu thích */}
                                        {isAuthenticated && (
                                             <OverlayTrigger placement="top" overlay={(props)=>renderTooltip(props, isFavorited ? 'Bỏ yêu thích' : 'Thêm yêu thích')}>
                                                <Button variant={isFavorited ? "danger" : "outline-danger"} onClick={handleToggleFavorite} disabled={favLoading} >
                                                     {favLoading ? <Spinner animation="border" size="sm" /> : (isFavorited ? <i className="bi bi-heart-fill"></i> : <i className="bi bi-heart"></i>)}
                                                </Button>
                                             </OverlayTrigger>
                                        )}
                                        {!isAuthenticated && ( // Nút yêu thích bị disable nếu chưa đăng nhập
                                              <OverlayTrigger placement="top" overlay={(props)=>renderTooltip(props, 'Đăng nhập để yêu thích')}>
                                                   <Button variant="outline-secondary" disabled><i className="bi bi-heart"></i></Button>
                                               </OverlayTrigger>
                                         )}
                                    </div>
                                </>
                            ) : ( <Alert variant="secondary" className="mt-4"> <i className="bi bi-info-circle me-2"></i> Món ăn này hiện không có sẵn. </Alert> )}
                        </Col>
                    </Row>
                 </Card.Body>
             </Card>
        )}

        {/* TODO: Add review section or related items */}
        {/* <Card className="mt-4 shadow-sm"> <Card.Body>...</Card.Body> </Card> */}
    </Container>
  );
}

export default MenuItemDetailPage;