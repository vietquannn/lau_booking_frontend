// // src/components/admin/layout/AdminSidebar.jsx
// import React from 'react';
// import { Nav } from 'react-bootstrap';
// import { NavLink, useNavigate } from 'react-router-dom'; // Import NavLink và useNavigate
// import { adminAuthService } from '../../../services/admin.auth.service'; // Import service để logout
// // Import các icons từ react-bootstrap-icons (đảm bảo đã cài đặt: npm install react-bootstrap-icons)
// import {
//     Speedometer2, // Dashboard
//     CalendarCheckFill, // Bookings
//     TagsFill, // Categories
//     ListStars, // Menu Items
//     BoundingBox, // Table Types
//     Grid3x3GapFill, // Tables
//     PeopleFill, // Users
//     StarHalf, // Reviews
//     Percent, // Promotions
//     BarChartLineFill, // Reports (ví dụ)
//     ChatLeftTextFill, // Chat (ví dụ)
//     BoxArrowLeft // Logout
// } from 'react-bootstrap-icons';

// function AdminSidebar() {
//   const navigate = useNavigate();

//   // --- Hàm xử lý đăng xuất Admin ---
//   const handleAdminLogout = async (e) => {
//       e.preventDefault(); // Ngăn hành vi mặc định của link
//       if(window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi trang Admin?")) {
//           console.log('Admin logging out...');
//           try {
//               await adminAuthService.logout(); // Gọi API logout
//           } catch (error) {
//               console.error('Admin Logout API error (continuing client logout):', error);
//               // Vẫn tiếp tục logout ở client dù API có thể lỗi
//           } finally {
//                localStorage.removeItem('adminAuthToken'); // Xóa token admin
//                localStorage.removeItem('adminData'); // Xóa data admin (nếu có lưu)
//                navigate('/admin/login'); // Chuyển hướng về trang login admin
//           }
//       }
//   };

//   // --- Định nghĩa Style cho NavLink (có thể đưa ra file CSS) ---
//   const linkStyle = {
//       color: 'rgba(255, 255, 255, 0.7)', // Màu chữ mặc định (xám trắng)
//       padding: '0.8rem 1rem', // Padding
//       display: 'flex',
//       alignItems: 'center',
//       marginBottom: '0.2rem', // Khoảng cách nhỏ giữa các mục
//       borderRadius: '0.375rem', // Bo góc nhẹ
//       textDecoration: 'none',
//       transition: 'background-color 0.15s ease-in-out, color 0.15s ease-in-out' // Hiệu ứng hover
//   };

//   const activeLinkStyle = {
//      backgroundColor: 'rgba(255, 255, 255, 0.15)', // Nền sáng hơn khi active
//      color: '#ffffff', // Chữ trắng khi active
//      fontWeight: '500' // Đậm hơn chút
//   };

//   // --- Hàm trả về style cho NavLink dựa trên trạng thái active ---
//   const getNavLinkStyle = ({ isActive }) => ({
//     ...linkStyle, // Áp dụng style cơ bản
//     ...(isActive ? activeLinkStyle : {}) // Áp dụng thêm style active nếu link đang active
//   });

//   return (
//     // Sidebar cố định bên trái, nền tối, padding, có scroll nếu nội dung dài
//     <Nav
//         className="flex-column bg-dark vh-100 p-3 shadow-lg d-flex flex-column" // Thêm d-flex, flex-column
//         style={{
//             width: '250px',
//             position: 'fixed',
//             top: 0,
//             left: 0,
//             overflowY: 'auto', // Cho phép cuộn dọc
//             color: '#fff' // Đặt màu chữ mặc định cho cả sidebar
//         }}
//     >
//       {/* Logo hoặc Tên trang Admin */}
//       <div className="text-center mb-4 mt-2 flex-shrink-0"> {/* flex-shrink-0 */}
//           <NavLink to="/admin/dashboard" className="text-decoration-none">
//              {/* <img src="/admin-logo.png" alt="Admin Logo" width="50" className="mb-2"/> */}
//              <h4 className="text-white fw-bold">ADMIN PANEL</h4>
//              <small className='text-white-50'>Restaurant Booking</small> {/* Màu sáng hơn */}
//           </NavLink>
//           <hr className="text-secondary mt-3"/> {/* Thêm đường kẻ */}
//       </div>

//         {/* Các mục menu */}
//         <div className="flex-grow-1"> {/* Phần menu chính chiếm không gian còn lại */}
//             <Nav.Item>
//                 <Nav.Link as={NavLink} to="/admin/dashboard" style={getNavLinkStyle}>
//                     <Speedometer2 size={18} className="me-3 flex-shrink-0" /> {/* Tăng margin phải */}
//                     <span>Dashboard</span>
//                 </Nav.Link>
//             </Nav.Item>

