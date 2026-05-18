import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, Home, Compass, Bookmark, MapPin, Star,
  MessageSquare, ArrowUp, ArrowDown, Loader2, User, Send, Heart, Share2
} from 'lucide-react';

import AccountMenu from '../components/AccountMenu';
import NotificationBell from '../components/NotificationBell';

// --- TIỆN ÍCH XỬ LÝ ẢNH ---
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
};

const getAvatarUrl = (url, name) => {
  const finalUrl = getImageUrl(url);
  return finalUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff&size=200`;
};

// --- COMPONENT NÚT LƯU BÀI VIẾT ---
const SavePostButton = ({ postId, initialIsSaved }) => {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  
  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  const handleSave = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return alert('Vui lòng đăng nhập để lưu bài viết.');
    try {
      const res = await fetch(`http://localhost:5000/api/users/save-post/${postId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.isSaved);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button type="button" onClick={handleSave} className={`flex items-center gap-1.5 transition-colors text-[13px] font-bold ${isSaved ? 'text-[#f44336]' : 'text-gray-500 hover:text-gray-900'}`}>
      <Bookmark size={20} strokeWidth={isSaved ? 3 : 2.5} fill={isSaved ? '#f44336' : 'none'} />
    </button>
  );
};

// --- LOGIC BẢN ĐỒ LEAFLET ---
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
      if (document.getElementById('leaflet-js')) {
        const waitReady = setInterval(() => {
          if (window.L) { clearInterval(waitReady); resolve(); }
        }, 50);
        setTimeout(() => { clearInterval(waitReady); if (!window.L) reject(new Error('Leaflet load timeout')); }, 7000);
        return;
      }
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Không tải được Leaflet'));
      document.head.appendChild(script);
    });
  }
  await leafletAssetsPromise;
};

function RealMapViewer({ lat, lng, location }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadMap = async () => {
      await loadLeafletAssets();
      if (isMounted && mapRef.current && window.L && !mapInstance.current) {
        const L = window.L;
        const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
        const defaultIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
        });
        
        const popupText = typeof location === 'string' && location !== 'Chưa xác định' ? location : 'Vị trí được ghim';
        L.marker([lat, lng], { icon: defaultIcon }).addTo(map).bindPopup(`<b>${popupText}</b>`);
        mapInstance.current = map;
        setIsMapReady(true);
      }
    };
    loadMap().catch(() => setIsMapReady(false));
    return () => { isMounted = false; if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [lat, lng, location]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full z-0" />
      {!isMapReady && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center text-[12px] font-bold text-gray-500">
          Đang tải bản đồ...
        </div>
      )}
    </div>
  );
}

