import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, BrowserRouter, useInRouterContext } from 'react-router-dom';
import { Compass, Search, Bell, ArrowLeft } from 'lucide-react';

// ==========================================
// THÀNH PHẦN BẢN ĐỒ THẬT (Bypass lỗi ESBuild)
// ==========================================
function RealLeafletMap({ posts }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadMap = async () => {
      // 1. Nhúng CSS của Leaflet trực tiếp
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // 2. Nhúng JS của Leaflet trực tiếp
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        document.head.appendChild(script);
        await new Promise(resolve => { script.onload = resolve; });
      }

      // 3. Khởi tạo bản đồ khi thư viện đã sẵn sàng
      if (isMounted && mapRef.current && window.L && !mapInstance.current) {
        const L = window.L;
        
        // Tạo bản đồ, center ở miền Trung Việt Nam
        const map = L.map(mapRef.current).setView([15.5, 108.2], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Chuẩn bị Icon đỏ (Admin) và xanh (User)
        const adminIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
        });
        const defaultIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
        });

        // Vẽ các điểm ghim lên bản đồ
        posts.forEach(post => {
          if (post.lat && post.lng) {
            const icon = post.createdBy?.role === 'admin' ? adminIcon : defaultIcon;
            const marker = L.marker([post.lat, post.lng], { icon }).addTo(map);
            
            // Popup HTML khi click vào ghim
            marker.bindPopup(`
              <div style="min-width: 180px; font-family: sans-serif;">
                <span style="font-size: 10px; font-weight: bold; background: ${post.createdBy?.role === 'admin' ? '#fee2e2' : '#e0f2fe'}; color: ${post.createdBy?.role === 'admin' ? '#ef4444' : '#0ea5e9'}; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                  ${post.category || 'Địa điểm'}
                </span>
                <h4 style="margin: 8px 0 4px 0; font-size: 15px; font-weight: 900; color: #111827;">${post.title || post.location}</h4>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #4b5563; line-height: 1.4;">${post.description}</p>
                <div style="font-size: 11px; font-weight: bold; color: #f44336; border-top: 1px solid #f3f4f6; padding-top: 6px;">
                  Bởi: ${post.createdBy?.username || 'Ẩn danh'}
                </div>
              </div>
            `);
          }
        });

        mapInstance.current = map;
      }
    };

    loadMap();

    // Dọn dẹp bản đồ khi chuyển trang
    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [posts]);

  return <div ref={mapRef} className="w-full h-full z-0" />;
}

// ==========================================
// GIAO DIỆN EXPLORE CHÍNH
// ==========================================
function ExploreContent() {
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
        // Lọc bài viết có tọa độ
        const postsWithLocation = data.filter(p => p.lat && p.lng);
        setPosts(postsWithLocation);
      } else {
        throw new Error("Không kết nối được Backend");
      }
    } catch (error) {
      console.log("Đang lấy dữ liệu giả lập cho Canvas Preview...");
      // Dữ liệu mô phỏng để bản đồ Canvas có điểm hiển thị
      setPosts([
        { _id: '1', title: 'Cầu Rồng', location: 'Đà Nẵng', description: 'Biểu tượng của thành phố Đà Nẵng, phun lửa vào cuối tuần.', lat: 16.06, lng: 108.22, category: 'Thành phố', createdBy: { username: 'Admin (Hệ thống)', role: 'admin' } },
        { _id: '2', title: 'Bãi Sao Phú Quốc', location: 'Phú Quốc', description: 'Bãi biển cát trắng mịn tuyệt đẹp nằm ở phía Nam đảo.', lat: 10.05, lng: 104.02, category: 'Biển đảo', createdBy: { username: 'Traveler_Vn', role: 'poster' } },
        { _id: '3', title: 'Phố Cổ Hội An', location: 'Hội An', description: 'Di sản văn hóa thế giới với những ngôi nhà cổ lồng đèn rực rỡ.', lat: 15.88, lng: 108.33, category: 'Văn hóa', createdBy: { username: 'Jane Wanderlust', role: 'poster' } },
        { _id: '4', title: 'Đỉnh Fansipan', location: 'Lai Châu', description: 'Nóc nhà Đông Dương, cảnh tượng mây mù hùng vĩ.', lat: 22.30, lng: 103.77, category: 'Khám phá', createdBy: { username: 'Mountain_King', role: 'poster' } }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden">
      {/* HEADER */}
      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10 shadow-sm flex-shrink-0 relative">
        <div className="w-1/4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight hidden sm:block">The Wanderer</Link>
        </div>
        
        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500">
          <Link to="/dashboard" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">Home</Link>
          <Link to="/explore" className="text-[#f44336] border-b-[3px] border-[#f44336] h-[72px] flex items-center">Explore</Link>
          <Link to="/community" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">Community</Link>
        </nav>

        <div className="w-1/4 flex items-center justify-end gap-5">
          <div className="relative w-full max-w-[200px] hidden md:block">
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

      {/* BẢN ĐỒ FULL MÀN HÌNH */}
      <div className="flex-1 relative z-0 bg-[#e5e3df]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
            <div className="animate-spin w-10 h-10 border-4 border-[#f44336] border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <RealLeafletMap posts={posts} />
        )}
      </div>
    </div>
  );
}

// Bọc Router để chống lỗi Preview
export default function Explore() {
  const hasRouter = typeof useInRouterContext === 'function' ? useInRouterContext() : false;
  if (!hasRouter) {
    return <BrowserRouter><ExploreContent /></BrowserRouter>;
  }
  return <ExploreContent />;
}