import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, BrowserRouter, useInRouterContext, Link, useLocation } from 'react-router-dom'; 
import { 
  Bell, MessageSquare, Home, Compass, TrendingUp, 
  Bookmark, Settings, MoreHorizontal, ArrowUp, 
  ArrowDown, Share2, FolderHeart, Trash2, Loader2, MapPin, Edit3, X, Camera,
  ShieldAlert, Image as ImageIcon, Check, Heart, Send, Maximize2, UserPlus, UserMinus, Clock
} from 'lucide-react';

const NotificationBell = () => (
  <button type="button" className="text-gray-500 hover:text-gray-900 transition-colors relative">
    <Bell size={22} strokeWidth={2} />
  </button>
);

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 75%, 50%)`;
};

const getAvatarUrl = (url, name) => {
  return url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff&size=200`;
};

let leafletAssetsPromise = null;
const loadLeafletAssets = async () => {
  if (window.L) return;
  if (!leafletAssetsPromise) {
    leafletAssetsPromise = new Promise((resolve, reject) => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (window.L) return resolve();
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Không tải được Leaflet'));
        document.head.appendChild(script);
      }
    });
  }
  await leafletAssetsPromise;
};

function ProfileMap({ posts, username }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadMap = async () => {
      await loadLeafletAssets();
      if (isMounted && mapRef.current && window.L && !mapInstance.current) {
        const L = window.L;
        const map = L.map(mapRef.current).setView([16.0, 108.0], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        const userColor = stringToColor(username || 'user');
        const bounds = [];

        posts.forEach(post => {
          if (post.lat && post.lng) {
            bounds.push([post.lat, post.lng]);
            const customIcon = L.divIcon({
              className: 'custom-pin',
              html: `<div style="background-color: ${userColor}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #fff; box-shadow: 2px 2px 6px rgba(0,0,0,0.4);"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 24],
              popupAnchor: [0, -26]
            });
            
            const marker = L.marker([post.lat, post.lng], { icon: customIcon }).addTo(map);
            marker.bindPopup(`
              <div style="min-width: 180px; font-family: sans-serif;">
                <span style="font-size: 10px; font-weight: bold; background: #f3f4f6; color: ${userColor}; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                  ${post.category || 'Địa điểm'}
                </span>
                <h4 style="margin: 8px 0 4px 0; font-size: 15px; font-weight: 900; color: #111827;">${post.title || post.location}</h4>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #4b5563; line-height: 1.4;">${post.description}</p>
              </div>
            `);
          }
        });

        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
        mapInstance.current = map;
      }
    };
    loadMap();

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [posts, username]);

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative z-0">
      <div ref={mapRef} className="w-full h-full z-0" />
    </div>
  );
}

function ProfileContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const myUserId = localStorage.getItem('userId');
  const targetUserId = location.state?.targetUserId || myUserId;
  const isMyProfile = String(targetUserId) === String(myUserId);

  const [profile, setProfile] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [collections, setCollections] = useState([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [friendStatus, setFriendStatus] = useState('none'); // 'none', 'pending', 'friends'

  const [zoomedImage, setZoomedImage] = useState(null); 
  const [zoomedImageType, setZoomedImageType] = useState(null); 
  
  const [followModal, setFollowModal] = useState({ open: false, type: '', list: [] });

  const handlePostClick = (postId) => navigate(`/post-detail?postId=${postId}`);
  const handleActionClick = (e) => e.stopPropagation();
  const handleSettingsClick = () => navigate('/settings');

  const openImageZoom = (url, type) => {
    setZoomedImage(url);
    setZoomedImageType(type);
  };
  
  const closeImageZoom = () => {
    setZoomedImage(null);
    setZoomedImageType(null);
  };

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !myUserId) {
        setError('Vui lòng đăng nhập để xem trang cá nhân');
        setIsLoading(false);
        return;
      }
      
      const res = await fetch(`http://localhost:5000/api/users/${targetUserId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        setError('Không tải được thông tin cá nhân');
        setIsLoading(false);
        return;
      }
      
      const data = await res.json();
      setProfile(data.user || {});
      setUserPosts(Array.isArray(data.posts) ? data.posts : []);
      setFriendStatus(data.user?.friendStatus || 'none');
    } catch (err) {
      console.warn(err);
      setError('Lỗi hệ thống khi load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [targetUserId]);

  const handleFriendAction = async (action) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      let url = '';
      let method = 'POST';

      if (action === 'request' || action === 'undo') {
        url = `http://localhost:5000/api/users/friend-request/${targetUserId}`;
      } else if (action === 'accept') {
        url = `http://localhost:5000/api/users/accept-friend/${targetUserId}`;
      } else if (action === 'unfriend') {
        url = `http://localhost:5000/api/users/unfriend/${targetUserId}`;
        method = 'DELETE';
      }

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        loadProfile(); // Tải lại để lấy status mới
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCollections = async () => {
    setIsLoadingCollections(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/collections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCollections(await res.json());
    } catch (err) {}
    setIsLoadingCollections(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#f44336]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <p className="text-gray-800 font-bold text-lg mb-6">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-[#f44336] text-white font-bold rounded-full hover:bg-red-600 transition-colors">Về trang chủ</button>
      </div>
    );
  }

  const displayAvatar = getAvatarUrl(profile.avatar, profile.username);
  const displayCover = profile.cover || 'https://images.unsplash.com/photo-1502602898657-3e90760b628e?auto=format&fit=crop&w=1000&q=80';

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 pb-12 relative">
      
      {zoomedImage && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="absolute top-6 right-6 flex gap-4">
            {isMyProfile && (
              <button 
                onClick={() => { closeImageZoom(); navigate('/settings'); }} 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-[13px] flex items-center gap-2 transition-colors"
              >
                <Camera size={16} /> Thay đổi {zoomedImageType === 'avatar' ? 'Ảnh đại diện' : 'Ảnh bìa'}
              </button>
            )}
            <button onClick={closeImageZoom} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="max-w-[90vw] max-h-[85vh] relative">
            <img 
              src={zoomedImage} 
              alt="Zoomed Profile Media" 
              className={`${zoomedImageType === 'avatar' ? 'rounded-full w-[300px] h-[300px] md:w-[400px] md:h-[400px] object-cover' : 'rounded-xl max-w-full max-h-[80vh] object-contain'} shadow-2xl`}
            />
          </div>
        </div>
      )}

      {followModal.open && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-lg text-gray-900">{followModal.type}</h3>
              <button onClick={() => setFollowModal({ open: false, type: '', list: [] })} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {followModal.list.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm font-bold">
                  Chưa có ai trong danh sách này.
                </div>
              ) : (
                followModal.list.map(u => (
                  <div key={u._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={getAvatarUrl(u.avatar, u.username)} alt="avt" className="w-11 h-11 rounded-full object-cover border border-gray-100" />
                      <div>
                        <p className="font-extrabold text-[14px] text-gray-900 leading-tight">{u.username}</p>
                        <p className="text-[11px] font-medium text-gray-400">@{u.username?.toLowerCase().replace(/\s+/g, '_')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setFollowModal({ open: false, type: '', list: [] }); navigate('/profile', { state: { targetUserId: u._id } }); }}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-[12px] hover:bg-gray-200 transition-colors"
                    >
                      Xem trang
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {}
      <header className="flex items-center justify-between py-3 px-6 bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-8 w-1/4">
          <button onClick={() => navigate('/dashboard')} className="text-[#f44336] font-extrabold text-xl tracking-tight">The Wanderer</button>
        </div>

        <div className="flex-1 flex justify-center">
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-bold text-gray-500">
            <button onClick={() => setActiveTab('posts')} className={`py-4 transition-colors ${activeTab === 'posts' ? 'text-[#f44336] border-b-2 border-[#f44336] -mb-[17px]' : 'hover:text-gray-900'}`}>Posts</button>
            <button onClick={() => setActiveTab('media')} className={`py-4 transition-colors ${activeTab === 'media' ? 'text-[#f44336] border-b-2 border-[#f44336] -mb-[17px]' : 'hover:text-gray-900'}`}>Media</button>
            <button onClick={() => setActiveTab('collections')} className={`py-4 transition-colors ${activeTab === 'collections' ? 'text-[#f44336] border-b-2 border-[#f44336] -mb-[17px]' : 'hover:text-gray-900'}`}>Collections</button>
            <button onClick={() => setActiveTab('map')} className={`py-4 transition-colors ${activeTab === 'map' ? 'text-[#f44336] border-b-2 border-[#f44336] -mb-[17px]' : 'hover:text-gray-900'}`}>Map</button>
          </nav>
        </div>

        <div className="flex items-center justify-end gap-5 w-1/4">
          <NotificationBell />
          <button onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} className="text-gray-500 hover:text-gray-900">
            <MessageSquare size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      {}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 flex gap-6 lg:gap-8 items-start">
        <aside className="w-[240px] hidden md:block flex-shrink-0 sticky top-[88px]">
          <div className="flex items-center gap-3 mb-8 px-2 cursor-pointer group" onClick={() => openImageZoom(displayAvatar, 'avatar')}>
            <img src={displayAvatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:opacity-80 transition-opacity" />
            <div className="min-w-0">
              <h3 className="text-[13px] font-extrabold text-gray-900 leading-tight truncate">{profile.username}</h3>
              <p className="text-[11px] font-medium text-gray-500 truncate">@{profile.username?.toLowerCase().replace(/\s+/g, '_')}</p>
            </div>
          </div>

          <nav className="space-y-1 text-[14px] font-bold text-gray-600 mb-6">
            <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <Home size={20} strokeWidth={2} /> Home
            </button>
            <button onClick={() => navigate('/explore')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <Compass size={20} strokeWidth={2} /> Explore
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <TrendingUp size={20} strokeWidth={2} /> Trending
            </button>
            {isMyProfile && (
              <>
                <button onClick={() => { setActiveTab('collections'); fetchCollections(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl transition-all">
                  <Bookmark size={20} strokeWidth={2} /> Saved
                </button>
                <button onClick={handleSettingsClick} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-left">
                  <Settings size={20} strokeWidth={2} /> Settings
                </button>
              </>
            )}
          </nav>
        </aside>

        <section className="flex-1 max-w-[650px]">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-6">
            <div 
              className="h-[220px] w-full bg-gray-200 relative cursor-pointer group"
              onClick={() => openImageZoom(displayCover, 'cover')}
            >
              <img src={displayCover} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="text-white drop-shadow-md" size={32} />
              </div>
            </div>

            <div className="px-6 pb-6 relative">
              <div className="flex justify-between items-end mb-4">
                <div className="relative -mt-16 z-10 group cursor-pointer" onClick={() => openImageZoom(displayAvatar, 'avatar')}>
                  <img
                    src={displayAvatar}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full border-4 border-white object-cover bg-white shadow-sm transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 border-4 border-transparent rounded-full flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="text-white drop-shadow-md" size={24} />
                  </div>
                </div>
                
                {}
                {isMyProfile ? (
                  <div className="flex gap-2">
                    <button onClick={handleSettingsClick} className="bg-[#f44336] text-white text-[13px] font-bold px-5 py-2 rounded-lg hover:bg-[#e53935] transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/20">
                      <Edit3 size={16} /> Edit Profile
                    </button>
                    <button onClick={handleSettingsClick} className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors inline-block">
                      <Settings size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {friendStatus === 'friends' && (
                      <>
                        <button 
                          onClick={() => window.dispatchEvent(new CustomEvent('openChat', { detail: { userId: targetUserId, username: profile.username } }))} 
                          className="bg-[#f44336] text-white text-[13px] font-bold px-5 py-2 rounded-lg hover:bg-[#e53935] transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/20"
                        >
                          <MessageSquare size={16} /> Nhắn tin
                        </button>
                        <button 
                          onClick={() => handleFriendAction('unfriend')}
                          className="bg-gray-100 text-gray-600 text-[13px] font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                        >
                          <UserMinus size={16} /> Hủy kết bạn
                        </button>
                      </>
                    )}
                    {friendStatus === 'pending' && (
                      <button 
                        onClick={() => handleFriendAction('undo')}
                        className="bg-gray-100 text-gray-600 text-[13px] font-bold px-5 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                      >
                        <Clock size={16} /> Đã gửi yêu cầu (Hủy)
                      </button>
                    )}
                    {friendStatus === 'none' && (
                      <button 
                        onClick={() => handleFriendAction('request')}
                        className="bg-[#f44336] text-white text-[13px] font-bold px-5 py-2 rounded-lg hover:bg-[#e53935] transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/20"
                      >
                        <UserPlus size={16} /> Thêm bạn bè
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-black text-gray-900 leading-none mb-1">{profile.username}</h1>
                <p className="text-[13px] font-medium text-gray-500 mb-4">@{profile.username?.toLowerCase().replace(/\s+/g, '_')}</p>
                <p className="text-[14px] text-gray-700 leading-relaxed font-medium mb-6 whitespace-pre-wrap">
                  {profile.bio || (isMyProfile ? 'Bạn chưa cập nhật thông tin giới thiệu (Bio). Hãy nhấn Edit Profile để chia sẻ nhiều hơn nhé!' : 'Người dùng này chưa có thông tin giới thiệu.')}
                </p>

                <div className="flex gap-8 border-t border-gray-100 pt-5">
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900">{userPosts.length}</p>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Posts</p>
                  </div>
                  <div className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors" onClick={() => setFollowModal({ open: true, type: 'Bạn bè', list: profile.friends || [] })}>
                    <p className="text-xl font-black text-gray-900">{profile.friends?.length || 0}</p>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Friends</p>
                  </div>
                  <div className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors" onClick={() => setFollowModal({ open: true, type: 'Người theo dõi', list: profile.followers || [] })}>
                    <p className="text-xl font-black text-gray-900">{profile.followers?.length || 0}</p>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Followers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="pb-12">
            {activeTab === 'map' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white p-4 rounded-t-2xl border border-gray-100 border-b-0 shadow-sm flex items-center gap-3">
                  <MapPin className="text-[#f44336]" size={20} />
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900">Bản đồ dấu chân</h3>
                    <p className="text-[11px] font-medium text-gray-500">Các địa điểm đã đăng bài check-in.</p>
                  </div>
                </div>
                <ProfileMap posts={userPosts} username={profile.username} />
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                {userPosts.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 flex flex-col items-center text-gray-400 gap-3">
                    <ImageIcon size={44} className="opacity-40" />
                    <p className="text-[14px] font-bold">Chưa có bài viết nào.</p>
                  </div>
                ) : (
                  userPosts.map(post => (
                    <div 
                      key={post._id}
                      onClick={() => handlePostClick(post._id)}
                      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <img src={displayAvatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                          <div>
                            <h3 className="text-[14px] font-bold text-gray-900">{profile.username}</h3>
                            <p className="text-[11px] font-medium text-gray-400">
                              {post.location && post.location !== 'Chưa xác định' ? `${post.location} • ` : ''} 
                              {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {post.title && post.title !== `Trải nghiệm của ${profile.username}` && (
                        <h2 className="text-lg font-extrabold text-gray-900 mb-2 leading-tight group-hover:text-[#f44336] transition-colors">{post.title}</h2>
                      )}
                      
                      <div className="text-[14px] text-gray-700 leading-relaxed font-medium mb-4 whitespace-pre-wrap">{post.description}</div>

                      {Array.isArray(post.images) && post.images.length > 0 && (
                        <img src={post.images[0]} alt="Post Media" className="w-full rounded-xl object-cover max-h-[350px] mb-4 border border-gray-100" />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Profile() {
  const hasRouter = useInRouterContext();
  if (!hasRouter) {
    return (
      <BrowserRouter>
        <ProfileContent />
      </BrowserRouter>
    );
  }
  return <ProfileContent />;
}