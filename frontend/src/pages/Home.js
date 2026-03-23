import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dữ liệu thật từ Backend MongoDB
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/posts');
        setPosts(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi kết nối Backend:", err);
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="home-container">
      {/* NAVBAR */}
      <nav className="wanderer-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <Link to="/" className="nav-brand">The Wanderer</Link>
          <div className="nav-links">
            <span className="active">Explore Map</span>
            <span>Community</span>
            <span>Categories</span>
          </div>
        </div>
        <div className="nav-search">
          <span>🔍</span>
          <input type="text" placeholder="Search posts, places, cities..." />
        </div>
        <div className="nav-actions">
          <Link to="/Login" className='btn-login'>Login</Link>
          <Link to="/register" className="btn-signup">Sign Up</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Explore the world <br /><span>through people</span></h1>
          <p>Ditch the tourist traps. Connect with a global community sharing hidden gems, authentic stories, and real experiences from every corner of the globe.</p>
          <div className="hero-btns">
            <button className="btn-explore">Explore Map</button>
            <button className="btn-join">Join Community</button>
          </div>
        </div>
        <div className="hero-image-wrapper">
          {/* Ảnh map minh họa cho Hero */}
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" alt="Map" className="hero-map" />
        </div>
      </section>

      {/* TRENDING SECTION (Dữ liệu mẫu chuẩn thiết kế) */}
      <section className="section-wrapper">
        <div className="section-header">
          <div>
            <span className="section-badge">Trending</span>
            <h2>Popular this week</h2>
          </div>
          <a href="#" className="view-all">View all ➔</a>
        </div>
        <div className="trending-grid">
          <div className="trend-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80')" }}>
            <span className="trend-rating">★ 4.8</span>
            <div className="trend-info">
              <h3>Bali, Indonesia</h3>
            </div>
          </div>
          <div className="trend-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=400&q=80')" }}>
            <span className="trend-rating">★ 4.7</span>
            <div className="trend-info">
              <h3>Paris, France</h3>
            </div>
          </div>
          <div className="trend-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=80')" }}>
            <span className="trend-rating">★ 4.9</span>
            <div className="trend-info">
              <h3>Tokyo, Japan</h3>
            </div>
          </div>
          <div className="trend-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=400&q=80')" }}>
            <span className="trend-rating">★ 4.9</span>
            <div className="trend-info">
              <h3>Lauterbrunnen</h3>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT ADVENTURES (Hiển thị Database MongoDB thật) */}
      <section className="section-wrapper">
        <div className="section-header">
          <h2>Recent Adventures</h2>
          <div className="feed-filters">
            <button className="filter-active">Newest</button>
            <button className="filter-inactive">Top</button>
          </div>
        </div>

        <div className="feed-layout">
          {/* Cột trái: Danh sách bài viết từ Backend */}
          <div className="feed-posts">
            {loading ? (
              <p>Loading adventures...</p>
            ) : posts.length === 0 ? (
              <p>No posts available. Be the first to share an adventure!</p>
            ) : (
              posts.map((post) => (
                <div key={post._id} className="adventure-card">
                  <div className="adv-header">
                    <div className="adv-user">
                      <div className="adv-avatar">👱</div>
                      <div className="adv-user-info">
                        <h4>Author Name</h4> {/* Sẽ cập nhật khi có Auth hoàn chỉnh */}
                        <p>Just now • <span>{post.location}</span></p>
                      </div>
                    </div>
                    <div className="adv-options">•••</div>
                  </div>
                  
                  <div className="adv-content">
                    <h2>{post.title}</h2>
                    <p>{post.description}</p>
                    {post.images && post.images.length > 0 && (
                      <img src={post.images[0]} alt={post.title} className="adv-image" />
                    )}
                  </div>

                  <div className="adv-footer">
                    <div className="adv-actions">
                      <div className="adv-btn">
                        <span>⇧</span> {post.likes?.length || 0}
                      </div>
                      <div className="adv-btn">
                        <span>💬</span> {Math.floor(Math.random() * 50) + 5}
                      </div>
                    </div>
                    <div className="btn-save">🔖 Save</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cột phải: Widgets */}
          <div className="feed-sidebar">
            <div className="sidebar-widget">
              {/* Map Placeholder */}
              <img src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=300&q=80" alt="Live Map" className="map-widget-img" />
              <div style={{textAlign: 'center', fontSize: '12px', fontWeight: 'bold'}}>Live Community Map</div>
            </div>

            <div className="sidebar-widget">
              <h3 className="widget-title">Top Contributors</h3>
              {/* <div className="contributor-item">
                <div className="contributor-info">
                  <span className="adv-avatar" style={{width: '25px', height: '25px', fontSize: '12px'}}>👩</span>
                  Alex Rivera
                </div>
                <span className="contributor-score">LV. 42</span>
              </div>
              <div className="contributor-item">
                <div className="contributor-info">
                  <span className="adv-avatar" style={{width: '25px', height: '25px', fontSize: '12px', background: '#d9f7be'}}>👨</span>
                  Sarah Jenkins
                </div>
                <span className="contributor-score">LV. 38</span>
              </div> */}
              <button className="btn-leaderboard">See Leaderboard</button>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="section-wrapper" style={{textAlign: 'center'}}>
        <h2>What are you looking for?</h2>
        <div className="categories-grid">
          <div className="category-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80')" }}>
            <span>Food</span>
          </div>
          <div className="category-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=400&q=80')" }}>
            <span>Travel</span>
          </div>
          <div className="category-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80')" }}>
            <span>Hotels</span>
          </div>
          <div className="category-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80')" }}>
            <span>Nightlife</span>
          </div>
        </div>
      </section>

      {/* FOOTER & CTA */}
      <div className="bottom-section">
        <h2 style={{marginBottom: '40px'}}>The Journey to Exploration</h2>
        <div className="features-grid">
          <div className="feature-item">
            <div className="f-icon">🔍</div>
            <h4>Discover</h4>
            <p>Find real, unedited recommendations from people who've actually been there.</p>
          </div>
          <div className="feature-item">
            <div className="f-icon">📍</div>
            <h4>Share</h4>
            <p>Pin your favorite spots on the map and share your own travel stories.</p>
          </div>
          <div className="feature-item">
            <div className="f-icon">👥</div>
            <h4>Connect</h4>
            <p>Join local groups and meet fellow travelers on your next adventure.</p>
          </div>
        </div>

        <div className="cta-box">
          <h2>Ready to wander?</h2>
          <p>Join the fastest growing community of modern explorers and see the world differently.</p>
          <div className="cta-btns">
            <button className="btn-join" style={{border: 'none'}}>Join the Community</button>
            <button className="btn-explore" style={{background: 'transparent', border: '1px solid rgba(255,255,255,0.5)'}}>Explore Now</button>
          </div>
        </div>

        <footer className="footer-nav">
          <div className="footer-left">
            <h3>The Wanderer</h3>
            <p>Making travel more human, one story at a time. Join the revolution of authentic exploration.</p>
            <p style={{marginTop: '20px', fontSize: '10px'}}>© 2024 The Wanderer. All rights reserved.</p>
          </div>
          <div className="footer-links">
            <div className="link-col">
              <h5>Platform</h5>
              <p>Explore Map</p>
              <p>Community</p>
              <p>Destinations</p>
            </div>
            <div className="link-col">
              <h5>Company</h5>
              <p>About</p>
              <p>Contact Us</p>
              <p>Careers</p>
            </div>
            <div className="link-col">
              <h5>Legal</h5>
              <p>Privacy Policy</p>
              <p>Terms of Service</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;