import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, User, MapPin, Compass, ArrowLeft, ShieldAlert, CheckCircle, X, Heart, Shield, Users, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const copy = {
  vi: {
    home: 'Trang chủ',
    explore: 'Khám phá',
    community: 'Cộng đồng',
    friends: 'Bạn bè',
    searchAll: 'Tìm kiếm mọi thứ...',
    searchResultsTitle: 'Kết quả tìm kiếm cho',
    all: 'Tất cả kết quả',
    posts: 'Bài viết',
    people: 'Mọi người',
    noResults: 'Không tìm thấy kết quả nào phù hợp.',
    tryDifferentKeywords: 'Hãy thử tìm kiếm bằng các từ khóa khác như tên món ăn, địa danh hoặc tên người dùng.',
    viewDetails: 'Xem chi tiết',
    viewProfile: 'Xem cá nhân',
    likes: 'lượt thích',
    postedBy: 'Đăng bởi',
    category: 'Danh mục',
    location: 'Địa điểm',
    anonymous: 'Ẩn danh',
    discover: 'Khám phá',
    unknown: 'Chưa rõ',
  },
  en: {
    home: 'Home',
    explore: 'Explore',
    community: 'Community',
    friends: 'Friends',
    searchAll: 'Search everything...',
    searchResultsTitle: 'Search results for',
    all: 'All Results',
    posts: 'Posts',
    people: 'People',
    noResults: 'No matching results found.',
    tryDifferentKeywords: 'Try searching with other keywords like food names, places, or usernames.',
    viewDetails: 'View details',
    viewProfile: 'View profile',
    likes: 'likes',
    postedBy: 'Posted by',
    category: 'Category',
    location: 'Location',
    anonymous: 'Anonymous',
    discover: 'Explore',
    unknown: 'Unknown',
  }
};

