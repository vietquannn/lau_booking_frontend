// src/hooks/useCart.js
import { useContext } from 'react';
import CartContext from '../contexts/CartContext.jsx'; // <<--- Import từ file .jsx đã đổi tên

/**
 * Custom Hook để truy cập CartContext một cách dễ dàng và an toàn.
 * Nó đảm bảo rằng hook chỉ được sử dụng bên trong CartProvider.
 *
 * @returns {object} Giá trị của CartContext, bao gồm:
 *  - items: Mảng các sản phẩm trong giỏ hàng [{ id, name, price, quantity, image_url }]
 *  - totalAmount: Tổng giá trị tiền của giỏ hàng
 *  - totalQuantity: Tổng số lượng sản phẩm trong giỏ hàng
 *  - addItem: Hàm để thêm một món ăn vào giỏ (nhận object item)
 *  - removeItem: Hàm để xóa một món ăn khỏi giỏ (nhận menuItemId)
 *  - updateQuantity: Hàm để cập nhật số lượng của một món ăn (nhận menuItemId, newQuantity)
 *  - clearCart: Hàm để xóa toàn bộ giỏ hàng
 */
export const useCart = () => {
  // Sử dụng hook useContext của React để lấy giá trị từ CartContext
  const context = useContext(CartContext);

  // Kiểm tra xem context có tồn tại không (nghĩa là hook có được gọi bên trong Provider không)
  if (context === undefined) {
    // Ném lỗi nếu hook được gọi bên ngoài Provider để báo cho developer biết
    throw new Error('useCart() must be used within a CartProvider.');
  }

  // Kiểm tra xem giá trị context có phải là null không (do giá trị khởi tạo hoặc lỗi Provider)
  if (context === null) {
       // Ghi cảnh báo vào console
       console.warn('CartProvider value is null. Check if CartProvider wraps the component using useCart.');
       // Trả về một object với giá trị mặc định và các hàm rỗng để tránh lỗi crash ứng dụng
       // khi component cố gắng destructure hoặc gọi hàm từ context bị null.
       return {
           items: [],
           totalAmount: 0,
           totalQuantity: 0,
           addItem: () => { console.error('CartProvider not available'); },
           removeItem: () => { console.error('CartProvider not available'); },
           updateQuantity: () => { console.error('CartProvider not available'); },
           clearCart: () => { console.error('CartProvider not available'); }
       };
  }

  // Nếu context hợp lệ, trả về giá trị context
  return context;
};

// Không cần export default vì đây là named export