// --- COMPONENT CHÍNH ---
export default function PostDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get('postId');

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const currentUser = { 
    userId: localStorage.getItem('userId'),
    avatar: localStorage.getItem('avatar'),
    username: localStorage.getItem('displayName') || localStorage.getItem('username')
  };

  useEffect(() => {
    if (!postId) {
      setError('Không tìm thấy mã bài viết.');
      setLoading(false);
      return;
    }

    const fetchPostAndComments = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        let postData = null;

        // BƯỚC 1: Thử lấy dữ liệu từ API chi tiết bài viết
        const postRes = await fetch(`http://localhost:5000/api/posts/${postId}`, { headers });
        
        if (!postRes.ok) {
          // BƯỚC 2 (FALLBACK): Nếu API chi tiết bị lỗi, tiến hành lấy từ danh sách tổng
          const allPostsRes = await fetch(`http://localhost:5000/api/posts`, { headers });
          if (!allPostsRes.ok) throw new Error('Bài viết không tồn tại hoặc đã bị xóa.');
          
          const allPostsData = await allPostsRes.json();
          const postsArray = Array.isArray(allPostsData) ? allPostsData : (allPostsData.posts || []);
          
          const foundPost = postsArray.find(p => String(p._id) === String(postId));
          if (!foundPost) throw new Error('Bài viết không tồn tại hoặc đã bị xóa.');
          postData = foundPost;
        } else {
          const resData = await postRes.json();
          postData = resData.post || resData;
        }

        setPost(postData);

        // Kiểm tra xem bài viết đã được lưu chưa
        if (token) {
          const savedRes = await fetch('http://localhost:5000/api/users/saved-posts', { headers });
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            setIsSaved(savedData.some(p => String(p._id) === String(postId)));
          }
        }

        // BƯỚC 3: Lấy danh sách bình luận (Comment)
        const commentRes = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, { headers });
        if (commentRes.ok) {
          const commentData = await commentRes.json();
          setComments(Array.isArray(commentData.comments) ? commentData.comments : []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [postId]);

  // Xử lý Thả Tim (Like)
  const handleLikePost = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Vui lòng đăng nhập để thả tim bài viết.');

    setIsLiking(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts/like/${postId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPost(prev => {
          const existingLikes = Array.isArray(prev.likes) ? [...prev.likes] : [];
          const userLiked = existingLikes.includes(currentUser.userId);
          const updatedLikes = data.liked 
            ? (userLiked ? existingLikes : [...existingLikes, currentUser.userId])
            : existingLikes.filter(id => id !== currentUser.userId);
          return { ...prev, likes: updatedLikes };
        });
      }
    } catch (error) {
      console.error('Lỗi khi thả tim:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Xử lý Gửi Bình Luận
  const handlePostComment = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Vui lòng đăng nhập để bình luận.');
    if (!commentInput.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentInput })
      });

      if (res.ok) {
        setCommentInput('');
        const commentRes = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const commentData = await commentRes.json();
        setComments(Array.isArray(commentData.comments) ? commentData.comments : []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPostLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert('Đã copy link bài viết thành công!');
    } catch (error) {
      console.error('Lỗi copy link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="animate-spin text-[#f44336]" size={40} />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc]">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{error || 'Không thể tải bài viết.'}</h2>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-[#f44336] text-white rounded-full font-bold shadow-md hover:bg-red-600 transition-colors">Về trang chủ</button>
      </div>
    );
  }

  const postImages = Array.isArray(post.images) ? post.images.map(getImageUrl).filter(Boolean) : [];
  const mainImage = postImages.length > 0 ? postImages[0] : null;
  const authorName = post.createdBy?.displayName || post.createdBy?.username || 'Người dùng';
  const authorAvatar = getAvatarUrl(post.createdBy?.avatar, authorName);
  const likedByCurrentUser = Array.isArray(post.likes) && post.likes.includes(currentUser.userId);

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-gray-900 pb-16">
      {/* NAVBAR */}
      <header className="flex items-center justify-between py-3 px-6 bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-8 w-1/4">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">
            The Wanderer
          </Link>
        </div>

        <div className="flex-1 max-w-2xl relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="w-full pl-11 pr-4 py-2.5 bg-[#f4f4f5] border-transparent rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 font-medium placeholder-gray-400 transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-6 w-1/4">
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-bold text-gray-500">
            <Link to="/explore" className="text-[#f44336] border-b-2 border-[#f44336] pb-1">Khám phá</Link>
            <Link to="/community" className="hover:text-gray-900 transition-colors">Cộng đồng</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} className="text-gray-500 hover:text-gray-900 transition-colors">
              <MessageSquare size={20} />
            </button>
            <AccountMenu avatar={currentUser.avatar} username={currentUser.username} />
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-[1500px] mx-auto px-6 2xl:px-8 py-6 flex gap-8">
        
        {/* LEFT SIDEBAR - ĐÃ ĐƯỢC LÀM SẠCH GỌN GÀNG THEO YÊU CẦU */}
        <aside className="w-[220px] hidden md:block flex-shrink-0">
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-1">Khám phá</h2>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tâm điểm hành trình</p>
          </div>

          <nav className="space-y-1 text-[13px] font-bold text-gray-500">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <Home size={18} strokeWidth={2.5} /> Trang chủ
            </Link>
            <Link to="/explore" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-[#f44336] rounded-xl mb-2 transition-colors">
              <Compass size={18} strokeWidth={2.5} /> Khám phá
            </Link>
            <div className="pt-6 mt-6 border-t border-gray-100">
              <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors w-full text-left">
                <Bookmark size={18} strokeWidth={2.5} /> Bài viết đã lưu
              </button>
            </div>
          </nav>
        </aside>

        {/* FEED CONTENT (POST DETAIL) */}
        <section className="flex-1 min-w-0 pt-2">
          
          {/* Tags */}
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[#b2ebf2] text-[#00838f] text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full">
              {post.category || 'CHUNG'}
            </span>
          </div>

          {/* Title & Actions */}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-[1.2] tracking-tight mb-4 whitespace-pre-wrap">
            {post.title || `Trải nghiệm của ${authorName}`}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 text-[13px] font-bold text-gray-600">
              <div className="flex items-center gap-1.5 text-gray-800">
                <MapPin size={16} className="text-[#f44336]" /> {post.location && post.location !== "Chưa xác định" ? post.location : "Vị trí bí mật"}
              </div>
              <span className="text-gray-300">/</span>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-gray-900 transition-colors"
                onClick={() => navigate('/profile', { state: { targetUserId: post.createdBy?._id } })}
              >
                <img src={authorAvatar} className="w-6 h-6 rounded-full object-cover" alt="Author" />
                {authorName}
              </div>
              <span className="text-gray-300">/</span>
              <span className="text-gray-400 font-medium">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          {/* Featured Image */}
          {mainImage && (
            <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-8 shadow-sm border border-gray-100 bg-gray-100">
              <img 
                src={mainImage} 
                alt="Post Main" 
                className="w-full h-full object-contain bg-black/5"
              />
            </div>
          )}

          {/* Sub Images if any */}
          {postImages.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {postImages.slice(1, 5).map((img, idx) => (
                <div key={idx} className="h-32 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-100">
                   <img src={img} className="w-full h-full object-cover" alt={`Sub img ${idx}`} />
                </div>
              ))}
            </div>
          )}

          {/* Article Content */}
          <div className="text-[15px] text-gray-800 leading-relaxed font-medium space-y-6 mb-8 whitespace-pre-wrap">
            {post.description}
          </div>

          {/* ACTION BARS (LIKE, COMMENT, SHARE, SAVE) */}
          <div className="flex items-center gap-6 py-4 border-t border-b border-gray-100 mb-10">
            <button
              type="button"
              onClick={handleLikePost}
              disabled={isLiking}
              className={`flex items-center gap-1.5 ${likedByCurrentUser ? 'text-[#f44336]' : 'text-gray-500 hover:text-[#f44336]'} transition-colors text-[14px] font-bold disabled:opacity-50`}
            >
              <Heart size={22} strokeWidth={2.5} fill={likedByCurrentUser ? '#f44336' : 'none'} /> 
              {Array.isArray(post.likes) ? post.likes.length : 0} Lượt thích
            </button>
            
            <div className="flex items-center gap-1.5 text-gray-500 text-[14px] font-bold">
              <MessageSquare size={22} strokeWidth={2.5} /> {comments.length} Bình luận
            </div>

            <SavePostButton postId={post._id} initialIsSaved={isSaved} />
            
            <button type="button" onClick={handleCopyPostLink} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[14px] font-bold ml-auto">
              <Share2 size={22} strokeWidth={2.5} /> Chia sẻ
            </button>
          </div>

          {/* Discussion Section */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900">Bình luận ({comments.length})</h3>
          </div>

          {/* Comment Input */}
          <div className="mb-10">
            <div className="flex gap-4">
              <img src={getAvatarUrl(currentUser.avatar, currentUser.username)} className="w-10 h-10 rounded-full object-cover" alt="User" />
              <div className="flex-1">
                <textarea 
                  className="w-full bg-[#f4f4f5] border-transparent rounded-xl p-4 text-[13px] font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 resize-none h-[100px]"
                  placeholder="Chia sẻ cảm nghĩ của bạn về bài viết này..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                ></textarea>
                <div className="flex justify-end mt-3">
                  <button onClick={handlePostComment} disabled={isSubmitting} className="bg-[#f44336] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#e53935] shadow-sm disabled:opacity-50 transition-colors">
                    Gửi bình luận
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-8">
            {comments.length === 0 ? (
               <div className="text-center text-gray-400 text-[13px] font-bold py-10 bg-gray-50 rounded-2xl">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
            ) : (
               comments.map(comment => (
                 <div key={comment._id} className="flex gap-4">
                  <div className="flex flex-col items-center text-gray-400 w-8">
                    <button className="hover:text-[#f44336]"><ArrowUp size={20} /></button>
                    <span className="text-[12px] font-bold text-gray-700 my-1">0</span>
                    <button className="hover:text-[#f44336]"><ArrowDown size={20} /></button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 
                        className="text-[13px] font-extrabold text-gray-900 cursor-pointer hover:underline"
                        onClick={() => navigate('/profile', { state: { targetUserId: comment.author?._id } })}
                      >
                        {comment.author?.displayName || comment.author?.username}
                      </h4>
                      {comment.author?._id === post.createdBy?._id && (
                        <span className="bg-red-100 text-[#f44336] text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">Tác giả</span>
                      )}
                      <span className="text-[11px] font-medium text-gray-400">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="text-[13px] text-gray-700 font-medium leading-relaxed mb-3 whitespace-pre-wrap bg-[#f4f4f5] px-4 py-3 rounded-2xl rounded-tl-none inline-block">
                      {comment.content}
                    </p>
                  </div>
                </div>
               ))
            )}
          </div>
        </section>

        {/* RIGHT SIDEBAR - BẢN ĐỒ CHI TIẾT */}
        <aside className="w-[340px] hidden xl:block flex-shrink-0 space-y-6">
          {post.lat && post.lng ? (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 sticky top-[100px]">
              <h4 className="text-[14px] font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-[#f44336]" /> Vị trí trên bản đồ
              </h4>
              <div className="h-[250px] w-full rounded-2xl overflow-hidden relative z-0 border border-gray-200">
                <RealMapViewer lat={post.lat} lng={post.lng} location={post.location} />
              </div>
              <div className="mt-4 flex flex-col gap-1 text-[13px] font-medium text-gray-600 mb-4 px-1">
                <p>📍 {post.location || 'Chưa xác định'}</p>
                <p className="text-[11px] text-gray-400 font-mono">Tọa độ: {Number(post.lat).toFixed(4)}, {Number(post.lng).toFixed(4)}</p>
              </div>
              <button 
                onClick={() => window.open(`https://www.google.com/maps?q=${post.lat},${post.lng}`, '_blank')}
                className="w-full bg-red-50 text-[#f44336] text-[13px] font-bold py-2.5 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                Mở Google Maps
              </button>
            </div>
          ) : (
            <div className="bg-[#fdf4e6] h-[220px] rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm border border-orange-100 p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-3">
                <Compass className="w-8 h-8 text-orange-400" />
              </div>
              <h4 className="text-[13px] font-extrabold text-gray-800">Chưa có vị trí</h4>
              <p className="text-[11px] font-medium text-gray-500 mt-1">Bài viết này không được ghim trên bản đồ.</p>
            </div>
          )}
        </aside>

      </main>
    </div>
  );
}