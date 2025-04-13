// src/hooks/useAuth.js
import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext.jsx'; // Import context đã tạo
import CartContext from '../contexts/CartContext.jsx';

// Custom hook để đơn giản hóa việc sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Nếu bạn khởi tạo context bằng null, kiểm tra null ở đây
  if (context === null) {
       console.warn('AuthProvider value is null. Ensure AuthProvider wraps the component calling useAuth.');
       // Trả về một object mặc định để tránh lỗi khi component cố gắng destructure
       return {
           user: null,
           token: null,
           isAuthenticated: false,
           loading: true, // Giả sử đang loading nếu context null
           authError: 'Auth context not available',
           login: async () => { throw new Error('Auth context not available'); },
           logout: async () => { throw new Error('Auth context not available'); },
           register: async () => { throw new Error('Auth context not available'); },
           setAuthError: () => {},
       };
  }

  return context;
};