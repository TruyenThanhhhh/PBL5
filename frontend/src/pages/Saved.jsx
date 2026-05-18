import React, { useState, useEffect } from 'react';
import { useNavigate, BrowserRouter, useInRouterContext, Link } from 'react-router-dom';
import { Bookmark, Home, Compass, TrendingUp, Settings, MapPin, Loader2, BookmarkMinus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const savedCopy = {
  vi: {
    home: 'Trang chủ',
    explore: 'Khám phá',
    trending: 'Thịnh hành',
    saved: 'Đã lưu',
    settings: 'Cài đặt',
    title: 'Bài viết đã lưu',
    subtitle: 'Lưu trữ lại những khoảnh khắc và địa điểm tuyệt vời nhất của bạn.',
    emptyTitle: 'Bạn chưa lưu bài viết nào',
    emptyBody: '{t.emptyBody}',
    exploreNow: '{t.exploreNow}',
    noImage: 'Không có ảnh',
    unsave: 'Bỏ lưu',
    discover: 'Khám phá',
    unknownTitle: 'Chưa rõ tiêu đề',
    unknown: 'Chưa rõ',
    user: 'Người dùng',
  },
  en: {
    home: 'Home',
    explore: 'Explore',
    trending: 'Trending',
    saved: 'Saved',
    settings: 'Settings',
    title: 'Saved Posts',
    subtitle: 'Keep your favorite places and travel moments in one spot.',
    emptyTitle: 'No saved posts yet',
    emptyBody: 'When you find an interesting post, press Bookmark to save it for later.',
    exploreNow: 'Explore now',
    noImage: 'No image',
    unsave: 'Unsave',
    discover: 'Explore',
    unknownTitle: 'Untitled',
    unknown: 'Unknown',
    user: 'User',
  },
};

function SavedContent() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = savedCopy[language] || savedCopy.vi;
  const dateLocale = language === 'en' ? 'en-US' : 'vi-VN';
  const [savedPosts, setSavedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/users/saved-posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // data.savedPosts is an array of posts
        setSavedPosts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách đã lưu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (e, postId) => {
    e.stopPropagation(); // Prevent triggering card click
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/save-post/${postId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Remove from list
        setSavedPosts(prev => prev.filter(p => p._id !== postId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getAvatarUrl = (url, name) => {
    return url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff`;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 flex">
      {/* Sidebar - Tương tự Dashboard */}
      <aside className="w-[280px] bg-white border-r border-gray-100 flex-shrink-0 sticky top-0 h-screen flex flex-col pt-6 hidden md:flex z-10 shadow-sm">
        <div className="px-8 mb-8">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-2xl tracking-tight block">The Wanderer</Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 text-gray-600 hover:text-[#f44336] rounded-xl font-bold transition-all group text-[15px]">
            <Home size={22} className="group-hover:scale-110 transition-transform" /> {t.home}
          </button>
          <button onClick={() => navigate('/explore')} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 text-gray-600 hover:text-[#f44336] rounded-xl font-bold transition-all group text-[15px]">
            <Compass size={22} className="group-hover:scale-110 transition-transform" /> {t.explore}
          </button>
          <button onClick={() => navigate('/trending')} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 text-gray-600 hover:text-[#f44336] rounded-xl font-bold transition-all group text-[15px]">
            <TrendingUp size={22} className="group-hover:scale-110 transition-transform" /> {t.trending}
          </button>
          <button className="w-full flex items-center gap-4 px-4 py-3.5 bg-red-50 text-[#f44336] rounded-xl font-bold transition-all group text-[15px]">
            <Bookmark size={22} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" /> {t.saved}
          </button>
          <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 text-gray-600 hover:text-[#f44336] rounded-xl font-bold transition-all group text-[15px]">
            <Settings size={22} className="group-hover:scale-110 transition-transform" /> {t.settings}
          </button>
        </nav>
      </aside>

      <main className="flex-1 max-w-[1200px] mx-auto px-4 sm:px-8 py-8 w-full">
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-50 text-[#f44336] rounded-full flex items-center justify-center shadow-sm">
              <Bookmark size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t.title}</h1>
          </div>
          <p className="text-[15px] font-medium text-gray-500 ml-15">{t.subtitle}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 size={40} className="animate-spin text-[#f44336]" />
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <Bookmark size={64} className="text-gray-300 mb-6" strokeWidth={1.5} />
            <h2 className="text-xl font-black text-gray-900 mb-2">{t.emptyTitle}</h2>
            <p className="text-[15px] text-gray-500 font-medium max-w-md mx-auto mb-8">
              {t.emptyBody}
            </p>
            <button 
              onClick={() => navigate('/explore')}
              className="bg-[#f44336] hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-red-500/20 transition-all hover:-translate-y-0.5"
            >
              {t.exploreNow}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedPosts.map((post, index) => (
              <div 
                key={post._id} 
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col relative animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/post-detail?postId=${post._id}`)}
              >
                <div className="w-full h-[220px] bg-gray-100 relative overflow-hidden">
                  {post.images && post.images.length > 0 ? (
                    <img src={post.images[0]} alt="Post media" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-50">
                      {t.noImage}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  
                  {/* Unsave Button */}
                  <button 
                    onClick={(e) => handleUnsave(e, post._id)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-900 shadow-lg hover:bg-red-50 hover:text-[#f44336] transition-colors"
                    title={t.unsave}
                  >
                    <BookmarkMinus size={20} strokeWidth={2} />
                  </button>

                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider rounded-lg border border-white/30 mb-2 inline-block shadow-sm">
                      {post.category || t.discover}
                    </span>
                    <h2 className="text-[18px] font-extrabold text-white leading-tight line-clamp-2 drop-shadow-md">
                      {post.title || post.location || t.unknownTitle}
                    </h2>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-[13px] font-semibold text-gray-500 truncate">
                      {post.location || t.unknown}
                    </span>
                  </div>
                  
                  <p className="text-[14px] text-gray-600 font-medium line-clamp-2 leading-relaxed mb-6">
                    {post.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <img src={getAvatarUrl(post.createdBy?.avatar, post.createdBy?.username)} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-100 shadow-sm" />
                      <span className="text-[13px] font-extrabold text-gray-900 truncate max-w-[100px]">
                        {post.createdBy?.username || t.user}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString(dateLocale)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Saved() {
  const hasRouter = useInRouterContext();
  if (!hasRouter) {
    return (
      <BrowserRouter>
        <SavedContent />
      </BrowserRouter>
    );
  }
  return <SavedContent />;
}
