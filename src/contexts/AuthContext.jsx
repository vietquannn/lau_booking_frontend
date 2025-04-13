// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service'; // Service gọi API Auth
import { favoriteService } from '../services/favorite.service'; // Service gọi API Favorite
import apiClient from '../services/api'; // Axios instance để set/unset header
import { Spinner } from 'react-bootstrap'; // Spinner cho trạng thái loading ban đầu

// --- Tạo Context ---
// Giá trị khởi tạo ban đầu bao gồm state và các hàm NOP (No Operation)
const AuthContext = createContext({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true, // Bắt đầu với loading = true để kiểm tra token
    authError: null,
    favoriteIds: new Set(), // Set chứa ID các món yêu thích
    login: async (email, password) => {},
    logout: async () => {},
    register: async (userData) => {},
    loadUser: async () => {}, // Hàm load lại thông tin user và favorites
    setAuthError: (error) => {}, // Hàm để component con xóa lỗi
    addFavoriteId: (itemId) => {}, // Hàm cập nhật state fav khi thêm
    removeFavoriteId: (itemId) => {}, // Hàm cập nhật state fav khi xóa
});

// --- Component Provider ---
export const AuthProvider = ({ children }) => {
    // --- State quản lý trong context ---
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken') || null); // Lấy token từ localStorage nếu có
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken')); // Xác thực ban đầu dựa trên token storage
    const [loading, setLoading] = useState(true); // Loading trạng thái ban đầu
    const [authError, setAuthError] = useState(null);
    const [favoriteIds, setFavoriteIds] = useState(new Set()); // Dùng Set để lưu ID món yêu thích

    // --- Hàm Helper: Thiết lập token và header Axios ---
    // useCallback để tránh tạo lại hàm không cần thiết
    const setAuthToken = useCallback((newToken) => {
        if (newToken) {
            console.log("Setting auth token in storage and headers");
            localStorage.setItem('authToken', newToken);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            setToken(newToken); // Cập nhật state token
            setIsAuthenticated(true); // Đặt trạng thái đã xác thực
        } else {
            console.log("Clearing auth token");
            localStorage.removeItem('authToken');
            delete apiClient.defaults.headers.common['Authorization']; // Xóa header
            setToken(null);
            setIsAuthenticated(false);
        }
    }, []); // Dependency rỗng vì không phụ thuộc state/props ngoài

    // --- Hàm Helper: Fetch danh sách ID món yêu thích ---
    // Chỉ gọi khi đã xác thực
    const fetchFavoriteIds = useCallback(async () => {
        if (!localStorage.getItem('authToken')) { // Kiểm tra token trực tiếp từ storage
             setFavoriteIds(new Set()); // Reset nếu không có token
             console.log("No token, skipping favorite IDs fetch.");
             return;
         }
        console.log('Fetching favorite IDs...');
        try {
            const response = await favoriteService.getFavoriteIds(); // Gọi API
            if (response.data?.success && Array.isArray(response.data.data)) {
                setFavoriteIds(new Set(response.data.data)); // Cập nhật state bằng Set mới
                console.log('Favorite IDs loaded:', response.data.data);
            } else {
                console.warn("Could not fetch favorite IDs:", response.data?.message);
                setFavoriteIds(new Set()); // Reset nếu API lỗi
            }
        } catch (error) {
            console.error("Error fetching favorite IDs:", error);
            // Không set lỗi chính, có thể chỉ là lỗi tạm thời hoặc user mới chưa có fav
            // Quan trọng là không để lỗi này ngăn cản việc load user
            setFavoriteIds(new Set()); // Reset nếu lỗi
            // Nếu lỗi 401 ở đây, cần xử lý logout (interceptor có thể đã làm)
            if(error.response?.status === 401){
                 logout(); // Gọi hàm logout của context
            }
        }
    }, [/* Không cần dependency nếu logout xử lý đúng */]); // Bỏ isAuthenticated ra để tránh gọi lại thừa

    // --- Hàm load user và favorites ban đầu ---
    const loadUser = useCallback(async () => {
        console.log("AuthContext: loadUser called");
        setLoading(true); // Bắt đầu loading
        setAuthError(null);
        const storedToken = localStorage.getItem('authToken');

        if (storedToken) {
            console.log("Token found in storage, attempting to verify and fetch data...");
            setAuthToken(storedToken); // Set header cho Axios trước khi gọi API
            try {
                // Gọi API /api/user để xác thực token và lấy user data mới nhất
                const response = await authService.getUser();
                if (response.data) { // API /user của Laravel Sanctum thường trả về trực tiếp user data nếu thành công
                    const fetchedUser = response.data;
                    localStorage.setItem('userData', JSON.stringify(fetchedUser)); // Cập nhật user data mới nhất
                    setUser(fetchedUser);
                    setIsAuthenticated(true);
                    await fetchFavoriteIds(); // <<-- Lấy danh sách favorites sau khi có user
                    console.log("User and favorites loaded successfully.");
                } else {
                    // Trường hợp lạ: API success nhưng không có data? Hoặc API /user trả về cấu trúc khác?
                     throw new Error('Invalid user data received from API.');
                }
            } catch (error) {
                // Lỗi xảy ra khi gọi /api/user (thường là 401 nếu token hết hạn/sai)
                console.error("Error loading user data:", error);
                setAuthToken(null); // Xóa token không hợp lệ
                localStorage.removeItem('userData');
                setUser(null);
                setIsAuthenticated(false);
                setFavoriteIds(new Set());
                // Không setAuthError ở đây vì đây là quá trình load nền
            } finally {
                setLoading(false); // Kết thúc loading dù thành công hay thất bại
                console.log("AuthContext: loadUser finished. Loading:", false, "Auth:", isAuthenticated);
            }
        } else {
            // Không có token trong storage
            console.log("No token found in storage.");
            setLoading(false);
            setIsAuthenticated(false);
            setUser(null);
            setFavoriteIds(new Set());
        }
    }, [setAuthToken, fetchFavoriteIds]); // Dependencies

    // --- useEffect chạy loadUser một lần khi Provider mount ---
    useEffect(() => {
        loadUser();
    }, [loadUser]); // Chỉ gọi loadUser khi nó được tạo/thay đổi (ít khi)

    // --- Hàm Đăng Nhập ---
    const login = useCallback(async (email, password) => {
        setLoading(true); // Có thể set loading riêng cho login
        setAuthError(null);
        try {
            const response = await authService.login(email, password);
            if (response.data?.success && response.data.data?.token && response.data.data?.user) {
                const { user: loggedInUser, token: newToken } = response.data.data;
                setAuthToken(newToken); // Lưu token, set header
                localStorage.setItem('userData', JSON.stringify(loggedInUser)); // Lưu user data
                setUser(loggedInUser);
                setIsAuthenticated(true); // Đặt trạng thái xác thực
                await fetchFavoriteIds(); // Lấy danh sách favorites ngay sau khi login
                console.log("Login successful, user and favorites loaded.");
                return loggedInUser; // Trả về user data
            } else {
                throw new Error(response.data?.message || 'Đăng nhập thất bại.');
            }
        } catch (error) {
            console.error("Login error:", error);
            const message = error.response?.data?.message || error.message || 'Đã có lỗi xảy ra.';
            setAuthError(message); // Lưu lỗi để hiển thị
            throw error; // Ném lỗi ra để component biết
        } finally {
            setLoading(false); // Kết thúc loading login
        }
    }, [setAuthToken, fetchFavoriteIds]); // Dependencies

    // --- Hàm Đăng Ký ---
    const register = useCallback(async (userData) => {
        setLoading(true); // Loading riêng cho register
        setAuthError(null);
        try {
            const response = await authService.register(userData);
            if (!response.data?.success) {
                 // Xử lý lỗi validation trả về từ API register
                 if(response.status === 422 && response.data?.errors){
                    throw { response: response }; // Ném lỗi có chứa response để component bắt lỗi validation
                 }
                throw new Error(response.data?.message || 'Đăng ký thất bại.');
            }
            console.log("Registration successful");
            return response.data; // Trả về data nếu cần (vd: message thành công)
        } catch (error) {
            console.error("Register error:", error);
            const message = error.response?.data?.message || error.message || 'Lỗi đăng ký.';
            // Lưu lỗi validation nếu có
            if (error.response?.status === 422 && error.response?.data?.errors) {
                 setAuthError({ message: message, errors: error.response.data.errors });
            } else {
                setAuthError(message);
            }
            throw error; // Ném lỗi ra ngoài
        } finally {
            setLoading(false);
        }
    }, []); // Dependency rỗng

    // --- Hàm Đăng Xuất ---
    const logout = useCallback(async () => {
        console.log("Attempting logout...");
        // setLoading(true); // Có thể thêm loading nếu API logout lâu
        const currentToken = localStorage.getItem('authToken'); // Lấy token hiện tại để gọi API logout
        setAuthToken(null); // Xóa ở client trước (UI phản hồi nhanh)
        localStorage.removeItem('userData');
        setUser(null);
        setIsAuthenticated(false);
        setFavoriteIds(new Set()); // Xóa danh sách yêu thích
        setAuthError(null); // Xóa lỗi cũ

        if (currentToken) { // Chỉ gọi API nếu có token
             try {
                 // Gọi API logout với token cũ (interceptor có thể không lấy được token vừa xóa)
                 await apiClient.post('/logout', {}, {
                     headers: { Authorization: `Bearer ${currentToken}` }
                 });
                 console.log("Logout API call successful");
             } catch (error) {
                // Bỏ qua lỗi API logout vì đã logout ở client rồi
                console.error("Logout API error (client already logged out):", error);
             } finally {
                // setLoading(false);
             }
        }
    }, [setAuthToken]); // Dependency

    // --- Hàm Cập Nhật State favoriteIds Cục Bộ ---
    // Được gọi bởi component sau khi gọi API add/remove favorite thành công
    const addFavoriteId = useCallback((itemId) => {
            setFavoriteIds(prevIds => {
                if (!prevIds.has(itemId)) { // Chỉ cập nhật nếu chưa có
                    const newIds = new Set(prevIds).add(itemId);
                    console.log("Added favorite ID to context state:", itemId, newIds);
                    return newIds;
                }
                return prevIds; // Trả về Set cũ nếu đã tồn tại
            });
    }, []);
     const removeFavoriteId = useCallback((itemId) => {
            setFavoriteIds(prevIds => {
                 if (prevIds.has(itemId)) { // Chỉ cập nhật nếu có
                    const newIds = new Set(prevIds);
                    newIds.delete(itemId);
                    console.log("Removed favorite ID from context state:", itemId, newIds);
                    return newIds;
                 }
                 return prevIds; // Trả về Set cũ nếu không tồn tại
            });
     }, []);

    // --- Hàm để component xóa lỗi (ví dụ: khi user nhập lại form) ---
    const clearAuthError = useCallback(() => {
        setAuthError(null);
    }, []);

    // --- Giá trị cung cấp bởi Context ---
    const value = React.useMemo(() => ({ // Dùng useMemo để tối ưu
        user,
        token,
        isAuthenticated,
        loading, // Trạng thái loading chung (chủ yếu là lúc khởi động)
        authError, // Lỗi từ các hàm login/register
        favoriteIds, // Set các ID yêu thích
        login,
        logout,
        register,
        loadUser, // Có thể cần gọi lại nếu muốn refresh user/favorites
        setAuthError: clearAuthError, // Đổi tên thành clearAuthError cho rõ nghĩa
        addFavoriteId, // Hàm cập nhật state favorite
        removeFavoriteId // Hàm cập nhật state favorite
    }), [user, token, isAuthenticated, loading, authError, favoriteIds, login, logout, register, loadUser, clearAuthError, addFavoriteId, removeFavoriteId]); // Liệt kê dependencies


    // Hiển thị loading toàn trang khi đang kiểm tra token ban đầu
    if (loading) {
         return (
            <div className="vh-100 d-flex justify-content-center align-items-center">
                 <Spinner animation="grow" variant="primary" />
            </div>
         );
    }

    // Sau khi loading xong, render Provider với children
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Export Context để dùng với useContext
export default AuthContext;