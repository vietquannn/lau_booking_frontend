// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx'; // Import AuthProvider
import { CartProvider } from './contexts/CartContext.jsx'; // <-- IMPORT CART PROVIDER (file .js)
import { AdminAuthProvider } from './contexts/AdminAuthContext.jsx';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Hàm khởi tạo Dialogflow Messenger
const initDialogflowMessenger = () => {
  // Đảm bảo script đã được tải
  if (window.dfMessenger) {
    console.log('Dialogflow Messenger đã sẵn sàng');
    return;
  }

  // Tạo script element nếu chưa có
  const script = document.createElement('script');
  script.src = 'https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1';
  script.async = true;
  script.onload = () => {
    console.log('Dialogflow script đã tải xong');
    // Tạo df-messenger element nếu chưa có
    if (!document.querySelector('df-messenger')) {
      const dfMessenger = document.createElement('df-messenger');
      dfMessenger.setAttribute('intent', 'WELCOME');
      dfMessenger.setAttribute('chat-title', 'Hỗ Trợ Đặt Bàn');
      dfMessenger.setAttribute('agent-id', '28f974fa-7bde-4b85-9980-04ebcef0414b');
      dfMessenger.setAttribute('language-code', 'vi');
      document.body.appendChild(dfMessenger);
    }
  };
  document.body.appendChild(script);
};

// Khởi tạo Dialogflow Messenger sau khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', initDialogflowMessenger);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider> {/* <<-- BỌC THÊM ADMIN AUTH PROVIDER */}
            <CartProvider>
              <App />
            </CartProvider>
          </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);