import React, { useState, useEffect } from 'react';
import { useNavigate, BrowserRouter, useInRouterContext } from 'react-router-dom'; 
import { 
  Bell, MessageSquare, Home, Compass, TrendingUp, 
  Bookmark, Settings, MoreHorizontal, ArrowUp, 
  ArrowDown, Share2, FolderHeart, Trash2, Loader2
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

// 🚀 Tách phần giao diện chính ra một Component con
function ProfileContent() {
  const navigate = useNavigate(); // Khởi tạo hàm chuyển trang an toàn
  const [profile, setProfile] = useState({
    username: '',
    bio: '',
    avatar: '',
    cover: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [collections, setCollections] = useState([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  const handlePostClick = () => {
    navigate('/post-detail');
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Chưa đăng nhập');
        const res = await fetch('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Không tải được profile');
        }
        const data = await res.json();
        setProfile({
          username: data.username || '',
          bio: data.bio || '',
          avatar: data.avatar || '',
          cover: data.cover || ''
        });
      } catch (err) {
        setError(err.message || 'Lỗi load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const fetchCollections = async () => {
    setIsLoadingCollections(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/collections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCollections(await res.json());
    } catch (err) { console.error(err); }
    setIsLoadingCollections(false);
  };

  const handleDeleteCollection = async (colId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/collections/${colId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setCollections(prev => prev.filter(c => c._id !== colId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Đang tải profile...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 pb-12">
      {/* NAVBAR */}
      <header className="flex items-center justify-between py-3 px-6 bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-8 w-1/4">
          <button onClick={() => navigate('/dashboard')} className="text-[#f44336] font-extrabold text-xl tracking-tight">
            The Wanderer
          </button>
        </div>

        <div className="flex-1 flex justify-center">
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-bold text-gray-500">
            <button className="text-[#f44336] border-b-2 border-[#f44336] py-4 -mb-[17px]">Posts</button>
            <button className="hover:text-gray-900 transition-colors py-4">Media</button>
            <button className="hover:text-gray-900 transition-colors py-4">About</button>
            <button className="hover:text-gray-900 transition-colors py-4">Map</button>
          </nav>
        </div>

        <div className="flex items-center justify-end gap-5 w-1/4">
          <NotificationBell />
          <button onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} className="text-gray-500 hover:text-gray-900">
            <MessageSquare size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 flex gap-6 lg:gap-8 items-start">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-[240px] hidden md:block flex-shrink-0 sticky top-[88px]">
          <div className="flex items-center gap-3 mb-8 px-2">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="text-[13px] font-extrabold text-gray-900 leading-tight">Travel Enthusiast</h3>
              <p className="text-[11px] font-medium text-gray-500">@wanderlust_jane</p>
            </div>
          </div>

          <nav className="space-y-1 text-[14px] font-bold text-gray-600 mb-6">
            <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <Home size={20} strokeWidth={2} /> Home
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <Compass size={20} strokeWidth={2} /> Explore
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <TrendingUp size={20} strokeWidth={2} /> Trending
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <Bookmark size={20} strokeWidth={2} /> Saved
            </button>
            
            <button onClick={handleSettingsClick} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-left">
              <Settings size={20} strokeWidth={2} /> Settings
            </button>
          </nav>

          <button onClick={() => navigate('/upload')} className="w-full bg-[#f44336] text-white text-[14px] font-bold py-3.5 rounded-xl hover:bg-[#e53935] shadow-md shadow-red-500/20 transition-colors block text-center">
            Create Post
          </button>
        </aside>

        {/* CENTER CONTENT */}
        <section className="flex-1 max-w-[650px]">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-6">
            <div className="h-[220px] w-full bg-gray-200 relative">
              <img
                src={profile.cover || 'https://images.unsplash.com/photo-1502602898657-3e90760b628e?auto=format&fit=crop&w=1000&q=80'}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="px-6 pb-6 relative">
              <div className="flex justify-between items-end mb-4">
                <div className="relative -mt-16 z-10">
                  <img
                    src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={profile.username || 'Avatar'}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover bg-white shadow-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button className="bg-[#f44336] text-white text-[13px] font-bold px-5 py-2 rounded-lg hover:bg-[#e53935] transition-colors">
                    Edit Profile
                  </button>
                  <button onClick={handleSettingsClick} className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors inline-block">
                    <Settings size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-black text-gray-900 leading-none mb-1">{profile.username || 'Traveler'}</h1>
                <p className="text-[13px] font-medium text-gray-500 mb-4">@{(profile.username || 'unknown').toLowerCase().replace(/\s+/g, '_')}</p>
                <p className="text-[14px] text-gray-700 leading-relaxed font-medium mb-6">
                  {profile.bio || 'Bạn chưa cập nhật thông tin cá nhân.'}
                </p>

                <div className="flex gap-8 border-t border-gray-100 pt-5">
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900">128</p>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900">12.4k</p>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900">842</p>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Following</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-2 flex text-center text-[13px] font-bold text-gray-500 mb-6 shadow-sm border border-gray-100">
            <button onClick={() => setActiveTab('posts')} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'posts' ? 'text-[#f44336] bg-red-50' : 'hover:bg-gray-50'}`}>Posts</button>
            <button onClick={() => { setActiveTab('media'); }} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'media' ? 'text-[#f44336] bg-red-50' : 'hover:bg-gray-50'}`}>Media</button>
            <button onClick={() => { setActiveTab('collections'); fetchCollections(); }} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'collections' ? 'text-[#f44336] bg-red-50' : 'hover:bg-gray-50'}`}>
              🗂️ Bộ sưu tập
            </button>
            <button onClick={() => setActiveTab('about')} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'about' ? 'text-[#f44336] bg-red-50' : 'hover:bg-gray-50'}`}>About</button>
          </div>

          {/* COLLECTIONS TAB */}
          {activeTab === 'collections' && (
            <div className="animate-in fade-in">
              {isLoadingCollections ? (
                <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-[#f44336]" /></div>
              ) : collections.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 flex flex-col items-center text-gray-400 gap-3">
                  <FolderHeart size={44} className="opacity-40" />
                  <p className="text-[14px] font-bold">Chưa có bộ sưu tập nào.</p>
                  <p className="text-[12px] text-center">Hãy lưu bài viết vào bộ sưu tập từ màn hình chính!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {collections.map(col => (
                    <div key={col._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                      {/* Cover */}
                      <div className="h-[140px] bg-gradient-to-br from-red-50 to-orange-50 relative overflow-hidden">
                        {col.posts?.length > 0 && col.posts[0]?.images?.length > 0 ? (
                          <img src={col.posts[0].images[0]} alt="cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderHeart size={36} className="text-[#f44336] opacity-40" />
                          </div>
                        )}
                        <button
                          onClick={(e) => handleDeleteCollection(col._id, e)}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="p-3">
                        <h4 className="text-[13px] font-extrabold text-gray-900 truncate">{col.name}</h4>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{col.posts?.length || 0} bài viết</p>
                        {/* Grid mini thumbnails */}
                        {col.posts?.length > 1 && (
                          <div className="flex gap-1 mt-2">
                            {col.posts.slice(0, 3).map((p, i) => (
                              p.images?.[0] && <img key={i} src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* POSTS TAB (default) */}
          {activeTab !== 'collections' && (
          <>
          <div 
            onClick={handlePostClick}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Jane" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">Jane Wanderlust</h3>
                  <p className="text-[11px] font-medium text-gray-400">Published in Travel Guides • 2h ago</p>
                </div>
              </div>
              <button onClick={handleActionClick} className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={20} />
              </button>
            </div>

            <h2 className="text-xl font-extrabold text-gray-900 mb-3 leading-tight group-hover:text-[#f44336] transition-colors">
              Why the "Slow Travel" movement changed my entire perspective on Lisbon
            </h2>
            
            <div className="space-y-4 text-[14px] text-gray-600 leading-relaxed font-medium mb-6">
              <p>Most travelers treat Lisbon like a checklist: Belem Tower, Check. Pink Street, Check. Tram 28, Check. But after spending three weeks living in a small apartment in Graça, I realized that Lisbon isn't a collection of monuments—it's a collection of moments.</p>
              <p>Slow travel is about the mornings spent at the same local tasca, watching the neighborhood wake up. It's about learning that the best "miradouro" isn't the one with the most tourists, but the one where the elderly locals gather to watch the sunset with their own chairs.</p>
            </div>

            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
              <div className="flex items-center bg-gray-100 rounded-full">
                <button onClick={handleActionClick} className="flex items-center gap-1.5 px-3 py-1.5 text-[#f44336] hover:bg-gray-200 rounded-l-full transition-colors">
                  <ArrowUp size={16} strokeWidth={3} />
                  <span className="text-[13px] font-bold">1.2k</span>
                </button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button onClick={handleActionClick} className="px-3 py-1.5 text-gray-500 hover:bg-gray-200 rounded-r-full transition-colors">
                  <ArrowDown size={16} strokeWidth={3} />
                </button>
              </div>

              <div className="flex items-center gap-5 text-[13px] font-bold text-gray-500">
                <button onClick={handleActionClick} className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
                  <MessageSquare size={18} strokeWidth={2} /> 248
                </button>
                <button onClick={handleActionClick} className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
                  <Share2 size={18} strokeWidth={2} /> Share
                </button>
              </div>
            </div>
          </div>

          {/* POST 2 */}
          <div 
            onClick={handlePostClick}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Jane" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">Jane Wanderlust</h3>
                  <p className="text-[11px] font-medium text-gray-400">Lisbon, Portugal • 5h ago</p>
                </div>
              </div>
              <button onClick={handleActionClick} className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={20} />
              </button>
            </div>

            <p className="text-[14px] text-gray-800 font-medium mb-4 group-hover:text-[#f44336] transition-colors">
              Golden hour at Miradouro da Senhora do Monte. No words needed. ✨
            </p>

            <img 
              src="https://images.unsplash.com/photo-1521334884684-ce41ebf7c234?auto=format&fit=crop&w=1000&q=80" 
              alt="Lisbon View" 
              className="w-full rounded-xl object-cover h-[350px] mb-4 group-hover:opacity-95 transition-opacity"
            />

            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
              <div className="flex items-center bg-gray-100 rounded-full">
                <button onClick={handleActionClick} className="flex items-center gap-1.5 px-3 py-1.5 text-[#f44336] hover:bg-gray-200 rounded-l-full transition-colors">
                  <ArrowUp size={16} strokeWidth={3} />
                  <span className="text-[13px] font-bold text-gray-700">842</span>
                </button>
                <div className="w-px h-4 bg-gray-300"></div>
                <button onClick={handleActionClick} className="px-3 py-1.5 text-gray-500 hover:bg-gray-200 rounded-r-full transition-colors">
                  <ArrowDown size={16} strokeWidth={3} />
                </button>
              </div>

              <div className="flex items-center gap-5 text-[13px] font-bold text-gray-500">
                <button onClick={handleActionClick} className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
                  <MessageSquare size={18} strokeWidth={2} /> 42
                </button>
                <button onClick={handleActionClick} className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
                  <Share2 size={18} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
          </>
          )}
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[300px] hidden xl:block flex-shrink-0 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-black text-[#f44336]">42</p>
                <p className="text-[11px] font-bold text-gray-500">Countries</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-black text-[#00897b]">156</p>
                <p className="text-[11px] font-bold text-gray-500">Cities</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Trending Today</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-[#00897b] uppercase tracking-wider mb-0.5">Adventure</p>
                <p className="text-[13px] font-bold text-gray-900 leading-tight cursor-pointer hover:underline">Backpacking the Dolomites</p>
                <p className="text-[11px] text-gray-400 mt-0.5">1.2k people discussing this</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#00897b] uppercase tracking-wider mb-0.5">Luxury</p>
                <p className="text-[13px] font-bold text-gray-900 leading-tight cursor-pointer hover:underline">Overwater Bungalows in Maldives</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Suggested For You</h3>
            <div className="space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" alt="Marco" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="text-[12px] font-bold text-gray-900">Marco Polo Jr</p>
                    <p className="text-[10px] text-gray-500">Global Nomad</p>
                  </div>
                </div>
                <button className="text-[12px] font-bold text-[#f44336] hover:underline">Follow</button>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

// 🛡️ LỚP BỌC AN TOÀN (SAFE WRAPPER)
export default function Profile() {
  // Kiểm tra xem component có đang nằm trong Router không
  // (tránh lỗi khi bấm Preview trực tiếp trong Canvas)
  const hasRouter = typeof useInRouterContext === 'function' ? useInRouterContext() : false;

  if (!hasRouter) {
    // Nếu không có Router (như khi Preview), tự động bọc thẻ BrowserRouter
    return (
      <BrowserRouter>
        <ProfileContent />
      </BrowserRouter>
    );
  }

  // Nếu đã có Router (khi chạy trong App.jsx), render bình thường
  return <ProfileContent />;
}