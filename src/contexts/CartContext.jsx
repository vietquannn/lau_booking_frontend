// src/contexts/CartContext.jsx
import React, { createContext, useReducer, useEffect } from 'react';

// --- Định nghĩa Action Types ---
const ADD_ITEM = 'ADD_ITEM';
const REMOVE_ITEM = 'REMOVE_ITEM';
const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
const CLEAR_CART = 'CLEAR_CART';
const LOAD_CART = 'LOAD_CART'; // Action để load từ localStorage

// --- Hàm lấy state ban đầu từ localStorage ---
const getInitialCartState = () => {
    try {
        const storedCart = localStorage.getItem('restaurantCartData'); // Sử dụng key khác biệt
        if (storedCart) {
            const parsedCart = JSON.parse(storedCart);
            // Validate cấu trúc dữ liệu từ localStorage (optional nhưng nên có)
            if (parsedCart && Array.isArray(parsedCart.items) && typeof parsedCart.totalAmount === 'number' && typeof parsedCart.totalQuantity === 'number') {
                console.log("Loaded cart from localStorage:", parsedCart);
                return parsedCart;
            }
        }
    } catch (e) {
         console.error("Error parsing cart data from localStorage", e);
         localStorage.removeItem('restaurantCartData'); // Xóa dữ liệu lỗi
    }
    // Trả về state trống nếu không có gì trong storage hoặc lỗi parse
    return { items: [], totalAmount: 0, totalQuantity: 0 };
};


// --- Reducer Function ---
const cartReducer = (state, action) => {
  let updatedItems;
  let existingCartItemIndex;
  let existingCartItem;
  let updatedTotalAmount;
  let updatedTotalQuantity;
  let newState; // Biến để lưu state mới trước khi trả về

  switch (action.type) {
    // --- THÊM MÓN ---
    case ADD_ITEM:
        // item được truyền vào là { id, name, price, quantity, image_url }
        if (!action.item || !action.item.id || action.item.quantity < 1 || action.item.price < 0) {
            console.warn("ADD_ITEM: Invalid item data received", action.item);
            return state; // Không thay đổi state nếu item không hợp lệ
        }

        updatedTotalQuantity = state.totalQuantity + action.item.quantity;
        updatedTotalAmount = state.totalAmount + (action.item.price * action.item.quantity);

        existingCartItemIndex = state.items.findIndex(item => item.id === action.item.id);
        existingCartItem = state.items[existingCartItemIndex];

        if (existingCartItem) {
            // Cập nhật số lượng nếu món đã tồn tại
            const updatedItem = {
            ...existingCartItem,
            quantity: existingCartItem.quantity + action.item.quantity,
            };
            updatedItems = [...state.items];
            updatedItems[existingCartItemIndex] = updatedItem;
        } else {
            // Thêm món mới vào giỏ hàng
             const newItem = {
                id: action.item.id,
                name: action.item.name,
                price: action.item.price,
                image_url: action.item.image_url,
                quantity: action.item.quantity,
            };
            updatedItems = [...state.items, newItem]; // Thêm vào cuối mảng
        }
        break; // Kết thúc ADD_ITEM

    // --- XÓA MÓN ---
    case REMOVE_ITEM:
        existingCartItemIndex = state.items.findIndex(item => item.id === action.id);
        existingCartItem = state.items[existingCartItemIndex];

        if (!existingCartItem) {
             console.warn("REMOVE_ITEM: Item not found", action.id);
             return state; // Không tìm thấy, không thay đổi state
        }

        updatedTotalQuantity = state.totalQuantity - existingCartItem.quantity;
        updatedTotalAmount = state.totalAmount - (existingCartItem.price * existingCartItem.quantity);
        updatedItems = state.items.filter(item => item.id !== action.id); // Lọc bỏ item cần xóa
        break; // Kết thúc REMOVE_ITEM

    // --- CẬP NHẬT SỐ LƯỢNG ---
     case UPDATE_QUANTITY:
        if (action.quantity < 1) {
            console.warn("UPDATE_QUANTITY: Quantity must be >= 1. Use REMOVE_ITEM instead.", action.id, action.quantity);
             // Nếu muốn tự động xóa khi quantity < 1, gọi logic của REMOVE_ITEM ở đây
             // Hoặc đơn giản là không làm gì
             return state;
        }

        existingCartItemIndex = state.items.findIndex(item => item.id === action.id);
        existingCartItem = state.items[existingCartItemIndex];

        if (!existingCartItem) {
            console.warn("UPDATE_QUANTITY: Item not found", action.id);
            return state;
        }

        // Tính toán sự thay đổi về số lượng và tổng tiền
        const quantityDifference = action.quantity - existingCartItem.quantity;
        updatedTotalQuantity = state.totalQuantity + quantityDifference;
        updatedTotalAmount = state.totalAmount + (quantityDifference * existingCartItem.price);

        // Tạo item mới với số lượng đã cập nhật
        const updatedItemQty = { ...existingCartItem, quantity: action.quantity };
        updatedItems = [...state.items];
        updatedItems[existingCartItemIndex] = updatedItemQty; // Thay thế item cũ bằng item mới
        break; // Kết thúc UPDATE_QUANTITY

    // --- XÓA TOÀN BỘ GIỎ HÀNG ---
    case CLEAR_CART:
      updatedItems = [];
      updatedTotalAmount = 0;
      updatedTotalQuantity = 0;
      break; // Kết thúc CLEAR_CART

     // --- LOAD GIỎ HÀNG TỪ STORAGE ---
     // Action này có thể không cần thiết nếu dùng useEffect trong Provider
     // case LOAD_CART:
     //    return action.cartData || { items: [], totalAmount: 0, totalQuantity: 0 };

    default:
      console.warn("Unknown cart action type:", action.type);
      return state; // Luôn trả về state hiện tại nếu action không hợp lệ
  }

   // Tạo state mới và lưu vào localStorage
   newState = {
        items: updatedItems,
        totalAmount: Math.max(0, updatedTotalAmount), // Đảm bảo không âm
        totalQuantity: Math.max(0, updatedTotalQuantity),
   };
   try {
       localStorage.setItem('restaurantCartData', JSON.stringify(newState));
       console.log("Cart updated and saved to localStorage:", newState);
   } catch (e) {
       console.error("Error saving cart data to localStorage", e);
   }
   return newState; // Trả về state mới
};


