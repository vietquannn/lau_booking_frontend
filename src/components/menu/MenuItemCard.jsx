// src/components/menu/MenuItemCard.jsx
import React, { useState } from 'react';
import { Card, Button, Badge, Spinner, Tooltip, OverlayTrigger, Toast, ToastContainer } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart'; // Hook giỏ hàng
import { useAuth } from '../../hooks/useAuth'; // Hook xác thực & yêu thích
import { favoriteService } from '../../services/favorite.service'; // Service API yêu thích

// Base URL ảnh (Lấy từ biến môi trường .env)
const API_IMAGE_BASE_URL = import.meta.env.VITE_API_IMAGE_BASE_URL || 'http://restaurant-booking.test';

// Component để render Tooltip (có thể tái sử dụng)
const renderTooltip = (props, text) => (
  <Tooltip id={`tooltip-${Math.random().toString(36).substring(7)}`} {...props}> {/* Đảm bảo ID là duy nhất */}
    {text}
  </Tooltip>
);

/**
 * Component hiển thị một card món ăn.
 * @param {object} item - Object chứa thông tin món ăn (id, name, slug, price, image_url, description, is_hot, status, category...).
 * @param {boolean} hideFavoriteButton - Prop để ẩn nút yêu thích (ví dụ: trên trang MyFavoritesPage). Mặc định là false.
 */
