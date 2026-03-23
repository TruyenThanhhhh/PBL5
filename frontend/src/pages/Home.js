import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="reddit-provider">
      <nav className="header">
        <div className="header-left">
          <div className="logo-icon">P</div>
          <span className="logo-text">PBL5<span>Social</span></span>
        </div>
        <div className="header-center">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Tìm kiếm địa danh, ẩm thực..." />
          </div>
        </div>
        <div className="header-right">
          <a href="/login" className="btn-login" style={{textDecoration: 'none', textAlign: 'center'}}>Đăng nhập</a>
          <div className="user-control">👤</div>
        </div>
      </nav>

      <div className="content-layout">
        <aside className="left-sidebar">
          <div className="sidebar-group">
            <p className="group-title">MỤC LỤC</p>
            <div className="sidebar-item active">🏠 Trang chủ</div>
            <div className="sidebar-item">🔥 Phổ biến</div>
            <div className="sidebar-item">📈 Tất cả</div>
          </div>
          <div className="sidebar-group">
            <p className="group-title">CỘNG ĐỒNG</p>
            <div className="sidebar-item">🏖️ r/NhaTrang</div>
            <div className="sidebar-item">🌲 r/DaLat</div>
            <div className="sidebar-item">🍜 r/AmThuc</div>
          </div>
        </aside>

        <main className="main-feed">
          <div className="create-post-placeholder">
            <div className="user-avatar-small">👤</div>
            <input type="text" placeholder="Bạn đang nghĩ gì?" />
          </div>

          {loading ? (
            <div className="loading">Đang tải bài viết...</div>
          ) : (
            posts.map((post) => (
              <article key={post._id} className="post-card">
                <div className="post-voting">
                  <button className="vote-btn up">▲</button>
                  <span className="vote-count">{post.likes?.length || 0}</span>
                  <button className="vote-btn down">▼</button>
                </div>
                <div className="post-main">
                  <header className="post-header">
                    <span className="post-category">p/{post.category}</span>
                    <span className="post-meta"> • {post.location}</span>
                  </header>
                  <h2 className="post-title">{post.title}</h2>
                  <p className="post-description">{post.description}</p>
                  {post.images?.length > 0 && (
                    <div className="post-image-container">
                      <img src={post.images[0]} alt={post.title} />
                    </div>
                  )}
                  <footer className="post-footer">
                    <div className="footer-item">💬 Bình luận</div>
                    <div className="footer-item">➡️ Chia sẻ</div>
                  </footer>
                </div>
              </article>
            ))
          )}
          {posts.length === 0 && !loading && <div className="no-data">Chưa có dữ liệu bài đăng.</div>}
        </main>
      </div>
    </div>
  );
};

export default Home;