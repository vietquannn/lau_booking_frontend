// src/pages/MyFavoritesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Pagination, Card, Toast, ToastContainer, Tooltip, OverlayTrigger } from 'react-bootstrap'; // Thêm Tooltip, OverlayTrigger
import { Link, useSearchParams } from 'react-router-dom';
import { favoriteService } from '../services/favorite.service';
import { useAuth } from '../hooks/useAuth';
import MenuItemCard from '../components/menu/MenuItemCard.jsx'; // Tái sử dụng card

// Component Tooltip (có thể đưa ra file utils nếu dùng nhiều)
const renderTooltip = (props, text) => (
  <Tooltip id={`tooltip-${Math.random()}`} {...props}>
    {text}
  </Tooltip>
);

function MyFavoritesPage() {
    const { isAuthenticated, removeFavoriteId } = useAuth(); // Lấy trạng thái và hàm cập nhật context
    const [favorites, setFavorites] = useState([]); // Mảng object MenuItem
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0, per_page: 12 });
    const [searchParams, setSearchParams] = useSearchParams();
    const [removingId, setRemovingId] = useState(null); // ID của item đang bị xóa
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('info'); // Mặc định là info

    const currentPage = parseInt(searchParams.get('page') || '1');
    const itemsPerPage = 12; // Số item mỗi trang

    // --- Hàm Fetch Favorites ---
    const fetchFavorites = useCallback(async (page) => {
        if (!isAuthenticated) { setLoading(false); setFavorites([]); return; } // Không fetch nếu chưa login, reset state
        setLoading(true); setError(null);
        try {
            const response = await favoriteService.getFavorites(page, itemsPerPage);
            if (response.data?.success) {
                setFavorites(response.data.data.data || []);
                setPagination({
                    current_page: response.data.data.current_page,
                    last_page: response.data.data.last_page,
                    total: response.data.data.total,
                    from: response.data.data.from,
                    to: response.data.data.to,
                    per_page: response.data.data.per_page,
                 });
            } else {
                 setError(response.data?.message || 'Lỗi tải danh sách yêu thích.');
                 setFavorites([]); setPagination({ current_page: 1, last_page: 1, total: 0 });
            }
        } catch (err) {
            console.error("Lỗi tải favorites:", err);
            if (err.response?.status !== 401) { setError(err.response?.data?.message || err.message || 'Lỗi kết nối.'); }
             setFavorites([]); setPagination({ current_page: 1, last_page: 1, total: 0 });
        } finally { setLoading(false); }
    }, [isAuthenticated, itemsPerPage]); // Phụ thuộc isAuthenticated

    // --- useEffect gọi fetch khi trang hoặc isAuthenticated thay đổi ---
    useEffect(() => {
        fetchFavorites(currentPage);
    }, [currentPage, fetchFavorites]); // fetchFavorites đã bao gồm isAuthenticated

    // --- Hàm Xử Lý Bỏ Yêu Thích ---
    const handleRemoveFavorite = useCallback(async (item) => {
        if (!item || removingId === item.id) return;
        // Không cần confirm lần nữa vì nút đã là nút xóa
        // if(window.confirm(`Bạn có chắc muốn bỏ yêu thích món "${item.name}"?`)) { ... }

        setRemovingId(item.id); // Đánh dấu đang xóa
        setError(null);
        try {
            const identifier = item.slug || item.id; // Ưu tiên slug
            await favoriteService.removeFavorite(identifier);

            // Cập nhật Context trước
            removeFavoriteId(item.id);

            // Cập nhật UI cục bộ ngay lập tức
            setFavorites(prev => prev.filter(fav => fav.id !== item.id));
            setPagination(prev => ({...prev, total: Math.max(0, prev.total - 1) }));

            // Hiển thị thông báo
            setToastVariant('info'); // Dùng màu info cho thông báo xóa
            setToastMessage(`Đã xóa "${item.name}" khỏi danh sách yêu thích.`);
            setShowToast(true);

        } catch (err) {
             console.error("Lỗi xóa favorite:", err);
             if (err.response?.status !== 401) {
                 setToastVariant('danger');
                 setToastMessage(`Lỗi xóa yêu thích: ${err.response?.data?.message || err.message}`);
                 setShowToast(true);
             }
             // Không cần rollback state vì context là nguồn chính
        } finally {
            setRemovingId(null); // Reset trạng thái
        }
    }, [removeFavoriteId, removingId, pagination.total]); // Cập nhật dependency

    // --- Hàm Đổi Trang Phân Trang ---
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= pagination.last_page && pageNumber !== currentPage && !loading) {
           const newSearchParams = new URLSearchParams(searchParams);
           newSearchParams.set('page', pageNumber.toString());
           setSearchParams(newSearchParams);
        }
    };

     // --- Render Component Phân Trang ---
     const renderPagination = () => {
        if (!pagination || pagination.last_page <= 1) return null;
        const items = []; const pageLimit = 2; const totalPagesToShow = 5;
        let startPage, endPage;
        // Logic tính toán startPage, endPage (giữ nguyên như trước)
        if(pagination.last_page <= totalPagesToShow + 2){ startPage=1; endPage = pagination.last_page; }
        else { const maxP = pageLimit; const maxA = pageLimit; if(currentPage<=maxP+1){ startPage=1; endPage=totalPagesToShow;} else if(currentPage>=pagination.last_page-maxP){ startPage=pagination.last_page-totalPagesToShow+1; endPage=pagination.last_page;} else{ startPage=currentPage-maxP; endPage=currentPage+maxA;}}
        // Render nút
        items.push( <Pagination.First key="first" onClick={()=>handlePageChange(1)} disabled={currentPage===1 || loading}/> );
        items.push( <Pagination.Prev key="prev" onClick={()=>handlePageChange(currentPage-1)} disabled={currentPage===1 || loading}/> );
        if(startPage>1){ items.push(<Pagination.Item key={1} onClick={()=>handlePageChange(1)} disabled={loading}>{1}</Pagination.Item>); if(startPage>2) items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />); }
        for (let p=startPage; p<=endPage; p++){ items.push(<Pagination.Item key={p} active={p===currentPage} onClick={()=>handlePageChange(p)} disabled={loading}>{p}</Pagination.Item>); }
        if(endPage<pagination.last_page){ if(endPage<pagination.last_page-1) items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />); items.push(<Pagination.Item key={pagination.last_page} onClick={()=>handlePageChange(pagination.last_page)} disabled={loading}>{pagination.last_page}</Pagination.Item>); }
        items.push( <Pagination.Next key="next" onClick={()=>handlePageChange(currentPage+1)} disabled={currentPage===pagination.last_page || loading}/> );
        items.push( <Pagination.Last key="last" onClick={()=>handlePageChange(pagination.last_page)} disabled={currentPage===pagination.last_page || loading}/> );
        // Trả về component Pagination
        return <Pagination size="sm" className="mt-4 mb-0 justify-content-center">{items}</Pagination>; // Bỏ justify-content-md-end, luôn căn giữa
     };


    // ---- Render ----
    return (
        <Container className="page-container">
            <h1 className="mb-4">Món Ăn Yêu Thích</h1>

             {/* Toast Container */}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1055 }}>
                <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg={toastVariant} text={toastVariant === 'light' ? 'dark' : 'white'}>
                    <Toast.Header closeButton={true} className={`bg-${toastVariant} text-white`}> <strong className="me-auto">Thông báo</strong> </Toast.Header>
                    <Toast.Body>{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>

            {/* Kiểm tra đăng nhập */}
            {!isAuthenticated && !loading && ( <Alert variant="warning" className="text-center">Vui lòng <Link to="/login?redirect=/my-favorites" className="alert-link">đăng nhập</Link> để xem và quản lý danh sách yêu thích.</Alert> )}

            {/* Hiển thị khi đã đăng nhập */}
            {isAuthenticated && (
                <>
                    {/* Loading */}
                    {loading && <div className="text-center my-5"><Spinner animation="border" variant="primary" style={{width: '3rem', height: '3rem'}}/></div>}
                    {/* Lỗi */}
                    {error && !loading && <Alert variant="danger">Lỗi: {error}</Alert>}
                    {/* Danh sách trống */}
                    {!loading && !error && favorites.length === 0 && (
                        <Alert variant="light" className='text-center border'>
                            <i className="bi bi-heartbreak fs-1 text-muted d-block mb-2"></i> {/* Icon trái tim vỡ */}
                            Bạn chưa có món ăn yêu thích nào.
                            <br/>
                            <Button as={Link} to="/menu" variant="link" className="p-0 alert-link mt-1">Khám phá thực đơn ngay!</Button>
                        </Alert>
                    )}
                    {/* Hiển thị danh sách */}
                    {!loading && !error && favorites.length > 0 && (
                         <>
                            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                                  {favorites.map(item => (
                                       <Col key={item.id} className="position-relative">
                                            {/* Truyền hideFavoriteButton={true} */}
                                            <MenuItemCard item={item} hideFavoriteButton={true} />
                                             {/* Nút xóa riêng biệt */}
                                             <OverlayTrigger placement="left" overlay={(props) => renderTooltip(props, "Bỏ yêu thích")}>
                                                 <Button
                                                     variant="danger"
                                                     size="sm"
                                                     onClick={() => handleRemoveFavorite(item)}
                                                     disabled={removingId === item.id}
                                                     className="position-absolute top-0 end-0 m-2 rounded-circle"
                                                     style={{ zIndex: 2, padding: '0.2rem 0.5rem', lineHeight: 1 }}
                                                 >
                                                      {removingId === item.id ? <Spinner animation="border" size="sm" variant="light"/> : <i className="bi bi-trash-fill"></i>}
                                                 </Button>
                                             </OverlayTrigger>
                                       </Col>
                                  ))}
                             </Row>
                              {/* Phân trang */}
                              {renderPagination()}
                         </>
                    )}
                </>
            )}
        </Container>
    );
}

export default MyFavoritesPage;