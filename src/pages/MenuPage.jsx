import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Form, InputGroup, Button } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom'; // Thêm Link
import { menuService } from '../services/menu.service';
import MenuItemCard from '../components/menu/MenuItemCard.jsx';
import styles from './MenuPage.module.css'; // Import CSS Module

function MenuPage() {
  const [categoriesData, setCategoriesData] = useState([]); // Lưu categories từ API /menu
  const [menuItems, setMenuItems] = useState([]); // Lưu kết quả lọc/tìm kiếm từ API /menu-items
  const [allCategories, setAllCategories] = useState([]); // Lưu danh sách tất cả category để hiển thị bộ lọc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams(); // Hook để quản lý query params

  // Lấy tham số từ URL
  const searchTerm = searchParams.get('q') || '';
  const selectedCategorySlug = searchParams.get('category') || ''; // Lấy slug từ URL
  // TODO: Thêm state và đọc params cho các bộ lọc khác (giá, chay...)

  // Effect để lấy dữ liệu dựa trên URL params
  useEffect(() => {
    const fetchMenuData = async () => {
      setLoading(true);
      setError(null);
      setCategoriesData([]); // Reset data cũ
      setMenuItems([]);     // Reset data cũ

      try {
        // Luôn lấy danh sách tất cả categories để hiển thị bộ lọc
        const catResponse = await menuService.getCategories();
        if (catResponse.data?.success) {
            setAllCategories(catResponse.data.data || []);
        } else {
            console.warn("Could not fetch categories for filter."); // Log warning thay vì set error
        }

        // Tạo object params cho API search/filter
        const params = {};
        if (searchTerm) params.q = searchTerm;
        if (selectedCategorySlug) params.category = selectedCategorySlug;
        // TODO: Thêm các params lọc khác vào đây

        // Nếu có tham số tìm kiếm hoặc lọc, gọi API search/filter
        if (Object.keys(params).length > 0) {
            const searchResponse = await menuService.searchMenuItems(params);
            if (searchResponse.data?.success) {
                 // API search trả về cấu trúc phân trang, lấy data
                 // Tạm thời chưa xử lý phân trang ở đây
                setMenuItems(searchResponse.data.data.data || []);
            } else {
                 setError(searchResponse.data?.message || 'Lỗi tìm kiếm/lọc món ăn.');
            }
        } else {
            // Nếu không có lọc/search, lấy toàn bộ menu group theo category
            const menuResponse = await menuService.getFullMenu();
            if (menuResponse.data?.success) {
              // API đã lọc sẵn category rỗng, không cần lọc lại ở client
              setCategoriesData(menuResponse.data.data || []);
            } else {
              setError(menuResponse.data?.message || 'Không thể tải thực đơn.');
            }
        }

      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trang thực đơn:", err);
        const errorMessage = err.response?.data?.message || err.message || 'Lỗi kết nối hoặc lỗi không xác định.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [searchParams]); // Chạy lại effect khi query params (searchParams) thay đổi

 // Hàm xử lý khi người dùng thay đổi giá trị trong bộ lọc (select)
 const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
        newSearchParams.set(name, value);
    } else {
        newSearchParams.delete(name); // Xóa param nếu chọn "Tất cả"
    }
    // Reset về trang 1 khi thay đổi bộ lọc
    newSearchParams.delete('page');
    setSearchParams(newSearchParams); // Cập nhật URL params, sẽ trigger useEffect chạy lại
 };

 // Hàm xử lý khi submit form tìm kiếm
 const handleSearchSubmit = (event) => {
     event.preventDefault();
     const formData = new FormData(event.target);
     const newSearchTerm = formData.get('q')?.trim(); // Lấy và xóa khoảng trắng thừa
     const newSearchParams = new URLSearchParams(searchParams);
     if (newSearchTerm) {
         newSearchParams.set('q', newSearchTerm);
     } else {
         newSearchParams.delete('q'); // Xóa param nếu ô tìm kiếm rỗng
     }
     newSearchParams.delete('page'); // Reset về trang 1
     setSearchParams(newSearchParams);
 }

 // Hàm xóa tất cả bộ lọc/tìm kiếm
 const clearFilters = () => {
     setSearchParams({}); // Đặt params thành rỗng, trigger useEffect
 };


  // ---- Render ----
  if (loading) {
    return (
      <Container className={`text-center ${styles.loadingSpinner}`}>
        <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Đang tải...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="page-container"> {/* Thêm class */}
        <Alert variant="danger" className={styles.errorMessage}>Lỗi: {error}</Alert>
      </Container>
    );
  }

  // Xác định xem nên hiển thị kết quả lọc/search hay hiển thị theo category
  const isFilteringOrSearching = menuItems.length > 0 || searchTerm || selectedCategorySlug;
  const itemsToDisplay = isFilteringOrSearching ? menuItems : []; // Chỉ dùng menuItems khi lọc/search

  return (
    <Container className="page-container"> {/* Thêm class */}
      <h1 className="mb-4 text-center fw-bold">Thực Đơn Nhà Hàng</h1>

       {/* Bộ lọc và Tìm kiếm */}
       <Row className="mb-4 p-3 bg-white rounded shadow-sm align-items-center sticky-top" style={{ top: '70px', zIndex: 100 }}> {/* Sticky filter bar */}
            <Col md={5} lg={4} className="mb-2 mb-md-0">
                 <Form onSubmit={handleSearchSubmit}>
                    <InputGroup>
                      <Form.Control
                          type="search"
                          placeholder="Tìm tên món..."
                          name="q"
                          defaultValue={searchTerm}
                          aria-label="Search"
                      />
                      <Button variant="outline-primary" type="submit">
                         <i className="bi bi-search"></i> {/* Icon tìm kiếm */}
                      </Button>
                    </InputGroup>
                 </Form>
            </Col>
            <Col md={4} lg={3} className="mb-2 mb-md-0">
                 <Form.Select
                      aria-label="Lọc theo danh mục"
                      name="category"
                      value={selectedCategorySlug} // Giá trị hiện tại từ URL
                      onChange={handleFilterChange} // Gọi hàm khi thay đổi
                  >
                      <option value="">Tất cả danh mục</option>
                      {/* Render options từ state allCategories */}
                      {allCategories.map(cat => (
                          <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                      ))}
                 </Form.Select>
            </Col>
            {/* TODO: Thêm các bộ lọc khác (Giá, Chay...) */}

             {/* Nút xóa lọc chỉ hiển thị khi có filter/search active */}
             {(searchTerm || selectedCategorySlug) && (
                <Col md="auto" className="ms-md-auto text-md-end mt-2 mt-md-0">
                    <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                        <i className="bi bi-x-lg me-1"></i> Xóa lọc
                    </Button>
                </Col>
             )}
       </Row>


      {/* Hiển thị kết quả */}
      {isFilteringOrSearching ? ( // Nếu đang lọc/tìm kiếm
        <div className="mb-5">
           <h2 className={styles.categoryTitle}>
                {searchTerm && `Kết quả cho "${searchTerm}"`}
                {selectedCategorySlug && allCategories.find(c=>c.slug===selectedCategorySlug) && ` trong "${allCategories.find(c=>c.slug===selectedCategorySlug).name}"`}
                {!searchTerm && !selectedCategorySlug && 'Kết quả lọc'} {/* Fallback */}
           </h2>
           {itemsToDisplay.length > 0 ? (
              <Row xs={1} sm={2} md={3} lg={4} className={`g-4 ${styles.menuGrid}`}>
                {itemsToDisplay.map((item) => (
                  <Col key={item.id}><MenuItemCard item={item} /></Col>
                ))}
              </Row>
           ) : (
             <Alert variant="info">Không tìm thấy món ăn nào phù hợp với tiêu chí của bạn.</Alert>
           )}
        </div>
      ) : ( // Nếu không lọc/tìm kiếm, hiển thị theo category
        categoriesData.length > 0 ? (
            categoriesData.map((category) => (
              <div key={category.id} className="mb-5">
                <h2 className={styles.categoryTitle}>{category.name}</h2>
                <Row xs={1} sm={2} md={3} lg={4} className={`g-4 ${styles.menuGrid}`}>
                  {category.menu_items.map((item) => (
                    <Col key={item.id}><MenuItemCard item={item} /></Col>
                  ))}
                </Row>
              </div>
            ))
        ) : (
            // Hiển thị khi menu trống hoàn toàn (không loading, không error, không filter, không data)
             <Alert variant="warning">Thực đơn hiện đang được cập nhật. Vui lòng quay lại sau.</Alert>
        )
      )}

      {/* TODO: Thêm Pagination nếu API search trả về nhiều trang */}

    </Container>
  );
}

export default MenuPage;