const getAvatarUrl = (avatar, username) => {
  if (avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'))) {
    return avatar;
  }
  if (avatar) {
    return `http://localhost:5000${avatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'U')}&background=f44336&color=fff`;
};

function SearchResults() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDarkMode, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const t = copy[language] || copy.vi;

  const initialQuery = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [posts, setPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'posts', 'people'

  // Dynamic Suggestion States
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setSearchInput(searchParams.get('q') || '');
    fetchResults();
  }, [searchParams]);

  // Close suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return;
    const handleOutsideClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showSuggestions]);

  const fetchResults = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      // Fetch posts
      const postsRes = await fetch('http://localhost:5000/api/posts');
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(Array.isArray(postsData) ? postsData : []);
      }

      // Fetch all users
      if (token) {
        const usersRes = await fetch('http://localhost:5000/api/users/search', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAllUsers(Array.isArray(usersData) ? usersData : []);
        }
      }
    } catch (error) {
      console.error('Fetch search results error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const currentUserId = localStorage.getItem('userId');
  const query = (searchParams.get('q') || '').toLowerCase().trim();

  // Filter posts
  const filteredPosts = query ? posts.filter(post => 
    post.title?.toLowerCase().includes(query) ||
    post.description?.toLowerCase().includes(query) ||
    post.location?.toLowerCase().includes(query) ||
    post.category?.toLowerCase().includes(query) ||
    post.createdBy?.username?.toLowerCase().includes(query)
  ) : [];

  // Filter users
  const filteredUsers = query ? allUsers.filter(user => 
    user.role !== 'admin' && 
    String(user._id) !== String(currentUserId) &&
    (user.username?.toLowerCase().includes(query) || user.displayName?.toLowerCase().includes(query))
  ) : [];

  // Suggestions while typing
  const suggestionsPosts = searchInput.toLowerCase().trim() ? posts.filter(post => 
    post.title?.toLowerCase().includes(searchInput.toLowerCase().trim()) ||
    post.location?.toLowerCase().includes(searchInput.toLowerCase().trim()) ||
    post.category?.toLowerCase().includes(searchInput.toLowerCase().trim())
  ).slice(0, 4) : [];

  const suggestionsUsers = searchInput.toLowerCase().trim() ? allUsers.filter(user => 
    user.role !== 'admin' && 
    String(user._id) !== String(currentUserId) &&
    user.username?.toLowerCase().includes(searchInput.toLowerCase().trim())
  ).slice(0, 3) : [];

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a] text-white' : 'bg-[#f8f9fa] text-gray-900'} font-sans pb-12`}>
      
      {/* HEADER */}
      <header className={`h-[72px] border-b flex items-center justify-between px-6 z-[100] shadow-sm sticky top-0 transition-colors duration-300
        ${isDarkMode ? 'bg-[#1e293b]/80 backdrop-blur-md border-gray-700' : 'bg-white/80 backdrop-blur-md border-gray-100'}`}>
        <div className="flex-1 flex items-center gap-6">
          <button onClick={() => navigate(-1)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <ArrowLeft size={20} className={isDarkMode ? 'text-white' : 'text-gray-600'} />
          </button>
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-2xl tracking-tighter hover:opacity-80 transition-opacity whitespace-nowrap">The Wanderer</Link>
          
          {/* SEARCH BOX WITH SUGGESTIONS */}
          <div className="relative w-full max-w-[350px] hidden md:block" ref={suggestionsRef}>
            <form onSubmit={handleSearchSubmit}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder={t.searchAll}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className={`w-full pl-9 pr-3 py-2.5 rounded-full text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all shadow-sm border
                  ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-[#f8f9fa] border-gray-200 hover:bg-white focus:bg-white'}`}
              />
            </form>

            {showSuggestions && searchInput.trim() !== '' && (suggestionsPosts.length > 0 || suggestionsUsers.length > 0) && (
              <div className={`absolute left-0 right-0 top-12 z-[200] max-h-[380px] overflow-y-auto rounded-2xl border shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-150
                ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                
                {suggestionsPosts.length > 0 && (
                  <div className="mb-3">
                    <p className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Bài viết liên quan
                    </p>
                    {suggestionsPosts.map(post => (
                      <div
                        key={post._id}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchInput('');
                          navigate(`/post-detail?postId=${post._id}`);
                        }}
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                          {post.images?.[0] ? (
                            <img src={post.images[0]} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <Compass size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[12px] truncate">{post.title || post.location || 'Bài viết'}</p>
                          <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                            <MapPin size={10} /> {post.location || 'Chưa xác định'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {suggestionsUsers.length > 0 && (
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Người dùng liên quan
                    </p>
                    {suggestionsUsers.map(user => (
                      <div
                        key={user._id}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchInput('');
                          navigate('/profile', { state: { targetUserId: user._id } });
                        }}
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border">
                          <img src={getAvatarUrl(user.avatar, user.username)} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[12px] truncate">{user.username}</p>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 shrink-0 pr-2">Cá nhân</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        <nav className={`flex justify-center items-center gap-10 text-[15px] font-bold shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Link to="/dashboard" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">{t.home}</Link>
          <Link to="/explore" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">{t.explore}</Link>
          <Link to="/community" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">{t.community}</Link>
          <Link to="/friends" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">{t.friends}</Link>
        </nav>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1200px] mx-auto pt-8 px-6 flex flex-col md:flex-row gap-8 items-start">
        
        {/* LEFT COLUMN: FILTERS (FACEBOOK STYLE) */}
        <aside className={`w-full md:w-[280px] rounded-2xl border p-4 shadow-sm shrink-0 transition-colors duration-300
          ${isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
          <h2 className="text-[15px] font-black uppercase tracking-wider mb-4 text-[#f44336]">
            Bộ lọc tìm kiếm
          </h2>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[14px] font-extrabold transition-all
                ${activeTab === 'all' 
                  ? 'bg-[#f44336] text-white shadow-md' 
                  : (isDarkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                }`}
            >
              <Globe size={18} />
              {t.all}
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[14px] font-extrabold transition-all
                ${activeTab === 'posts' 
                  ? 'bg-[#f44336] text-white shadow-md' 
                  : (isDarkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                }`}
            >
              <Compass size={18} />
              {t.posts} ({filteredPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[14px] font-extrabold transition-all
                ${activeTab === 'people' 
                  ? 'bg-[#f44336] text-white shadow-md' 
                  : (isDarkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                }`}
            >
              <Users size={18} />
              {t.people} ({filteredUsers.length})
            </button>
          </div>
        </aside>

        {/* RIGHT COLUMN: SEARCH RESULTS */}
        <section className="flex-1 w-full space-y-6">
          <div className="mb-2">
            <h1 className="text-xl md:text-2xl font-black">
              {t.searchResultsTitle} <span className="text-[#f44336]">"{query}"</span>
            </h1>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-[#f44336] border-t-transparent rounded-full"></div>
            </div>
          ) : (filteredPosts.length === 0 && filteredUsers.length === 0) ? (
            <div className={`p-12 text-center rounded-2xl border ${isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'} animate-in fade-in duration-300`}>
              <ShieldAlert size={48} className="mx-auto mb-4 opacity-40 text-[#f44336]" />
              <p className="font-extrabold text-[16px]">{t.noResults}</p>
              <p className="text-[13px] opacity-75 mt-2 max-w-lg mx-auto">{t.tryDifferentKeywords}</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* POSTS SECTION */}
              {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-gray-700">
                    <h2 className="text-[16px] font-black uppercase tracking-wider flex items-center gap-2">
                      <Compass size={18} className="text-[#f44336]" /> {t.posts}
                    </h2>
                    {activeTab === 'all' && filteredPosts.length > 2 && (
                      <button onClick={() => setActiveTab('posts')} className="text-[12px] font-bold text-[#f44336] hover:underline">
                        Xem tất cả ({filteredPosts.length})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {(activeTab === 'all' ? filteredPosts.slice(0, 3) : filteredPosts).map(post => {
                      const isAdmin = post.createdBy?.role === 'admin';
                      return (
                        <div key={post._id} className={`rounded-2xl overflow-hidden border shadow-sm flex flex-col sm:flex-row transition-all duration-300
                          ${isDarkMode ? 'bg-[#1e293b] border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100 hover:shadow-md'}`}>
                          
                          {post.images?.[0] && (
                            <div className="w-full sm:w-[220px] h-[180px] sm:h-auto shrink-0 relative overflow-hidden bg-gray-100">
                              <img src={post.images[0]} className="w-full h-full object-cover" alt="" />
                            </div>
                          )}

                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-red-50 text-[#f44336]">
                                  {post.category || t.discover}
                                </span>
                                {post.location && (
                                  <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                                    <MapPin size={12} /> {post.location}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-[16px] font-black line-clamp-1 mb-2 hover:text-[#f44336] transition-colors cursor-pointer" onClick={() => navigate(`/post-detail?postId=${post._id}`)}>
                                {post.title || post.location || 'Địa điểm khám phá'}
                              </h3>
                              <p className={`text-[13px] line-clamp-2 leading-relaxed mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {post.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t pt-3 border-gray-100 dark:border-gray-800">
                              <div className="flex items-center gap-2">
                                <img src={getAvatarUrl(post.createdBy?.avatar, post.createdBy?.username)} className="w-6 h-6 rounded-full border border-gray-200" alt="" />
                                <span className="text-[12px] font-bold truncate max-w-[120px]">{post.createdBy?.username || t.anonymous}</span>
                                {isAdmin && <Shield size={12} className="text-[#f44336]" />}
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                                  <Heart size={12} className="text-red-500" fill="red" /> {post.likeCount || 0}
                                </span>
                                <button
                                  onClick={() => navigate(`/post-detail?postId=${post._id}`)}
                                  className="text-[12px] font-black text-white bg-[#f44336] hover:bg-[#e22d41] px-4 py-1.5 rounded-full shadow-sm shadow-red-500/10 transition-colors"
                                >
                                  {t.viewDetails}
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PEOPLE SECTION */}
              {(activeTab === 'all' || activeTab === 'people') && filteredUsers.length > 0 && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-gray-700">
                    <h2 className="text-[16px] font-black uppercase tracking-wider flex items-center gap-2">
                      <Users size={18} className="text-[#f44336]" /> {t.people}
                    </h2>
                    {activeTab === 'all' && filteredUsers.length > 3 && (
                      <button onClick={() => setActiveTab('people')} className="text-[12px] font-bold text-[#f44336] hover:underline">
                        Xem tất cả ({filteredUsers.length})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(activeTab === 'all' ? filteredUsers.slice(0, 3) : filteredUsers).map(user => (
                      <div key={user._id} className={`p-4 rounded-2xl border text-center transition-all duration-300
                        ${isDarkMode ? 'bg-[#1e293b] border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100 hover:shadow-md'}`}>
                        
                        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-[#f44336]/20">
                          <img src={getAvatarUrl(user.avatar, user.username)} className="w-full h-full object-cover" alt="" />
                        </div>
                        <h3 className="font-extrabold text-[14px] truncate mb-0.5">{user.displayName || user.username}</h3>
                        <p className="text-[11px] text-gray-400 font-bold mb-4">@{user.username}</p>
                        
                        <button
                          onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}
                          className={`w-full py-2 rounded-xl text-[12px] font-extrabold transition-all border
                            ${isDarkMode 
                              ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                              : 'bg-[#f8f9fa] border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                        >
                          {t.viewProfile}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default SearchResults;
