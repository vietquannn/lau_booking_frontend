import React, { useState, useEffect } from 'react';
import { Container, Button, Row, Col, Spinner, Alert, Card, Carousel } from 'react-bootstrap';
import { menuService } from '../services/menu.service'; // Import service
import { reviewService } from '../services/review.service';
import MenuItemCard from '../components/menu/MenuItemCard.jsx'; // Import card
import { Link } from 'react-router-dom';
import './HomePage.css';

// Banner images
const bannerImages = [
  {
    url: '/images/banner1.jpg',
    title: 'Thưởng Thức Lẩu Đỉnh Cao',
    subtitle: 'Hương vị đậm đà, nguyên liệu tươi ngon'
  },
  {
    url: '/images/banner2.jpg',
    title: 'Không Gian Ấm Cúng',
    subtitle: 'Thiết kế hiện đại, thân thiện với gia đình'
  },
  {
    url: '/images/banner3.jpg',
    title: 'Phục Vụ Chuyên Nghiệp',
    subtitle: 'Đội ngũ nhân viên nhiệt tình, chu đáo'
  }
];

function HomePage() {
  const [hotItems, setHotItems] = useState([]);
  const [loadingHotItems, setLoadingHotItems] = useState(true);
  const [errorHotItems, setErrorHotItems] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [errorReviews, setErrorReviews] = useState(null);

  // Fetch Hot Items
  useEffect(() => {
    const fetchHotItems = async () => {
      setLoadingHotItems(true);
      setErrorHotItems(null);
      try {
        const response = await menuService.getHotItems(); // Gọi API lấy món hot
        if (response.data?.success) {
          setHotItems(response.data.data);
        } else {
          console.warn("Could not fetch hot items:", response.data?.message);
        }
      } catch (err) {
        console.error("Lỗi tải món hot:", err);
      } finally {
        setLoadingHotItems(false);
      }
    };
    fetchHotItems();
  }, []); // Chạy 1 lần khi component mount

  // Fetch Featured Reviews
  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      setErrorReviews(null);
      try {
        const response = await reviewService.getFeaturedReviews(5); // Lấy 5 review
        if (response.data?.success) {
          setReviews(response.data.data || []);
        } else {
          // Không cần báo lỗi lớn ở trang chủ nếu không tải được review
          console.warn("Could not fetch featured reviews:", response.data?.message);
        }
      } catch (err) {
        console.error("Lỗi tải đánh giá nổi bật:", err);
        // Không set error chính
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, []); // Chạy 1 lần

  // --- Hàm render sao đánh giá ---
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i key={i} className={`bi bi-star-fill ${i <= rating ? 'text-warning' : 'text-light'}`} style={{fontSize: '0.9rem'}}></i>
      );
    }
    return stars;
  };

  return (
    <>
      {/* Hero Banner Section */}
      <section className="hero-banner">
        <Carousel 
          indicators={true}
          interval={5000}
          pause="hover"
          className="h-100"
        >
          {bannerImages.map((banner, index) => (
            <Carousel.Item key={index} className="hero-slide" style={{backgroundImage: `url(${banner.url})`}}>
              <div className="hero-content">
                <h1 className="hero-title">{banner.title}</h1>
                <p className="hero-subtitle">{banner.subtitle}</p>
                <Button 
                  variant="warning" 
                  size="lg" 
                  className="hero-button"
                  as={Link} 
                  to="/booking"
                >
                  Đặt Bàn Ngay
                </Button>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </section>

      {/* Featured Items Section */}
      <section className="featured-section">
        <Container>
          <div className="section-title">
            <h2>Món Ăn Đặc Sắc</h2>
            <p>Khám phá những món ăn nổi bật của chúng tôi</p>
          </div>
          {loadingHotItems && <div className="text-center"><Spinner animation="border" variant="primary" /></div>}
          {errorHotItems && <Alert variant="danger">{errorHotItems}</Alert>}
          <Row xs={1} md={2} lg={4} className="g-4">
            {hotItems.map(item => (
              <Col key={item.id}>
                <MenuItemCard item={item} />
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* About Section */}
      <section className="about-section">
        <Container>
          <div className="section-title">
            <h2>Về Chúng Tôi</h2>
            <p>Khám phá câu chuyện của nhà hàng Lẩu Ngon</p>
          </div>
          <Row className="align-items-center">
            <Col md={6}>
              <div className="about-image">
                <img src="/images/about.jpg" alt="About Us" className="img-fluid" />
              </div>
            </Col>
            <Col md={6}>
              <div className="about-content">
                <h3 className="mb-4">Hương Vị Truyền Thống</h3>
                <p className="about-text">
                  Nhà hàng Lẩu Ngon được thành lập với mong muốn mang đến cho thực khách những món ăn 
                  truyền thống với hương vị đặc trưng. Chúng tôi tự hào về công thức nước lẩu gia truyền 
                  và cách chọn lọc nguyên liệu tươi ngon.
                </p>
                <p className="about-text">
                  Với không gian ấm cúng và đội ngũ nhân viên chuyên nghiệp, chúng tôi cam kết mang đến 
                  trải nghiệm ẩm thực tuyệt vời cho mọi khách hàng.
                </p>
                <Button 
                  variant="outline-primary" 
                  className="mt-3"
                  as={Link} 
                  to="/about"
                >
                  Tìm Hiểu Thêm
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Reviews Section */}
      <section className="reviews-section">
        <Container>
          <div className="section-title">
            <h2>Khách Hàng Nói Gì?</h2>
            <p>Những đánh giá từ khách hàng của chúng tôi</p>
          </div>
          {loadingReviews && <div className="text-center"><Spinner animation="border" variant="secondary" /></div>}
          {!loadingReviews && !errorReviews && reviews.length > 0 && (
            <div className="position-relative">
              <Carousel 
                indicators={true}
                interval={null}
                pause="hover"
                className="review-carousel"
                prevIcon={
                  <span className="carousel-control-prev-icon bg-primary rounded-circle p-3">
                    <i className=""></i>
                  </span>
                }
                nextIcon={
                  <span className="carousel-control-next-icon bg-primary rounded-circle p-3">
                    <i className=""></i>
                  </span>
                }
              >
                {reviews.map((review) => (
                  <Carousel.Item key={review.id}>
                    <div className="review-item">
                      <img 
                        src={review.user_avatar || '/images/default-avatar.png'} 
                        alt="User Avatar" 
                        className="review-avatar"
                      />
                      <div className="review-stars">{renderStars(review.rating)}</div>
                      <p className="review-text">"{review.comment}"</p>
                      <p className="review-author">{review.user_display_name || 'Một khách hàng'}</p>
                      <p className="review-date">{new Date(review.created_at).toLocaleDateString('vi-VN')}</p>
                      {review.restaurant_response && (
                        <div className="restaurant-response">
                          <strong className="d-block text-primary mb-1">Nhà hàng phản hồi:</strong>
                          {review.restaurant_response}
                        </div>
                      )}
                    </div>
                  </Carousel.Item>
                ))}
              </Carousel>
              <div className="text-center mt-3">
                <small className="text-muted">
                  Bấm vào mũi tên để xem thêm đánh giá
                </small>
              </div>
            </div>
          )}
          {!loadingReviews && !errorReviews && reviews.length === 0 && (
            <p className="text-center text-muted">Chưa có đánh giá nào nổi bật.</p>
          )}
        </Container>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-us">
        <Container>
          <h2 className="text-center mb-5 fw-bold">Tại Sao Chọn Lẩu Ngon?</h2>
          <Row>
            <Col md={4} className="text-center mb-4">
              <div className="feature-icon">🍲</div>
              <h3 className="h4 mb-3">Hương Vị Độc Đáo</h3>
              <p className="text-muted">Nước lẩu gia truyền, công thức riêng biệt, đậm đà khó quên</p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="feature-icon">🌿</div>
              <h3 className="h4 mb-3">Nguyên Liệu Tươi Sạch</h3>
              <p className="text-muted">Thịt, hải sản, rau củ được chọn lọc kỹ càng, đảm bảo an toàn vệ sinh</p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="feature-icon">👥</div>
              <h3 className="h4 mb-3">Không Gian Ấm Cúng</h3>
              <p className="text-muted">Thiết kế hiện đại, thân thiện, phù hợp cho gia đình và bạn bè</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Map Section */}
      <section className="map-section">
        <Container>
          <div className="section-title">
            <h2>Vị Trí Của Chúng Tôi</h2>
            <p>Tìm đường đến nhà hàng Lẩu Ngon</p>
          </div>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29743.28973375498!2d105.56390266801657!3d21.274981689272654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3134f07a9390f903%3A0xda31866be85f3459!2zxJDhu5NuZyBDxrDGoW5nLCBZw6puIEzhuqFjLCBWxKluaCBQaMO6YywgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1744513278359!5m2!1svi!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </Container>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <Container>
          <div className="section-title">
            <h2>Liên Hệ</h2>
            <p>Hãy liên hệ với chúng tôi nếu bạn cần hỗ trợ</p>
          </div>
          <Row>
            <Col md={4} className="mb-4">
              <div className="contact-info">
                <i className="bi bi-geo-alt contact-icon"></i>
                <h3 className="contact-title">Địa Chỉ</h3>
                <p className="contact-text">20 Đồng Cương - Yên Lạc - Vĩnh Phúc</p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="contact-info">
                <i className="bi bi-telephone contact-icon"></i>
                <h3 className="contact-title">Điện Thoại</h3>
                <p className="contact-text">0354 076 413</p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="contact-info">
                <i className="bi bi-clock contact-icon"></i>
                <h3 className="contact-title">Giờ Mở Cửa</h3>
                <p className="contact-text">10:00 - 22:00 (Thứ 2 - Chủ Nhật)</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
}

export default HomePage;