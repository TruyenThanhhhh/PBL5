import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, BrowserRouter, useInRouterContext } from 'react-router-dom';
import { Compass, Search, Bell, ArrowLeft, ShieldAlert, CheckCircle, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AccountMenu from '../components/AccountMenu';

// Hàm hash để tạo màu ngẫu nhiên dựa trên username
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 75%, 50%)`;
};

// ==========================================
// THÀNH PHẦN BẢN ĐỒ THẬT
// ==========================================
function RealLeafletMap({ posts, flyToLocation }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

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

        mapInstance.current = map;
      }
    };

    loadMap();

    // Dọn dẹp bản đồ khi unmount
    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;

    // Xóa markers cũ trước khi render markers mới
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Vẽ các điểm ghim lên bản đồ
    posts.forEach(post => {
      if (post.lat && post.lng) {
        // Xử lý icon theo màu sắc riêng biệt cho từng User
        const username = post.createdBy?.username || 'Ẩn danh';
        const userColor = stringToColor(username);
        const isAdmin = post.createdBy?.role === 'admin';

        // Dùng divIcon để tạo Pin custom bằng HTML/CSS
        const customIcon = L.divIcon({
          className: 'custom-pin',
          html: `<div style="background-color: ${isAdmin ? '#ef4444' : userColor}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #fff; box-shadow: 2px 2px 6px rgba(0,0,0,0.4);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -26]
        });

        const marker = L.marker([post.lat, post.lng], { icon: customIcon }).addTo(map);
        
        // Thêm Tooltip khi hover (di chuột)
        marker.bindTooltip(
          `<div style="text-align:center;"><b>${post.location || post.title}</b><br/><span style="font-size:10px; color:#666;">Đăng bởi: ${username}</span></div>`, 
          { direction: 'top', offset: [0, -26], opacity: 0.9 }
        );
        
        // Popup HTML khi click vào ghim
        marker.bindPopup(`
          <div style="min-width: 180px; font-family: sans-serif;">
            <span style="font-size: 10px; font-weight: bold; background: ${isAdmin ? '#fee2e2' : '#e0f2fe'}; color: ${isAdmin ? '#ef4444' : '#0ea5e9'}; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${post.category || 'Địa điểm'}
            </span>
            <h4 style="margin: 8px 0 4px 0; font-size: 15px; font-weight: 900; color: #111827;">${post.title || post.location}</h4>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #4b5563; line-height: 1.4;">${post.description}</p>
            <div style="font-size: 11px; font-weight: bold; color: ${userColor}; border-top: 1px solid #f3f4f6; padding-top: 6px;">
              Bởi: ${username}
            </div>
          </div>
        `);

        markersRef.current.push(marker);
      }
    });
  }, [posts]);

  useEffect(() => {
    if (mapInstance.current && flyToLocation) {
      // flyTo(tọa độ, zoom_level, tùy chọn animation)
      mapInstance.current.flyTo(flyToLocation, 13, {
        animate: true,
        duration: 1.5 // Thời gian bay (giây)
      });
    }
  }, [flyToLocation]);

  return <div ref={mapRef} className="w-full h-full z-0" />;
}

