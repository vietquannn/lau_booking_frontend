import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

// ScrollToTop component to reset scroll position on route changes
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

function MainLayout() {
    return (
        <div className="d-flex flex-column min-vh-100"> {/* Ensure footer stays at bottom */}
            <Header />
            <ScrollToTop />
            {/* Add class for general page padding */}
            <main className="flex-grow-1 page-container">
                 <Outlet /> {/* Renders the matched child route's component */}
            </main>
            <Footer />
            <Toaster position="top-right" />
        </div>
    );
}

export default MainLayout;