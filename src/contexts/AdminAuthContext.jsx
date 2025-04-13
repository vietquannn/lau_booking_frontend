// src/contexts/AdminAuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { adminAuthService } from '../services/admin.auth.service'; // Service Admin Auth
import apiClient from '../services/api'; // Để set header chung (nếu cần tách biệt hoàn toàn header?)

// Tạo Context
const AdminAuthContext = createContext({
    admin: null,
    adminToken: null,
    isAdminAuthenticated: false,
    loading: true, // Loading trạng thái admin ban đầu
    error: null, // Lỗi đăng nhập admin
    login: async (email, password) => {},
    logout: async () => {},
    loadAdmin: async () => {}, // Load admin từ storage/API
    setError: (err) => {},
});

// Provider Component
export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || null);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(!!localStorage.getItem('adminToken'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Hàm set token (có thể tách riêng nếu cần header khác cho admin)
    const setTokenAndHeader = useCallback((newToken) => {
        if (newToken) {
            localStorage.setItem('adminToken', newToken);
            // Quan trọng: Nếu API Admin và User dùng chung apiClient instance,
            // việc set header ở đây có thể ghi đè token user và ngược lại.
            // Giải pháp:
            // 1. Dùng chung apiClient và interceptor tự thêm token đúng (phổ biến).
            // 2. Tạo apiClient riêng cho Admin.
            // 3. Không set header mặc định, truyền token vào từng request service admin.
            // => Chọn cách 1: Interceptor trong api.js sẽ xử lý việc này.
            // => Không cần set header ở đây nữa nếu interceptor đã làm.
            // apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            setAdminToken(newToken);
            setIsAdminAuthenticated(true);
        } else {
            localStorage.removeItem('adminToken');
            // delete apiClient.defaults.headers.common['Authorization']; // Không cần nếu interceptor xử lý
            setAdminToken(null);
            setIsAdminAuthenticated(false);
        }
    }, []);

    // Hàm load admin ban đầu
    const loadAdmin = useCallback(async () => {
        console.log("AdminAuthContext: loadAdmin called");
        setLoading(true); setError(null);
        const storedToken = localStorage.getItem('adminToken');
        const storedAdmin = JSON.parse(localStorage.getItem('adminData') || 'null');

        if (storedToken) {
             console.log("Admin token found, verifying...");
             // Không cần set header ở đây nếu dùng interceptor chung
             // apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

             // Ưu tiên dùng data cũ để load nhanh UI
             if(storedAdmin){
                  setAdmin(storedAdmin);
                  setIsAdminAuthenticated(true); // Tạm coi là auth
                  // Gọi API /admin/me để xác thực lại token và lấy data mới nhất
                  try {
                       const response = await adminAuthService.getAdminUser(); // Gọi qua service
                       if (response.data?.success && response.data.data) {
                           if (JSON.stringify(response.data.data) !== JSON.stringify(storedAdmin)) {
                                localStorage.setItem('adminData', JSON.stringify(response.data.data));
                                setAdmin(response.data.data); // Cập nhật nếu có thay đổi
                           }
                       } else {
                            throw new Error('Invalid admin data from API');
                       }
                  } catch(err) {
                       console.error("Admin token verification failed:", err);
                       setTokenAndHeader(null); // Xóa token nếu không hợp lệ
                       localStorage.removeItem('adminData');
                       setAdmin(null);
                       setIsAdminAuthenticated(false);
                  } finally {
                      setLoading(false); // Chỉ tắt loading sau khi đã kiểm tra xong
                  }
             } else {
                  // Có token nhưng không có data => Gọi API lấy data
                  try {
                       const response = await adminAuthService.getAdminUser();
                       if (response.data?.success && response.data.data) {
                            localStorage.setItem('adminData', JSON.stringify(response.data.data));
                            setAdmin(response.data.data);
                            setIsAdminAuthenticated(true);
                       } else { throw new Error('Failed to fetch admin data'); }
                   } catch (err) {
                       console.error("Error fetching admin on load:", err);
                       setTokenAndHeader(null); localStorage.removeItem('adminData'); setAdmin(null); setIsAdminAuthenticated(false);
                   } finally { setLoading(false); }
             }


        } else {
            console.log("No admin token found.");
            setLoading(false); setIsAdminAuthenticated(false); setAdmin(null);
        }
    }, [setTokenAndHeader]); // Dependency

    useEffect(() => { loadAdmin(); }, [loadAdmin]);

    // Hàm login Admin
    const login = useCallback(async (email, password) => {
        setLoading(true); setError(null); // Loading riêng cho login admin
        try {
            const response = await adminAuthService.login(email, password);
            if (response.data?.success && response.data.data?.token && response.data.data?.admin) {
                const { admin: loggedInAdmin, token: newToken } = response.data.data;
                setTokenAndHeader(newToken); // Lưu token
                localStorage.setItem('adminData', JSON.stringify(loggedInAdmin)); // Lưu admin data
                setAdmin(loggedInAdmin);
                setIsAdminAuthenticated(true);
                console.log("Admin login successful");
                return loggedInAdmin; // Trả về data admin
            } else { throw new Error(response.data?.message || 'Đăng nhập Admin thất bại.'); }
        } catch (error) {
            console.error("Admin login error:", error);
            const message = error.response?.data?.message || error.message || 'Lỗi đăng nhập Admin.';
            setError(message);
            throw error; // Ném lỗi
        } finally { setLoading(false); }
    }, [setTokenAndHeader]);

    // Hàm logout Admin
    const logout = useCallback(async () => {
        console.log("Admin logging out...");
        const currentToken = localStorage.getItem('adminToken');
        setTokenAndHeader(null); // Xóa ở client trước
        localStorage.removeItem('adminData');
        setAdmin(null);
        setIsAdminAuthenticated(false);
        setError(null);

        if(currentToken){
             try {
                 // Gọi API logout của admin
                 await apiClient.post('/admin/logout', {}, { headers: { Authorization: `Bearer ${currentToken}` } });
             } catch (error) { console.error("Admin logout API error:", error); }
        }
    }, [setTokenAndHeader]);

     // Hàm xóa lỗi (ví dụ khi user nhập lại form)
     const clearError = useCallback(() => {
        setError(null);
     }, []);


    // Giá trị context
    const value = React.useMemo(() => ({
        admin, adminToken, isAdminAuthenticated, loading, error,
        login, logout, loadAdmin, setError: clearError
    }), [admin, adminToken, isAdminAuthenticated, loading, error, login, logout, loadAdmin, clearError]);

    // Hiển thị loading ban đầu (có thể bỏ qua nếu không muốn màn hình trắng)
    // if (loading) { return <div className="vh-100 d-flex justify-content-center align-items-center"><Spinner /></div>; }

    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    );
};

// Export Context
export default AdminAuthContext;