//             <Nav.Item>
//                 <Nav.Link as={NavLink} to="/admin/bookings" style={getNavLinkStyle}>
//                     <CalendarCheckFill size={18} className="me-3 flex-shrink-0" />
//                     <span>Quản lý Đặt Bàn</span>
//                 </Nav.Link>
//             </Nav.Item>

//             {/* Nhóm Quản lý Thực đơn */}
//             <Nav.Item>
//                 <div className="text-secondary small text-uppercase px-3 mt-3 mb-1 fw-semibold">Thực Đơn</div> {/* Đổi màu và font weight */}
//                 <Nav.Link as={NavLink} to="/admin/menu/categories" style={getNavLinkStyle}>
//                     <TagsFill size={18} className="me-3 flex-shrink-0" />
//                     <span>Danh Mục</span>
//                 </Nav.Link>
//                 <Nav.Link as={NavLink} to="/admin/menu/items" style={getNavLinkStyle}>
//                     <ListStars size={18} className="me-3 flex-shrink-0" />
//                     <span>Món Ăn</span>
//                 </Nav.Link>
//                 {/* <Nav.Link as={NavLink} to="/admin/menu/combos" style={getNavLinkStyle} className="disabled"> ... Combo </Nav.Link> */}
//             </Nav.Item>

//             {/* Nhóm Quản lý Bàn */}
//              <Nav.Item>
//                 <div className="text-secondary small text-uppercase px-3 mt-3 mb-1 fw-semibold">Bàn Ghế</div>
//                  <Nav.Link as={NavLink} to="/admin/tables/types" style={getNavLinkStyle}>
//                       <BoundingBox size={18} className="me-3 flex-shrink-0" />
//                       <span>Loại Bàn</span>
//                  </Nav.Link>
//                  <Nav.Link as={NavLink} to="/admin/tables" style={getNavLinkStyle}>
//                       <Grid3x3GapFill size={18} className="me-3 flex-shrink-0" />
//                       <span>Danh sách Bàn</span>
//                  </Nav.Link>
//              </Nav.Item>

//             {/* Nhóm Quản lý Chung */}
//              <Nav.Item>
//                 <div className="text-secondary small text-uppercase px-3 mt-3 mb-1 fw-semibold">Quản lý Chung</div>
//                 <Nav.Link as={NavLink} to="/admin/users" style={getNavLinkStyle}>
//                     <PeopleFill size={18} className="me-3 flex-shrink-0" />
//                     <span>Người Dùng</span>
//                 </Nav.Link>
//                 <Nav.Link as={NavLink} to="/admin/reviews" style={getNavLinkStyle}>
//                     <StarHalf size={18} className="me-3 flex-shrink-0" />
//                     <span>Đánh Giá</span>
//                 </Nav.Link>
//                 <Nav.Link as={NavLink} to="/admin/promotions" style={getNavLinkStyle}>
//                      <Percent size={18} className="me-3 flex-shrink-0" />
//                      <span>Khuyến Mãi</span>
//                 </Nav.Link>
//               </Nav.Item>

//               {/* Báo cáo & Chat (Tạm disable) */}
//                <Nav.Item>
//                    <div className="text-secondary small text-uppercase px-3 mt-3 mb-1 fw-semibold">Thống kê & CSKH</div>
//                    <Nav.Link as={NavLink} to="/admin/reports" style={getNavLinkStyle} className="disabled" onClick={(e)=>e.preventDefault()}>
//                        <BarChartLineFill size={18} className="me-3 flex-shrink-0" />
//                        <span>Báo Cáo</span>
//                    </Nav.Link>
//                    <Nav.Link as={NavLink} to="/admin/chat" style={getNavLinkStyle} className="disabled" onClick={(e)=>e.preventDefault()}>
//                         <ChatLeftTextFill size={18} className="me-3 flex-shrink-0" />
//                         <span>Quản lý Chat</span>
//                    </Nav.Link>
//                 </Nav.Item>
//         </div>


//         {/* Divider và Logout */}
//         <div className="mt-auto flex-shrink-0"> {/* Đẩy xuống cuối cùng */}
//             <hr className="text-secondary my-2"/>
//             <Nav.Item>
//                 <Nav.Link
//                     href="#"
//                     onClick={handleAdminLogout} // Gọi hàm logout
//                     style={linkStyle} // Dùng style chung
//                     className='text-warning' // Màu vàng nổi bật
//                     title="Đăng xuất khỏi tài khoản Admin"
//                 >
//                     <BoxArrowLeft size={18} className="me-3 flex-shrink-0" />
//                     <span>Đăng xuất</span>
//                 </Nav.Link>
//             </Nav.Item>
//         </div>

//     </Nav>
//   );
// }

// export default AdminSidebar;