// --- Tạo Context ---
// Giá trị khởi tạo có thể bao gồm các hàm NOP (No Operation)
const CartContext = createContext({
  items: [],
  totalAmount: 0,
  totalQuantity: 0,
  addItem: (item) => {},
  removeItem: (id) => {},
  updateQuantity: (id, quantity) => {},
  clearCart: () => {},
});


// --- Provider Component ---
export const CartProvider = ({ children }) => {

  // Sử dụng useReducer với state ban đầu lấy từ localStorage
  const [cartState, dispatchCartAction] = useReducer(cartReducer, getInitialCartState());

  // Không cần useEffect để load từ localStorage ở đây nữa vì getInitialCartState đã làm rồi

  // --- Các hàm Action Dispatchers ---
  const addItemToCartHandler = (item) => {
    // Item nên là { id, name, price, quantity, image_url }
    dispatchCartAction({ type: ADD_ITEM, item: item });
  };

  const removeItemFromCartHandler = (id) => { // id của menuItem
    dispatchCartAction({ type: REMOVE_ITEM, id: id });
  };

   const updateItemQuantityHandler = (id, quantity) => { // id của menuItem và số lượng mới
        dispatchCartAction({ type: UPDATE_QUANTITY, id: id, quantity: quantity });
    };

  const clearCartHandler = () => {
    dispatchCartAction({ type: CLEAR_CART });
    // Không cần xóa localStorage ở đây vì reducer đã làm
  };

  // --- Giá trị cung cấp bởi Context ---
  // Đảm bảo các tên hàm khớp với tên trong giá trị khởi tạo context
  const cartContextValue = {
    items: cartState.items,
    totalAmount: cartState.totalAmount,
    totalQuantity: cartState.totalQuantity,
    addItem: addItemToCartHandler,
    removeItem: removeItemFromCartHandler,
    updateQuantity: updateItemQuantityHandler,
    clearCart: clearCartHandler,
  };

  return (
    <CartContext.Provider value={cartContextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Export Context để dùng với useContext
export default CartContext;