function MenuItemCard({ item, hideFavoriteButton = false }) {
  const { addItem: addItemToCart } = useCart(); // Lấy hàm thêm vào giỏ từ context
  const { isAuthenticated, favoriteIds, addFavoriteId, removeFavoriteId } = useAuth(); // Lấy state và hàm yêu thích từ context
  const navigate = useNavigate(); // Hook để chuyển hướng (ví dụ: đến trang login)

  // State loading cục bộ cho nút yêu thích của card này
  const [favLoading, setFavLoading] = useState(false);
  // State cho Toast thông báo thêm vào giỏ hàng
  const [showCartToast, setShowCartToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // Xác định trạng thái yêu thích hiện tại dựa vào context
  // Sử dụng optional chaining (?.) để tránh lỗi nếu item hoặc favoriteIds chưa có
  const isFavorited = isAuthenticated && item?.id && favoriteIds?.has(item.id);

  // --- Hàm xử lý khi ảnh bị lỗi ---
  const handleImageError = (e) => {
    e.target.onerror = null; // Ngăn vòng lặp vô hạn nếu ảnh placeholder cũng lỗi
    e.target.src = '/images/placeholder.jpg'; // Đường dẫn đến ảnh mặc định trong thư mục public/images
  };

  // --- Hàm xử lý khi nhấn nút "Thêm" vào giỏ hàng ---
  const handleAddToCart = (e) => {
      e.preventDefault(); // Ngăn thẻ Link bao ngoài điều hướng
      e.stopPropagation(); // Ngăn sự kiện click nổi bọt lên thẻ Link
      if (!item || item.status !== 'available') return; // Không thêm nếu item không tồn tại hoặc hết hàng

      // Chuẩn bị dữ liệu để thêm vào CartContext
      const itemToAdd = {
          id: item.id,
          name: item.name,
          price: parseInt(item.price || 0), // Đảm bảo price là số
          image_url: item.image_url,
          quantity: 1 // Mặc định thêm 1 sản phẩm từ card
      };

      try {
           addItemToCart(itemToAdd); // Gọi hàm từ CartContext
           // Chuẩn bị và hiển thị Toast thông báo thành công
           setToastVariant('success');
           setToastMessage(`Đã thêm "${item.name}" vào giỏ!`);
           setShowCartToast(true);
      } catch (error) {
           console.error("Lỗi thêm vào giỏ:", error);
           // Chuẩn bị và hiển thị Toast thông báo lỗi
           setToastVariant('danger');
           setToastMessage("Lỗi khi thêm vào giỏ hàng.");
           setShowCartToast(true);
      }
  };

   // --- Hàm xử lý khi nhấn nút Yêu thích (trái tim) ---
   const handleToggleFavorite = async (e) => {
        e.preventDefault(); e.stopPropagation(); // Ngăn link và nổi bọt

        // Kiểm tra đăng nhập, nếu chưa thì chuyển hướng đến trang login
        if (!isAuthenticated) {
            alert('Vui lòng đăng nhập để sử dụng chức năng yêu thích.'); // Hoặc dùng Toast
            navigate('/login', { state: { from: window.location.pathname + window.location.search }, replace: true }); // Lưu lại trang hiện tại
            return;
        }
        // Ngăn click liên tục khi đang xử lý hoặc item không hợp lệ
        if (favLoading || !item?.id) return;

        setFavLoading(true); // Bắt đầu loading
        const identifier = item.slug || item.id; // Dùng slug hoặc id để gọi API
        const currentIsFavorited = favoriteIds.has(item.id); // Lấy trạng thái từ context

        try {
            if (currentIsFavorited) { // Nếu đang thích -> Gọi API xóa
                await favoriteService.removeFavorite(identifier);
                removeFavoriteId(item.id); // Cập nhật context state sau khi API thành công
                // Không cần hiển thị toast ở đây vì nút trái tim đã đổi trạng thái
            } else { // Nếu chưa thích -> Gọi API thêm
                 await favoriteService.addFavorite(identifier);
                 addFavoriteId(item.id); // Cập nhật context state
                 // Không cần hiển thị toast ở đây
            }
        } catch (error) {
            console.error("Lỗi xử lý yêu thích:", error);
            // Hiển thị lỗi bằng Toast nếu muốn
            setToastVariant('danger');
            setToastMessage("Lỗi xử lý yêu thích: " + (error.response?.data?.message || error.message));
            setShowToast(true);
            // State isFavorited sẽ tự động đúng vì nó đọc từ context
        } finally {
            setFavLoading(false); // Kết thúc loading
        }
   };

  // --- Render ---
  // Xác định URL ảnh an toàn
  const imageUrl = item?.image_url // Kiểm tra item và image_url tồn tại
  ? (
      item.image_url.startsWith('http') // Nếu đã là URL đầy đủ (http:// hoặc https://)
        ? item.image_url // Dùng trực tiếp
        // <<-- LUÔN GHÉP NỐI NẾU LÀ ĐƯỜNG DẪN TƯƠNG ĐỐI TỪ ROOT -->>
        : `${API_IMAGE_BASE_URL}${item.image_url}` // Ghép Base URL với đường dẫn trả về (vd: /storage/...)
    )
  : '/images/placeholder.jpg';

  // Xử lý trường hợp item prop không hợp lệ
  if (!item || !item.id || !item.name) {
      console.warn("Invalid item prop passed to MenuItemCard:", item);
      return null; // Không render gì cả nếu item không hợp lệ
  }

  return (
    <Card className="h-100 shadow-sm border-light-subtle overflow-hidden position-relative">

      {/* === Nút Yêu Thích === */}
      {/* Chỉ hiển thị nếu KHÔNG có prop hideFavoriteButton và đã đăng nhập */}
      {!hideFavoriteButton && isAuthenticated && (
            <OverlayTrigger
                placement="left" // Tooltip hiện bên trái
                delay={{ show: 300, hide: 100 }} // Delay hiển thị/ẩn tooltip
                overlay={(props) => renderTooltip(props, isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích')}
            >
                <Button
                    variant={isFavorited ? 'danger' : 'outline-danger'} // Màu nút thay đổi theo trạng thái
                    size="sm"
                    onClick={handleToggleFavorite} // Gọi hàm xử lý
                    disabled={favLoading} // Disable khi đang loading
                    className="position-absolute top-0 end-0 m-2 rounded-circle" // Vị trí góc trên phải, bo tròn
                    style={{ zIndex: 2, width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} // Style để icon canh giữa
                >
                    {/* Hiển thị Spinner hoặc Icon trái tim */}
                    {favLoading
                        ? <Spinner animation="border" size="sm" variant={isFavorited ? 'light' : 'danger'} />
                        : (isFavorited ? <i className="bi bi-heart-fill"></i> : <i className="bi bi-heart"></i>)
                    }
                </Button>
            </OverlayTrigger>
      )}
      {/* ===================== */}


      {/* === Toast Container (Cho thông báo Thêm vào giỏ) === */}
      {/* Đặt ở đây để toast chỉ hiển thị cho card này */}
      <ToastContainer position="bottom-center" className="p-3" style={{ zIndex: 1055 }}>
          <Toast onClose={() => setShowCartToast(false)} show={showCartToast} delay={2500} autohide bg={toastVariant} text={toastVariant === 'light' ? 'dark' : 'white'}>
              <Toast.Header closeButton={false}>
                  <strong className="me-auto">{toastVariant === 'success' ? 'Đã thêm' : 'Lỗi'}</strong>
              </Toast.Header>
              <Toast.Body>{toastMessage}</Toast.Body>
          </Toast>
      </ToastContainer>
      {/* ==================================================== */}


      {/* === Link chính bao Ảnh và Body Text === */}
      <Link to={`/menu/${item.slug}`} className="text-decoration-none text-dark d-flex flex-column flex-grow-1">
          {/* Ảnh món ăn */}
          <Card.Img
            variant="top"
            src={imageUrl}
            onError={handleImageError}
            alt={item.name}
            style={{ height: '180px', objectFit: 'cover', borderBottom: '1px solid #eee' }}
            className="menu-item-card-img" // Class cho CSS hover effect
          />
          {/* Phần Body chứa Title và Description */}
          <Card.Body className="p-3 d-flex flex-column">
                {/* Đảm bảo chiều cao tối thiểu để layout ổn định */}
                <div style={{ minHeight: '45px' }}>
                    {/* Title món ăn, giới hạn 1 dòng */}
                    <Card.Title className="mb-1 fs-6 fw-bold text-truncate" title={item.name}>
                        {item.name}
                    </Card.Title>
                    {/* Tag Hot (hiện hoặc ẩn để giữ layout) */}
                    <Badge bg="danger" pill size="sm" className={`mb-2 ${item.is_hot ? 'visible' : 'invisible'}`}>Hot</Badge>
                </div>

                {/* Mô tả món ăn, giới hạn 2 dòng */}
                <Card.Text className="text-muted small flex-grow-1 mb-2 text-truncate-line-2" title={item.description}>
                  {item.description || ' '} {/* Khoảng trắng để giữ chiều cao nếu không có mô tả */}
                </Card.Text>
          </Card.Body>
      </Link>
      {/* ======================================= */}


      {/* === Footer Card - Giá và Nút Thêm vào giỏ === */}
      <Card.Footer className="bg-white border-top-0 pt-0 pb-2 px-3 d-flex justify-content-between align-items-center">
            {/* Giá tiền */}
            <span className="fw-bold text-primary small">
                {(item.price !== null && !isNaN(item.price)) ? parseInt(item.price).toLocaleString('vi-VN') + ' đ' : 'Liên hệ'}
            </span>
            {/* Nút Thêm hoặc Badge Hết hàng */}
            {item.status === 'available' ? (
                 <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, `Thêm ${item.name} vào giỏ`)}>
                    <Button
                        variant="outline-success"
                        size="sm"
                        onClick={handleAddToCart} // Gọi hàm thêm vào giỏ
                        style={{ zIndex: 1 }} // Nổi lên trên Link bao ngoài
                        className="px-2 py-1"
                    >
                         <i className="bi bi-cart-plus"></i>
                    </Button>
                 </OverlayTrigger>
            ) : (
                 <Badge bg="secondary" pill>Hết hàng</Badge>
            )}
        </Card.Footer>
       {/* ============================================ */}
    </Card>
  );
}

// CSS cần thêm vào file global (index.css hoặc App.css)
/*
.text-truncate-line-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: calc(1.6em * 2); // Adjust based on line-height
}
.menu-item-card-img {
   transition: transform .2s ease-in-out;
}
// Bỏ hover ở đây vì Link đã bao ngoài
// .menu-item-card-img:hover {
//    transform: scale(1.05);
// }
*/

export default MenuItemCard;