// ==========================================
function ExploreContent() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const t = language === 'vi' 
    ? {
        home: 'Trang chủ',
        explore: 'Khám phá',
        community: 'Cộng đồng',
        search: 'Tìm trên bản đồ...',
        loginRequired: 'Vui lòng đăng nhập để sử dụng tính năng này',
        notFound: 'Không tìm thấy vị trí',
        connError: 'Lỗi kết nối đến máy chủ bản đồ.'
      }
    : {
        home: 'Home',
        explore: 'Explore',
        community: 'Community',
        search: 'Search map...',
        loginRequired: 'Please login to use this feature',
        notFound: 'Location not found',
        connError: 'Error connecting to map server.'
      };

  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [flyToLocation, setFlyToLocation] = useState(null); // Lưu tọa độ để map bay tới
  const [notification, setNotification] = useState({ type: '', text: '' }); // Quản lý Toast thông báo

  useEffect(() => {
    fetchPosts();
  }, []);

  const showToast = (type, text) => {
    setNotification({ type, text: String(text) });
    setTimeout(() => setNotification({ type: '', text: '' }), 5000);
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      // Bắt buộc đăng nhập để xem Map (chỉ xem bài của bạn bè)
      if (!token) throw new Error(t.loginRequired);

      // Gọi vào API Explore mới tạo để chỉ lọc bài của friends
      const res = await fetch('http://localhost:5000/api/posts/explore', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        throw new Error("Không kết nối được Backend");
      }
    } catch (error) {
      console.log(error.message);
      // Dữ liệu mô phỏng trong quá trình dev nếu không kết nối được backend
      setPosts([
        { _id: '1', title: 'Cầu Rồng', location: 'Đà Nẵng', description: 'Biểu tượng của thành phố Đà Nẵng, phun lửa vào cuối tuần.', lat: 16.06, lng: 108.22, category: 'Thành phố', createdBy: { username: 'Admin (Hệ thống)', role: 'admin' } },
        { _id: '2', title: 'Bãi Sao Phú Quốc', location: 'Phú Quốc', description: 'Bãi biển cát trắng mịn tuyệt đẹp nằm ở phía Nam đảo.', lat: 10.05, lng: 104.02, category: 'Biển đảo', createdBy: { username: 'Traveler_Vn', role: 'user' } },
        { _id: '3', title: 'Phố Cổ Hội An', location: 'Hội An', description: 'Di sản văn hóa thế giới với những ngôi nhà cổ lồng đèn rực rỡ.', lat: 15.88, lng: 108.33, category: 'Văn hóa', createdBy: { username: 'Jane Wanderlust', role: 'user' } },
        { _id: '4', title: 'Đỉnh Fansipan', location: 'Lai Châu', description: 'Nóc nhà Đông Dương, cảnh tượng mây mù hùng vĩ.', lat: 22.30, lng: 103.77, category: 'Khám phá', createdBy: { username: 'Mountain_King', role: 'user' } }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchKeyPress = async (e) => {
    if (e.key === 'Enter') {
      const keyword = searchQuery.trim();
      if (!keyword) return;

      try {
        // Sử dụng Nominatim API của OpenStreetMap (Miễn phí)
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(keyword)}`);
        const data = await response.json();

        if (data && data.length > 0) {
          // Lấy tọa độ lat, lon của kết quả đầu tiên trả về
          const { lat, lon } = data[0];
          // Cập nhật state để trigger useEffect trong RealLeafletMap bay tới tọa độ này
          setFlyToLocation([parseFloat(lat), parseFloat(lon)]);
        } else {
          showToast('error', `${t.notFound}: ${keyword}`);
        }
      } catch (error) {
        showToast('error', t.connError);
      }
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden relative">
      
      {/* KHU VỰC THÔNG BÁO (TOAST) */}
      {notification.text && (
        <div className={`fixed bottom-6 right-6 z-[200] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 border-l-4 ${notification.type === 'error' ? 'bg-white border-[#f44336] text-gray-800' : 'bg-white border-green-500 text-gray-800'}`}>
          {notification.type === 'error' ? <ShieldAlert size={24} className="text-[#f44336]" /> : <CheckCircle size={24} className="text-green-500" />}
          <p className="text-[14px] font-bold max-w-[300px] leading-tight">{notification.text}</p>
          <button onClick={() => setNotification({ type: '', text: '' })} className="ml-4 text-gray-400 hover:text-gray-900"><X size={18} /></button>
        </div>
      )}

      {/* HEADER */}
      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10 shadow-sm flex-shrink-0 relative">
        <div className="w-1/4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight hidden sm:block">The Wanderer</Link>
        </div>
        
        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500">
          <Link to="/dashboard" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.home}</Link>
          <Link to="/explore" className="text-[#f44336] border-b-[3px] border-[#f44336] h-[72px] flex items-center">{t.explore}</Link>
          <Link to="/community" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.community}</Link>
        </nav>

        <div className="w-1/4 flex items-center justify-end gap-5">
          <div className="relative w-full max-w-[200px] hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder={t.search} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress} // Bắt sự kiện phím Enter
              className="w-full pl-9 pr-3 py-2 bg-[#f4f4f5] border-transparent rounded-full text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20"
            />
          </div>
          <button className="text-gray-500 hover:text-gray-900" onClick={() => navigate('/dashboard')}>
            <Bell size={22} strokeWidth={2} />
          </button>
          <AccountMenu />
        </div>
      </header>

      {/* BẢN ĐỒ FULL MÀN HÌNH */}
      <div className="flex-1 relative z-0 bg-[#e5e3df]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
            <div className="animate-spin w-10 h-10 border-4 border-[#f44336] border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <RealLeafletMap posts={posts} flyToLocation={flyToLocation} />
        )}
      </div>
    </div>
  );
}

export default function Explore() {
  const hasRouter = typeof useInRouterContext === 'function' ? useInRouterContext() : false;
  if (!hasRouter) {
    return <BrowserRouter><ExploreContent /></BrowserRouter>;
  }
  return <ExploreContent />;
}
