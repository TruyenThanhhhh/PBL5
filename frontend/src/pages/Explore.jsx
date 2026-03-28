import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Search, ArrowLeft, Bell, MapPin } from 'lucide-react';

export default function Explore() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/posts');
      if (res.ok) {
        const data = await res.json();
        // Lọc ra những bài viết nào có chứa tọa độ lat & lng
        const postsWithLocation = data.filter(p => p.lat && p.lng);
        setPosts(postsWithLocation);
      } else {
        throw new Error("API lỗi");
      }
    } catch (error) {
      console.error("Lỗi khi tải bài viết trên bản đồ:", error);
      // Fallback mock data cho môi trường Canvas
      setPosts([
        { _id: '1', title: 'Cầu Rồng', description: 'Đà Nẵng về đêm', lat: 16.06, lng: 108.22, category: 'City', createdBy: { username: 'Admin', role: 'admin' } },
        { _id: '2', title: 'Bãi Sao', description: 'Biển xanh cát trắng', lat: 10.05, lng: 104.02, category: 'Beach', createdBy: { username: 'Traveler1', role: 'poster' } }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden">
      {/* HEADER */}
      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10 shadow-sm flex-shrink-0">
        <div className="w-1/4">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">The Wanderer</Link>
        </div>
        
        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500">
          <Link to="/dashboard" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">Home</Link>
          <Link to="/explore" className="text-[#f44336] border-b-[3px] border-[#f44336] h-[72px] flex items-center">Explore</Link>
          <Link to="/community" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">Community</Link>
        </nav>

        <div className="w-1/4 flex items-center justify-end gap-5">
          <div className="relative w-full max-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search map..." 
              className="w-full pl-9 pr-3 py-2 bg-[#f4f4f5] border-transparent rounded-full text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20"
            />
          </div>
          <button className="text-gray-500 hover:text-gray-900">
            <Bell size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* KHU VỰC BẢN ĐỒ MÔ PHỎNG */}
      <div className="flex-1 relative z-0 bg-[#e5e3df] flex items-center justify-center p-6">
        {isLoading ? (
          <div className="animate-spin w-8 h-8 border-4 border-[#f44336] border-t-transparent rounded-full"></div>
        ) : (
          <div className="text-center p-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 max-w-lg w-full">
            <MapPin size={48} className="mx-auto text-[#f44336] mb-4 opacity-80" />
            <h2 className="text-xl font-black text-gray-900 mb-2">Bản đồ Khám Phá</h2>
            <p className="text-sm text-gray-600 mb-6">
              Hệ thống đã tìm thấy <strong>{posts.length}</strong> địa điểm được ghim trên toàn thế giới.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100 max-h-[250px] overflow-y-auto">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Danh sách địa điểm (Chế độ xem trước)</p>
              <div className="space-y-3">
                {posts.map(post => (
                  <div key={post._id} className="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="mt-1">
                      <MapPin size={16} className={post.createdBy?.role === 'admin' ? 'text-red-500' : 'text-gray-400'} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-gray-900">{post.title || post.location}</h4>
                      <p className="text-[12px] text-gray-500 line-clamp-1">{post.description}</p>
                      <p className="text-[10px] font-medium text-gray-400 mt-1">
                        Tọa độ: [{post.lat}, {post.lng}] • Bởi {post.createdBy?.username}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-6 px-4">
              * Đây là giao diện mô phỏng. Khi bạn chạy mã nguồn chứa react-leaflet trên máy tính cá nhân, một bản đồ tương tác thực sự sẽ xuất hiện tại đây.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}