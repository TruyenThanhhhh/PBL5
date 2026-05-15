import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, BrowserRouter, useInRouterContext, Link, useLocation } from 'react-router-dom'; 
import { 
  Bell, MessageSquare, Home, Compass, TrendingUp, 
  Bookmark, Settings, MoreHorizontal, ArrowUp, 
  ArrowDown, Share2, FolderHeart, Trash2, Loader2, MapPin, Edit3, X, Camera,
  ShieldAlert, Image as ImageIcon, Check, Heart, Send, Maximize2, UserPlus, UserMinus, Clock
} from 'lucide-react';
import AccountMenu from '../components/AccountMenu';
import { useLanguage } from '../contexts/LanguageContext';

const copy = {
  vi: {
    posts: 'Bài viết',
    media: 'Hình ảnh',
    about: 'Giới thiệu',
    map: 'Bản đồ',
    home: 'Trang chủ',
    explore: 'Khám phá',
    trending: 'Xu hướng',
    saved: 'Đã lưu',
    settings: 'Cài đặt',
    editProfile: 'Chỉnh sửa hồ sơ',
    traveler: 'Người du hành',
    followers: 'Người theo dõi',
    following: 'Đang theo dõi',
    trendingKeywords: 'Từ khóa xu hướng',
    suggestedForYou: 'Gợi ý cho bạn',
    mentions: 'lượt nhắc đến',
    follow: 'Theo dõi',
    coverAlt: 'Ảnh bìa',
  },
  en: {
    posts: 'Posts',
    media: 'Media',
    about: 'About',
    map: 'Map',
    home: 'Home',
    explore: 'Explore',
    trending: 'Trending',
    saved: 'Saved',
    settings: 'Settings',
    editProfile: 'Edit Profile',
    traveler: 'Traveler',
    followers: 'Followers',
    following: 'Following',
    trendingKeywords: 'Trending Keywords',
    suggestedForYou: 'Suggested For You',
    mentions: 'mentions',
    follow: 'Follow',
    coverAlt: 'Cover',
  },
};

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
  const { language } = useLanguage();
  const t = copy[language] || copy.vi;
  
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
  const [friendStatus, setFriendStatus] = useState('none'); 

  const [trendingKeywords, setTrendingKeywords] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  const [zoomedImage, setZoomedImage] = useState(null); 
  const [zoomedImageType, setZoomedImageType] = useState(null); 
  
  const [followModal, setFollowModal] = useState({ open: false, type: '', list: [] });
  const [editBioModal, setEditBioModal] = useState({ open: false, bio: '' });

  const handlePostClick = (postId) => navigate(`/post-detail?postId=${postId}`);
  const handleSettingsClick = () => navigate('/settings');

  const openImageZoom = (url, type) => {
    setZoomedImage(url);
    setZoomedImageType(type);
  };
  
  const closeImageZoom = () => {
    setZoomedImage(null);
    setZoomedImageType(null);
  };

  const handleUpdateBio = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bio: editBioModal.bio })
      });
      if (res.ok) {
        setProfile(prev => ({ ...prev, bio: editBioModal.bio }));
        setEditBioModal({ open: false, bio: '' });
      }
    } catch (error) {
      console.error(error);
    }
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

  useEffect(() => {
    const fetchTrendingAndUsers = async () => {
      setIsLoadingTrending(true);
      try {
        const token = localStorage.getItem('token');
        
        // Fetch trending keywords (thay bằng API của bạn, ví dụ logic lấy tags nhiều nhất)
        // Hiện tại giả định API:
        const trendingRes = await fetch('http://localhost:5000/api/posts/trending/keywords').catch(() => null);
        if (trendingRes && trendingRes.ok) {
          const trendingData = await trendingRes.json();
          setTrendingKeywords(Array.isArray(trendingData) ? trendingData : []);
        }

        if (token) {
          const usersRes = await fetch('http://localhost:5000/api/users/search', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null);
          if (usersRes && usersRes.ok) {
            const usersData = await usersRes.json();
            setSuggestedUsers(Array.isArray(usersData) ? usersData.slice(0, 5) : []);
          }
        }
      } catch (err) {
        console.error('Error fetching trending data:', err);
      } finally {
        setIsLoadingTrending(false);
      }
    };
    fetchTrendingAndUsers();
  }, []);

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

  const allImages = userPosts.reduce((acc, post) => {
    if (Array.isArray(post.images) && post.images.length > 0) {
      post.images.forEach(img => acc.push({ url: img, postId: post._id }));
    }
    return acc;
  }, []);

  const postsCount = userPosts.length;
  const followersCount = profile.followers?.length || 0;
  const followingCount = profile.following?.length || 0;

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

      {editBioModal.open && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-lg text-gray-900">Chỉnh sửa tiểu sử</h3>
              <button onClick={() => setEditBioModal({ open: false, bio: '' })} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={editBioModal.bio}
                onChange={e => setEditBioModal({ ...editBioModal, bio: e.target.value })}
                placeholder="Viết một chút về bản thân bạn..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-[14px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 focus:border-[#f44336] resize-none h-32 transition-all"
              />
              <button onClick={handleUpdateBio} className="w-full mt-4 bg-[#f44336] hover:bg-red-600 text-white font-bold text-[15px] py-3 rounded-xl transition-colors shadow-md shadow-red-500/20">
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER TƯƠNG ĐỒNG KHẮP APP */}
      <header className="flex items-center justify-between py-3 px-6 bg-white sticky top-0 z-50 border-b border-gray-100 h-[72px]">
        <div className="w-1/4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-[#f44336] font-extrabold text-xl tracking-tight hidden sm:block">The Wanderer</button>
        </div>

        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500">
          <button onClick={() => navigate('/dashboard')} className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.home}</button>
          <button onClick={() => navigate('/explore')} className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.explore}</button>
          <button onClick={() => navigate('/community')} className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.community}</button>
        </nav>

        <div className="w-1/4 flex items-center justify-end gap-5">
          <NotificationBell />
          <button onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} className="text-gray-500 hover:text-gray-900">
            <MessageSquare size={22} strokeWidth={2} />
          </button>
          <AccountMenu avatar={profile.avatar} username={profile.username} />
        </div>
      </header>

      <main className="max-w-[1360px] mx-auto px-6 2xl:px-8 pt-6 flex gap-6 lg:gap-8 items-start">
        
        {/* CENTER CONTENT */}
        <section className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-6">
            <div 
              className="h-[220px] w-full bg-gray-200 relative cursor-pointer group"
              onClick={() => openImageZoom(displayCover, 'cover')}
            >
              <img 
                src={displayCover} 
                alt={t.coverAlt} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
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
                
                {isMyProfile ? (
                  <div className="flex gap-2">
                    <button onClick={() => setEditBioModal({ open: true, bio: profile.bio || '' })} className="bg-[#f44336] text-white text-[13px] font-bold px-5 py-2 rounded-lg hover:bg-[#e53935] transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/20">
                      <Edit3 size={16} /> {t.editProfile}
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
                <h1 className="text-2xl font-black text-gray-900 leading-none mb-1">{profile.username || t.traveler}</h1>
                <p className="text-[13px] font-medium text-gray-500 mb-4">@{(profile.username || 'unknown').toLowerCase().replace(/\s+/g, '_')}</p>
                <p className="text-[14px] text-gray-700 leading-relaxed font-medium mb-6 whitespace-pre-wrap">
                  {profile.bio || (isMyProfile ? 'Bạn chưa cập nhật thông tin giới thiệu (Bio). Hãy nhấn Edit Profile để chia sẻ nhiều hơn nhé!' : 'Người dùng này chưa có thông tin giới thiệu.')}
                </p>

                <div className="flex gap-4 border-t border-gray-100 pt-6">
                  <div className="flex-1 bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 text-center transition-colors cursor-default border border-gray-100/50">
                    <p className="text-2xl font-black text-gray-900 mb-1">{postsCount}</p>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{t.posts}</p>
                  </div>
                  <div className="flex-1 bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 text-center transition-colors cursor-pointer border border-gray-100/50 shadow-sm" onClick={() => setFollowModal({ open: true, type: 'Người theo dõi', list: profile.followers || [] })}>
                    <p className="text-2xl font-black text-[#f44336] mb-1">{followersCount}</p>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{t.followers}</p>
                  </div>
                  <div className="flex-1 bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 text-center transition-colors cursor-pointer border border-gray-100/50 shadow-sm" onClick={() => setFollowModal({ open: true, type: 'Đang theo dõi', list: profile.following || [] })}>
                    <p className="text-2xl font-black text-[#f44336] mb-1">{followingCount}</p>
                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{t.following}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-2 flex text-center text-[13px] font-bold text-gray-500 mb-6 shadow-sm border border-gray-100">
            <button onClick={() => setActiveTab('posts')} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'posts' ? 'text-[#f44336] bg-red-50' : 'hover:bg-gray-50'}`}>{t.posts}</button>
            <button onClick={() => setActiveTab('media')} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'media' ? 'text-[#f44336] bg-red-50' : 'hover:bg-gray-50'}`}>{t.media}</button>
            <button onClick={() => { setActiveTab('collections'); fetchCollections(); }} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'collections' ? 'text-[#f44336] bg-red-50' : 'hover:bg-gray-50'}`}>
              🗂️ {t.saved}
            </button>
            <button onClick={() => setActiveTab('about')} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'about' ? 'text-[#f44336] bg-red-50' : 'hover:bg-gray-50'}`}>{t.about}</button>
            <button onClick={() => setActiveTab('map')} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'map' ? 'text-[#f44336] bg-red-50' : 'hover:bg-gray-50'}`}>{t.map}</button>
          </div>

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

            {activeTab === 'media' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {allImages.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 flex flex-col items-center text-gray-400 gap-3">
                    <ImageIcon size={44} className="opacity-40" />
                    <p className="text-[14px] font-bold">Chưa có hình ảnh nào.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {allImages.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 cursor-pointer overflow-hidden rounded-2xl relative group shadow-sm border border-gray-100" onClick={() => openImageZoom(img.url, 'post')}>
                        <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={28} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'collections' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <Bookmark size={32} className="text-[#f44336]" />
                  </div>
                  <h3 className="text-[18px] font-black text-gray-900 mb-2">Tính năng đang phát triển</h3>
                  <p className="text-[14px] font-medium text-gray-500 max-w-[320px]">Bộ sưu tập các bài đăng và địa điểm yêu thích sẽ sớm ra mắt trong các bản cập nhật tới. Hãy đón chờ nhé!</p>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-gray-700">
                <h3 className="text-xl font-black text-gray-900 mb-4">{t.about}</h3>
                <p className="text-[14px] leading-relaxed">{profile.bio || 'Bạn chưa cập nhật phần giới thiệu.'}</p>
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

        {/* RIGHT SIDEBAR */}
        <aside className="w-[340px] hidden xl:block flex-shrink-0 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">🔥 {t.trendingKeywords}</h3>
            {isLoadingTrending ? (
              <p className="text-[13px] text-gray-500">Đang tải...</p>
            ) : trendingKeywords.length > 0 ? (
              <div className="space-y-4">
                {trendingKeywords.slice(0, 5).map((item, idx) => (
                  <div key={idx}>
                    <p className="text-[10px] font-bold text-[#00897b] uppercase tracking-wider mb-0.5">{item.category}</p>
                    <p className="text-[13px] font-bold text-gray-900 leading-tight cursor-pointer hover:underline capitalize">{item.keyword}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.count} {t.mentions}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-400">Chưa có dữ liệu</p>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">👥 {t.suggestedForYou}</h3>
            {isLoadingTrending ? (
              <p className="text-[13px] text-gray-500">Đang tải...</p>
            ) : suggestedUsers.length > 0 ? (
              <div className="space-y-4 mb-4">
                {suggestedUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} alt={user.username} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="text-[12px] font-bold text-gray-900 cursor-pointer hover:underline" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>{user.username}</p>
                        <p className="text-[10px] text-gray-500">{(user.followers || []).length} {t.followers}</p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/profile', { state: { targetUserId: user._id } })} className="text-[12px] font-bold text-[#f44336] hover:underline">{t.follow}</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-400">Chưa có dữ liệu</p>
            )}
          </div>
        </aside>

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
