import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, MessageSquare, Compass, Settings, 
  MapPin, Image as ImageIcon, Send, ShieldAlert,
  Heart, Share2, MoreHorizontal, CheckCircle
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  
  const [newPost, setNewPost] = useState({ title: '', description: '', location: '', category: 'General' });
  const [pickedCoords, setPickedCoords] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('role') || 'viewer';
    const username = localStorage.getItem('username');
    if (!username) navigate('/login');
    setCurrentUser({ username, role: userRole.toLowerCase() });
    fetchPosts();
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Lỗi fetch posts:", error);
    }
  };

  const handleQuickPost = async () => {
    if (!newPost.description) return alert("Vui lòng nhập nội dung!");
    setIsPosting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: currentUser.role === 'admin' ? 'THÔNG BÁO TỪ HỆ THỐNG' : (newPost.title || `Trải nghiệm của ${currentUser.username}`),
        description: newPost.description,
        location: newPost.location || "Chưa xác định",
        category: currentUser.role === 'admin' ? 'System' : newPost.category,
        lat: pickedCoords ? pickedCoords.lat : null,
        lng: pickedCoords ? pickedCoords.lng : null
      };

      const res = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewPost({ title: '', description: '', location: '', category: 'General' });
        setPickedCoords(null);
        setShowMapPicker(false);
        fetchPosts(); 
      } else {
        const err = await res.json();
        alert(err.message || "Lỗi đăng bài");
      }
    } catch (error) {
      alert("Lỗi mạng!");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      {/* HEADER MỚI (Dựa trên hình ảnh) */}
      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="w-1/4">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">The Wanderer</Link>
        </div>
        
        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500">
          <Link to="/dashboard" className="text-[#f44336] border-b-[3px] border-[#f44336] h-[72px] flex items-center">Home</Link>
          <Link to="/explore" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">Explore</Link>
          <Link to="/community" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">Community</Link>
        </nav>

        <div className="w-1/4 flex items-center justify-end gap-5">
          <button className="text-gray-500 hover:text-gray-900">
            <Bell size={22} strokeWidth={2} />
          </button>
          <Link to="/profile" className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden cursor-pointer border border-gray-200">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Me" className="w-full h-full object-cover" />
          </Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto pt-8 px-4 flex gap-8 items-start">
        
        <div className="flex-1 max-w-[650px]">
          {/* KHUNG ĐĂNG BÀI */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
              </div>
              <textarea 
                placeholder={currentUser.role === 'admin' ? "Phát thông báo hệ thống..." : "Chia sẻ địa điểm bạn vừa khám phá..."}
                className="w-full bg-[#f4f4f5] rounded-xl p-3.5 text-[14px] font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all"
                rows="2"
                value={newPost.description}
                onChange={e => setNewPost({...newPost, description: e.target.value})}
              ></textarea>
            </div>
            
            {showMapPicker && (
              <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 animate-in fade-in duration-300">
                <p className="text-[12px] font-bold text-gray-500 mb-2">📍 Click vào bản đồ để lấy tọa độ chính xác</p>
                
                {/* BẢN ĐỒ MÔ PHỎNG DÀNH CHO CANVAS PREVIEW */}
                <div className="h-[200px] w-full rounded-lg overflow-hidden border border-gray-200 mb-3 relative z-0 flex flex-col items-center justify-center bg-gray-100">
                  <MapPin size={32} className="text-gray-400 mb-2" />
                  <p className="text-[13px] font-bold text-gray-500">Bản đồ (Chế độ xem trước)</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-[250px] text-center">
                    Cài đặt <strong>react-leaflet</strong> ở môi trường local của bạn để xem bản đồ thật.
                  </p>
                  <button 
                    onClick={() => setPickedCoords({ lat: 16.047, lng: 108.206 })}
                    className="mt-3 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-[12px] font-bold hover:bg-gray-50 transition-colors text-[#f44336]"
                  >
                    Giả lập ghim vị trí (Đà Nẵng)
                  </button>
                </div>

                <input 
                  type="text" 
                  placeholder="Nhập tên địa điểm (VD: Cầu Rồng, Đà Nẵng)" 
                  className="w-full text-[13px] font-medium p-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#f44336]"
                  value={newPost.location}
                  onChange={e => setNewPost({...newPost, location: e.target.value})}
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${pickedCoords ? 'bg-red-50 text-[#f44336]' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <MapPin size={16} strokeWidth={2.5} /> {pickedCoords ? 'Đã ghim vị trí' : 'Ghim vị trí'}
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                  <ImageIcon size={16} strokeWidth={2.5} /> Tải ảnh lên
                </button>
              </div>
              <button 
                onClick={handleQuickPost}
                disabled={isPosting}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-bold text-white transition-all shadow-md ${currentUser.role === 'admin' ? 'bg-gray-900 shadow-gray-900/20 hover:bg-black' : 'bg-[#f44336] shadow-red-500/20 hover:bg-[#e53935]'}`}
              >
                {isPosting ? 'Đang tải...' : <><Send size={16} /> {currentUser.role === 'admin' ? 'Đăng Thông Báo' : 'Đăng Bài'}</>}
              </button>
            </div>
          </div>

          {/* DANH SÁCH BÀI VIẾT FEED */}
          <div className="space-y-6 pb-12">
            {posts.map((post) => {
              const isAdmin = post.createdBy?.role === 'admin';
              
              return (
                <div key={post._id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${isAdmin ? 'border-red-200' : 'border-gray-100'}`}>
                  
                  {isAdmin && (
                    <div className="bg-red-50 px-5 py-2.5 flex items-center gap-2 border-b border-red-100">
                      <ShieldAlert size={16} className="text-[#f44336]" />
                      <span className="text-[11px] font-black text-[#f44336] uppercase tracking-widest">Thông báo từ Ban Quản Trị</span>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${isAdmin ? 'border-[#f44336]' : 'border-transparent'}`}>
                          <img src={post.createdBy?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-1.5">
                            {post.createdBy?.username || "Người dùng ẩn danh"} 
                            {isAdmin && <CheckCircle size={14} className="text-[#f44336]" />}
                          </h3>
                          <p className="text-[11px] font-medium text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20} /></button>
                    </div>

                    <p className="text-[14px] text-gray-800 font-medium leading-relaxed mb-4 whitespace-pre-wrap">
                      {post.description}
                    </p>

                    {/* Hiển thị Bản đồ Mô phỏng nếu có tọa độ */}
                    {post.lat && post.lng && (
                      <div className="mb-4 border border-gray-100 rounded-xl overflow-hidden relative">
                        <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#f44336]" />
                          <span className="text-[12px] font-bold text-gray-800">{post.location}</span>
                        </div>
                        <div className="h-[250px] w-full z-0 flex flex-col items-center justify-center bg-[#e5e3df]">
                          <MapPin size={36} className="text-[#f44336] mb-2 opacity-80" />
                          <p className="text-[13px] font-bold text-gray-700">Bản đồ chỉ đường</p>
                          <p className="text-[11px] text-gray-500 mt-1">Tọa độ: [{post.lat}, {post.lng}]</p>
                        </div>
                      </div>
                    )}

                    {post.images && post.images.length > 0 && (
                      <img src={post.images[0]} alt="Post media" className="w-full rounded-xl mb-4 max-h-[400px] object-cover border border-gray-100" />
                    )}

                    <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
                      <button className="flex items-center gap-1.5 text-gray-500 hover:text-[#f44336] transition-colors text-[13px] font-bold">
                        <Heart size={20} strokeWidth={2.5} /> {post.likes?.length || 0}
                      </button>
                      <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-bold">
                        <MessageSquare size={20} strokeWidth={2.5} /> Bình luận
                      </button>
                      <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-bold ml-auto">
                        <Share2 size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDEBAR (CỘT ĐỀ XUẤT) */}
        <aside className="w-[320px] hidden xl:block flex-shrink-0 space-y-6 sticky top-[104px]">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-4">📍 Địa điểm Đang Hot</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-[#f44336] uppercase tracking-wider mb-0.5">Biển</p>
                <p className="text-[13px] font-bold text-gray-900 leading-tight cursor-pointer hover:underline">Bãi Sao, Phú Quốc</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Hơn 200 người đang check-in</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#00897b] uppercase tracking-wider mb-0.5">Văn Hóa</p>
                <p className="text-[13px] font-bold text-gray-900 leading-tight cursor-pointer hover:underline">Phố cổ Hội An</p>
                <p className="text-[11px] text-gray-400 mt-0.5">52 bài viết tuần này</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-4">👥 Gợi ý kết bạn</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" alt="Marco" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">Trần Phượt</p>
                    <p className="text-[11px] text-gray-500">Chuyên leo núi</p>
                  </div>
                </div>
                <button className="text-[12px] font-bold text-[#f44336] bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Theo dõi</button>
              </div>
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}