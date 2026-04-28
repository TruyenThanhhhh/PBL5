import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, BrowserRouter, useInRouterContext } from 'react-router-dom';
import { Compass, Search, Bell, ArrowLeft } from 'lucide-react';

// Hàm tự động sinh màu sắc phân biệt dựa trên Username (Hash String to HSL)
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const s = 70 + (Math.abs(hash) % 20); // Saturation 70-90%
  const l = 45 + (Math.abs(hash) % 10); // Lightness 45-55%
  return `hsl(${h}, ${s}%, ${l}%)`;
};

// ==========================================
// THÀNH PHẦN BẢN ĐỒ THẬT
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

        // Vẽ các điểm ghim lên bản đồ
        posts.forEach(post => {
          if (post.lat && post.lng) {
            const username = post.createdBy?.username || 'Ẩn danh';
            const userColor = stringToColor(username); // Lấy màu đặc trưng cho user

            // Tạo Ghim CSS theo màu đặc trưng của User
            const customIcon = L.divIcon({
              className: 'custom-pin',
              html: `<div style="background-color: ${userColor}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #fff; box-shadow: 2px 2px 6px rgba(0,0,0,0.4);"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 24],
              popupAnchor: [0, -26],
              tooltipAnchor: [0, -26]
            });
            
            const marker = L.marker([post.lat, post.lng], { icon: customIcon }).addTo(map);
            
            // SỰ KIỆN HOVER: Tooltip hiển thị Tên và Tọa độ
            marker.bindTooltip(`
              <div style="text-align: center; font-family: sans-serif;">
                <strong style="color: ${userColor};">${username}</strong><br/>
                <span style="font-size: 11px; color: #666;">[${post.lat.toFixed(4)}, ${post.lng.toFixed(4)}]</span>
              </div>
            `, {
              direction: 'top',
              className: 'leaflet-tooltip-custom'
            });

            // SỰ KIỆN CLICK: Popup HTML khi click vào ghim
            marker.bindPopup(`
              <div style="min-width: 180px; font-family: sans-serif;">
                <span style="font-size: 10px; font-weight: bold; background: #f3f4f6; color: ${userColor}; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                  ${post.category || 'Địa điểm'}
                </span>
                <h4 style="margin: 8px 0 4px 0; font-size: 15px; font-weight: 900; color: #111827;">${post.title || post.location}</h4>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #4b5563; line-height: 1.4;">${post.description}</p>
                <div style="font-size: 11px; font-weight: bold; color: ${userColor}; border-top: 1px solid #f3f4f6; padding-top: 6px;">
                  Bởi: ${username}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await fetch('http://localhost:5000/api/posts', { headers });
      if (res.ok) {
        const data = await res.json();
        // Lọc bài viết có tọa độ
        const postsWithLocation = Array.isArray(data) ? data.filter(p => p.lat && p.lng) : [];
        setPosts(postsWithLocation);
      } else {
        setPosts([]);
      }
    } catch (error) {
      setPosts([]); // Không dùng dữ liệu giả định nữa
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;
    const title = String(post.title || '').toLowerCase();
    const location = String(post.location || '').toLowerCase();
    const description = String(post.description || '').toLowerCase();
    const category = String(post.category || '').toLowerCase();
    return title.includes(keyword) || location.includes(keyword) || description.includes(keyword) || category.includes(keyword);
  });

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <RealLeafletMap posts={filteredPosts} />
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