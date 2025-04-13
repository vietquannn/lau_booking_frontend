// // src/components/admin/layout/AdminLayout.jsx
// import React from 'react';
// import { Outlet } from 'react-router-dom';
// import AdminSidebar from './AdminSidebar';
// // import AdminHeader from './AdminHeader'; // Import nếu có

// function AdminLayout() {
//   return (
//     <div style={{ display: 'flex' }}>
//       <AdminSidebar />
//       {/* Phần content chính, có padding left bằng chiều rộng sidebar */}
//       <div style={{ marginLeft: '250px', flexGrow: 1, padding: '20px' }}>
//          {/* {<AdminHeader />} */} {/* Header riêng nếu có */}
//          <main>
//             <Outlet /> {/* Nội dung của trang admin con sẽ hiển thị ở đây */}
//          </main>
//       </div>
//     </div>
//   );
// }

// export default AdminLayout;