import React, { useState, useEffect } from 'react';
import { useNavigate, BrowserRouter, useInRouterContext, Link } from 'react-router-dom';
import { TrendingUp, Home, Compass, Bookmark, Settings, Heart, MessageCircle, MapPin, Loader2, Share2, Eye } from 'lucide-react';

function TrendingContent() {
  const navigate = useNavigate();
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrendingPosts();
  }, []);

  const fetchTrendingPosts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/posts/trending');
      if (res.ok) {
        const data = await res.json();
        setTrendingPosts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách trending:", error);
    } finally {
      setIsLoading(false);
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
            <Home size={22} className="group-hover:scale-110 transition-transform" /> Trang chủ
          </button>
          <button onClick={() => navigate('/explore')} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 text-gray-600 hover:text-[#f44336] rounded-xl font-bold transition-all group text-[15px]">
            <Compass size={22} className="group-hover:scale-110 transition-transform" /> Khám phá
          </button>
          <button className="w-full flex items-center gap-4 px-4 py-3.5 bg-red-50 text-[#f44336] rounded-xl font-bold transition-all group text-[15px]">
            <TrendingUp size={22} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" /> Thịnh hành
          </button>
          <button onClick={() => navigate('/saved')} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 text-gray-600 hover:text-[#f44336] rounded-xl font-bold transition-all group text-[15px]">
            <Bookmark size={22} className="group-hover:scale-110 transition-transform" /> Đã lưu
          </button>
          <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 text-gray-600 hover:text-[#f44336] rounded-xl font-bold transition-all group text-[15px]">
            <Settings size={22} className="group-hover:scale-110 transition-transform" /> Cài đặt
          </button>
        </nav>
      </aside>

      <main className="flex-1 max-w-[900px] mx-auto px-4 sm:px-8 py-8 w-full">
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-50 text-[#f44336] rounded-full flex items-center justify-center shadow-sm">
              <TrendingUp size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Thịnh hành</h1>
          </div>
          <p className="text-[15px] font-medium text-gray-500 ml-15">Những bài viết nổi bật và được quan tâm nhiều nhất trong cộng đồng.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 size={40} className="animate-spin text-[#f44336]" />
          </div>
        ) : trendingPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <TrendingUp size={64} className="text-gray-300 mb-6" strokeWidth={1.5} />
            <h2 className="text-xl font-black text-gray-900 mb-2">Chưa có bài viết thịnh hành</h2>
            <p className="text-[15px] text-gray-500 font-medium">Hãy tương tác nhiều hơn để các bài viết được lên xu hướng nhé.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {trendingPosts.map((post, index) => (
              <div 
                key={post._id} 
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row relative animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/post-detail?postId=${post._id}`)}
              >
                {/* Ranking Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div className={`px-4 py-1.5 rounded-full font-black text-[13px] shadow-md flex items-center gap-1.5 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                    index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white' :
                    'bg-white text-gray-900 border border-gray-100'
                  }`}>
                    {index <= 2 && <TrendingUp size={14} />}
                    TOP {index + 1}
                  </div>
                </div>

                <div className="w-full md:w-[320px] h-[240px] flex-shrink-0 bg-gray-100 relative overflow-hidden">
                  {post.images && post.images.length > 0 ? (
                    <img src={post.images[0]} alt="Post media" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-50">
                      Không có ảnh
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                </div>

                <div className="p-6 flex flex-col justify-center flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-red-50 text-[#f44336] text-[11px] font-bold uppercase tracking-wider rounded-lg border border-red-100/50">
                      {post.category || 'Khám phá'}
                    </span>
                    <span className="text-[13px] font-medium text-gray-400 flex items-center gap-1">
                      <MapPin size={14} /> {post.location || 'Chưa rõ'}
                    </span>
                  </div>
                  
                  <h2 className="text-[20px] font-extrabold text-gray-900 leading-tight mb-2 group-hover:text-[#f44336] transition-colors line-clamp-2">
                    {post.title || post.location || 'Chưa rõ tiêu đề'}
                  </h2>
                  
                  <p className="text-[14px] text-gray-600 font-medium mb-6 line-clamp-2 leading-relaxed">
                    {post.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={getAvatarUrl(post.createdBy?.avatar, post.createdBy?.username)} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-gray-100" />
                      <span className="text-[14px] font-extrabold text-gray-900 truncate max-w-[120px]">
                        {post.createdBy?.username || 'Người dùng'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-gray-500 font-bold text-[13px]">
                      <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <Heart size={16} className="text-[#f44336]" fill={post.likeCount > 0 ? "#f44336" : "none"} /> 
                        {post.likeCount || 0}
                      </span>
                      <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <MessageCircle size={16} /> 
                        {post.comments?.length || 0}
                      </span>
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

export default function Trending() {
  const hasRouter = useInRouterContext();
  if (!hasRouter) {
    return (
      <BrowserRouter>
        <TrendingContent />
      </BrowserRouter>
    );
  }
  return <TrendingContent />;
}