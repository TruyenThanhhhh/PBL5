import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/posts');
                if (Array.isArray(res.data)) {
                    setPosts(res.data);
                }
                setLoading(false);
            } catch (err) {
                console.error("Lỗi kết nối Backend:", err);
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const tags = ["HIKING", "LOCAL EATS", "PHOTOGRAPHY", "HIDDEN GEMS", "BACKPACKING"];

    return (
        <div className="v2-dashboard">
            {/* Tích hợp CSS trực tiếp để tránh lỗi không tìm thấy file hệ thống */}
            <style>{`
                .v2-dashboard { background-color: #f8f9fa; min-height: 100vh; font-family: 'Inter', sans-serif; color: #1a1a1a; }
                .v2-navbar { background: white; padding: 12px 40px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 1000; }
                .v2-logo { font-weight: 900; color: #cf1322; font-size: 20px; }
                .v2-search-bar { background: #f0f2f5; padding: 8px 15px; border-radius: 8px; display: flex; align-items: center; width: 320px; }
                .v2-search-bar input { border: none; background: transparent; outline: none; margin-left: 10px; width: 100%; font-size: 13px; }
                .v2-nav-center { display: flex; gap: 40px; font-weight: 700; font-size: 14px; color: #888; }
                .v2-nav-center .active { color: #cf1322; border-bottom: 2px solid #cf1322; padding-bottom: 24px; margin-bottom: -24px; }
                .v2-nav-right { display: flex; align-items: center; gap: 20px; }
                .v2-btn-create { background: #cf1322; color: white; border: none; padding: 10px 24px; border-radius: 25px; font-weight: bold; cursor: pointer; }
                .v2-user-avatar { width: 36px; height: 36px; background: #ffe7ba; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd; }
                .v2-layout { display: grid; grid-template-columns: 240px 1fr 420px; gap: 30px; padding: 30px 40px; max-width: 1700px; margin: 0 auto; }
                .v2-sidebar-header h2 { font-size: 24px; margin-bottom: 4px; }
                .v2-sidebar-header p { font-size: 12px; color: #999; margin-bottom: 20px; }
                .v2-menu-item { padding: 12px 15px; border-radius: 12px; font-weight: 600; font-size: 14px; color: #666; cursor: pointer; margin-bottom: 5px; }
                .v2-menu-item.active { background: white; color: #cf1322; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .v2-tag-list { display: flex; gap: 10px; margin-bottom: 25px; overflow-x: auto; padding-bottom: 10px; }
                .v2-tag-chip { white-space: nowrap; background: white; border: 1px solid #eee; padding: 8px 16px; border-radius: 20px; font-size: 11px; font-weight: 800; color: #777; cursor: pointer; }
                .v2-tag-chip.active { background: #b5f5ec; color: #006d75; border-color: #b5f5ec; }
                .v2-card { background: white; border-radius: 16px; display: flex; margin-bottom: 25px; overflow: hidden; box-shadow: 0 2px 15px rgba(0,0,0,0.03); }
                .v2-vote-panel { background: #fafafa; width: 55px; display: flex; flex-direction: column; align-items: center; padding: 25px 0; border-right: 1px solid #f0f0f0; }
                .v2-count { font-weight: 800; font-size: 15px; margin: 8px 0; }
                .v2-card-body { flex: 1; padding: 25px; position: relative; }
                .v2-card-user { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
                .v2-avatar-mini { width: 34px; height: 34px; background: #ffd8bf; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .v2-user-details h4 { font-size: 16px; margin: 0; font-weight: 700; }
                .v2-user-details p { font-size: 12px; color: #0077b6; margin: 0; font-weight: 600; }
                .v2-card-image { border-radius: 12px; overflow: hidden; position: relative; margin-bottom: 20px; }
                .v2-card-image img { width: 100%; max-height: 450px; object-fit: cover; }
                .v2-img-badge { position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.5); color: white; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; backdrop-filter: blur(4px); }
                .v2-card-desc { font-size: 14px; line-height: 1.6; color: #444; margin-bottom: 20px; }
                .v2-card-footer { display: flex; gap: 25px; font-size: 13px; font-weight: 700; color: #999; border-top: 1px solid #f5f5f5; padding-top: 15px; }
                .v2-map-box { background: white; border-radius: 20px; overflow: hidden; height: calc(100vh - 120px); position: sticky; top: 90px; border: 1px solid #eee; }
                .v2-map-header { padding: 15px 20px; font-weight: 800; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
                .v2-map-bg { height: 100%; position: relative; background: #e5e9ec; }
                .v2-map-bg img { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
                .v2-pin { position: absolute; width: 14px; height: 14px; background: #cf1322; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3); }
                .v2-map-controls { position: absolute; bottom: 25px; right: 25px; display: flex; flex-direction: column; gap: 10px; }
                .v2-z-btn { width: 38px; height: 38px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; }
                .v2-z-btn.active { background: #cf1322; color: white; }
            `}</style>

            {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
            <nav className="v2-navbar">
                <div className="v2-nav-left">
                    <div className="v2-logo">The Wanderer</div>
                    <div className="v2-search-bar">
                        <span className="v2-search-icon">🔍</span>
                        <input type="text" placeholder="Search destinations..." />
                    </div>
                </div>
                
                <div className="v2-nav-center">
                    <span className="v2-nav-link">Home</span>
                    <span className="v2-nav-link active">Explore</span>
                </div>

                <div className="v2-nav-right">
                    <button className="v2-btn-create">Create Post</button>
                    <span className="v2-bell-icon">🔔</span>
                    <div className="v2-user-avatar">👤</div>
                </div>
            </nav>

            <div className="v2-layout">
                {/* 2. SIDEBAR TRÁI */}
                <aside className="v2-sidebar">
                    <div className="v2-sidebar-header">
                        <h2>Explore</h2>
                        <p>Your Daily Feed</p>
                    </div>
                    <div className="v2-menu">
                        <div className="v2-menu-item active">🏠 Home</div>
                        <div className="v2-menu-item">📈 Popular</div>
                        <div className="v2-menu-item">🍴 Food</div>
                        <div className="v2-menu-item">📍 Travel</div>
                        <div className="v2-menu-item">🏨 Hotels</div>
                        <div className="v2-menu-item">✨ Experiences</div>
                        <div className="v2-menu-item">🔖 Saved Posts</div>
                    </div>
                </aside>

                {/* 3. FEED GIỮA */}
                <main className="v2-feed">
                    <div className="v2-tag-list">
                        {tags.map(tag => (
                            <button key={tag} className={`v2-tag-chip ${tag === 'HIKING' ? 'active' : ''}`}>
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className="v2-post-scroll">
                        {loading ? (
                            <div className="v2-status">Đang tải bảng tin...</div>
                        ) : (
                            posts.map(post => (
                                <article key={post._id} className="v2-card">
                                    <div className="v2-vote-panel">
                                        <span className="v2-arrow">▲</span>
                                        <span className="v2-count">{post.likes?.length || 0}k</span>
                                        <span className="v2-arrow">▼</span>
                                    </div>
                                    <div className="v2-card-body">
                                        <div className="v2-card-user">
                                            <div className="v2-avatar-mini">👤</div>
                                            <div className="v2-user-details">
                                                <h4>{post.title}</h4>
                                                <p>📍 {post.location}</p>
                                            </div>
                                            <span className="v2-bookmark">🔖</span>
                                        </div>
                                        
                                        <div className="v2-card-image">
                                            {post.images && post.images.length > 0 ? (
                                                <img src={post.images[0]} alt="Ad" />
                                            ) : (
                                                <div className="v2-no-img" style={{height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee'}}>No Image Available</div>
                                            )}
                                            <div className="v2-img-badge">Golden Hour • 7:15 PM</div>
                                        </div>

                                        <p className="v2-card-desc">{post.description}</p>
                                                                       
                                        <div className="v2-card-footer">
                                            <span>💬 {Math.floor(Math.random() * 150)} Comments</span>
                                            <span>➡️ Share</span>
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </main>

                {/* 4. MAP PANEL PHẢI */}
                <aside className="v2-map-panel">
                    <div className="v2-map-box">
                        <div className="v2-map-header">📍 Paris, France</div>
                        <div className="v2-map-bg">
                            {/* Map Placeholder */}
                            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2070&auto=format&fit=crop" alt="Map" />
                            <div className="v2-pin" style={{top: '40%', left: '50%'}}></div>
                        </div>
                        <div className="v2-map-controls">
                            <div className="v2-z-btn">+</div>
                            <div className="v2-z-btn">-</div>
                            <div className="v2-z-btn active">🎯</div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;