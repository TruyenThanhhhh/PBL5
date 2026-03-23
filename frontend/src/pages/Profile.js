import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import './Profile.css';
import { 
  Home, Compass, TrendingUp, Bookmark, Settings, 
  Bell, MessageSquare, MoreHorizontal, ArrowUp, 
  MessageCircle, Share2, MapPin
} from 'lucide-react';

const Profile = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/posts');
        setPosts(response.data);
        
        // Dữ liệu mô phỏng (Mock data) khớp với hình ảnh
        setTimeout(() => {
          setPosts([
            {
              id: 1,
              author: {
                name: "Jane Wanderlust",
                handle: "@wanderlust_jane",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
              },
              context: "Published in Travel Guides • 2h ago",
              title: 'Why the "Slow Travel" movement changed my entire perspective on Lisbon',
              content: "Most travelers treat Lisbon like a checklist: Belem Tower, Check. Pink Street, Check. Tram 28, Check. But after spending three weeks living in a small apartment in Graça, I realized that Lisbon isn't a collection of monuments—it's a collection of moments.\n\nSlow travel is about the mornings spent at the same local tasca, watching the neighborhood wake up. It's about learning that the best \"miradouro\" isn't the one with the most tourists, but the one where the elderly locals gather to watch the sunset with their own chairs.\n\nIf you're planning a trip, my advice is simple: delete half your itinerary. Spend those extra hours getting lost in the narrow alleys of Alfama without a GPS. The city reveals its soul when you stop rushing through it.",
              image: null,
              upvotes: "1.2k",
              comments: 248
            },
            {
              id: 2,
              author: {
                name: "Jane Wanderlust",
                handle: "@wanderlust_jane",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
              },
              context: "Lisbon, Portugal • 5h ago",
              title: null,
              content: "Golden hour at Miradouro da Senhora do Monte. No words needed. ✨",
              image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=800&q=80",
              upvotes: "842",
              comments: 42
            }
          ]);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu bài viết:", error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="profile-page">
      {/* 1. Navbar */}
      <nav className="navbar">
        <div className="nav-brand">The Wanderer</div>
        <div className="nav-links">
          <a href="#" className="nav-link active">Posts</a>
          <a href="#" className="nav-link">Media</a>
          <a href="#" className="nav-link">About</a>
          <a href="#" className="nav-link">Map</a>
        </div>
        <div className="nav-actions">
          <button className="icon-btn"><Bell size={20} /></button>
          <button className="icon-btn"><MessageSquare size={20} /></button>
          <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80" alt="My Avatar" className="nav-avatar" />
        </div>
      </nav>

      {/* 2. Layout Chính */}
      <div className="content-layout">
        
        {/* CỘT TRÁI: Sidebar Điều Hướng */}
        <aside className="left-sidebar">
          <div className="current-user-info">
            <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80" alt="Avatar" className="sidebar-avatar"/>
            <div className="user-details">
              <span className="user-name">Travel Enthusiast</span>
              <span className="user-handle">@wanderlust_jane</span>
            </div>
          </div>

          <div className="sidebar-menu">
            <a href="#" className="menu-item"><Home size={20} /> Home</a>
            <a href="#" className="menu-item"><Compass size={20} /> Explore</a>
            <a href="#" className="menu-item"><TrendingUp size={20} /> Trending</a>
            <a href="#" className="menu-item"><Bookmark size={20} /> Saved</a>
            <a href="#" className="menu-item active"><Settings size={20} /> Settings</a>
          </div>

          <button className="btn-create-post">Create Post</button>
        </aside>

        {/* CỘT GIỮA: Nội Dung Profile & Bài Viết */}
        <main className="main-feed">
          {/* Header Profile */}
          <div className="profile-header-card">
            <div className="cover-photo">
              <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80" alt="Cover" />
            </div>
            
            <div className="profile-info-section">
              <div className="profile-top-row">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" alt="Jane Wanderlust" className="main-avatar" />
                <div className="profile-actions">
                  <button className="btn-edit">Edit Profile</button>
                  <button className="btn-settings"><Settings size={18} /></button>
                </div>
              </div>

              <div className="profile-details-row">
                <div className="profile-text">
                  <h1 className="profile-name">Jane Wanderlust</h1>
                  <p className="profile-handle">@wanderlust_jane</p>
                  <p className="profile-bio">
                    Full-time nomad & storyteller. Finding the hidden gems in every city. 
                    Currently exploring the coastal villages of Portugal. 🇵🇹
                  </p>
                </div>
                
                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-number">128</span>
                    <span className="stat-label">POSTS</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">12.4k</span>
                    <span className="stat-label">FOLLOWERS</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">842</span>
                    <span className="stat-label">FOLLOWING</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="profile-tabs-card">
            <button className="tab-btn active">Posts</button>
            <button className="tab-btn">Media</button>
            <button className="tab-btn">About</button>
            <button className="tab-btn">Map</button>
          </div>

          {/* Danh Sách Bài Viết (Feed) */}
          <div className="posts-container">
            {loading ? (
              <p style={{textAlign: 'center', padding: '20px'}}>Đang tải bài viết...</p>
            ) : (
              posts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <img src={post.author.avatar} alt="Author" className="post-avatar" />
                    <div className="post-meta">
                      <div className="post-author-name">{post.author.name}</div>
                      <div className="post-context">{post.context}</div>
                    </div>
                    <button className="btn-more"><MoreHorizontal size={20}/></button>
                  </div>

                  <div className="post-body">
                    {post.title && <h3 className="post-title">{post.title}</h3>}
                    <p className="post-text">{post.content}</p>
                    {post.image && (
                      <img src={post.image} alt="Post Content" className="post-image" />
                    )}
                  </div>

                  <div className="post-footer">
                    <div className="upvote-pill">
                      <ArrowUp size={16} className="icon-up" />
                      <span>{post.upvotes}</span>
                      <ArrowUp size={16} className="icon-down" style={{transform: 'rotate(180deg)'}} />
                    </div>
                    
                    <div className="post-actions-right">
                      <button className="action-btn">
                        <MessageCircle size={18} /> {post.comments}
                      </button>
                      <button className="action-btn">
                        <Share2 size={18} /> Share
                      </button>
                      <button className="action-btn">
                        <Bookmark size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* CỘT PHẢI: Widgets */}
        <aside className="right-sidebar">
          {/* Quick Stats */}
          <div className="widget-card">
            <h4 className="widget-title">QUICK STATS</h4>
            <div className="quick-stats-grid">
              <div className="q-stat-box">
                <span className="q-stat-num text-red">42</span>
                <span className="q-stat-text">Countries</span>
              </div>
              <div className="q-stat-box">
                <span className="q-stat-num text-teal">156</span>
                <span className="q-stat-text">Cities</span>
              </div>
              <div className="q-stat-box">
                <span className="q-stat-num text-green">3.2k</span>
                <span className="q-stat-text">Tips shared</span>
              </div>
              <div className="q-stat-box">
                <span className="q-stat-num text-dark">12k</span>
                <span className="q-stat-text">Miles Traveled</span>
              </div>
            </div>
          </div>

          {/* Trending Today */}
          <div className="widget-card">
            <h4 className="widget-title">TRENDING TODAY</h4>
            
            <div className="trending-item">
              <span className="trend-category">ADVENTURE</span>
              <h5 className="trend-name">Backpacking the Dolomites</h5>
            </div>
            
            <div className="trending-item">
              <span className="trend-category">LUXURY</span>
              <h5 className="trend-name">Overwater Bungalows in Maldives</h5>
            </div>

            <div className="trending-item">
              <span className="trend-category">CULTURE</span>
              <h5 className="trend-name">Best Izakayas in Tokyo</h5>
            </div>
          </div>

          {/* Suggested For You */}
          <div className="widget-card">
            <h4 className="widget-title">SUGGESTED FOR YOU</h4>
            
            <div className="suggested-user">
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" alt="User" />
              <div className="s-user-info">
                <h6>Marco Polo Jr</h6>
                <span>Global Nomad</span>
              </div>
              <button className="btn-follow">Follow</button>
            </div>

            <div className="suggested-user">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="User" />
              <div className="s-user-info">
                <h6>Elena Roads</h6>
                <span>Van Life Guru</span>
              </div>
              <button className="btn-follow">Follow</button>
            </div>
            
            <button className="btn-show-more">Show more</button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Profile;