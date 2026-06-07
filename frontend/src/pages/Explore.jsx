import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useInRouterContext, useLocation } from 'react-router-dom';
import { Compass, Search, Bell, ArrowLeft, ShieldAlert, CheckCircle, X, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const exploreCopy = {
  vi: {
    home: 'Trang chủ',
    explore: 'Khám phá',
    community: 'Cộng đồng',
    friends: 'Bạn bè',
    searchPlaceholder: 'Nhấn Enter để tìm vị trí...',
    notifications: 'Thông báo',
    title: 'Khám phá địa điểm',
    subtitle: (count) => `Khám phá ${count} địa điểm thú vị từ cộng đồng.`,
    all: 'Tất cả',
    islands: 'Biển đảo',
    mountains: 'Núi rừng',
    city: 'Thành phố',
    culture: 'Văn hóa',
    food: 'Ẩm thực',
    discover: 'Khám phá',
    noPlaces: 'Không tìm thấy địa điểm nào.',
    details: 'Chi tiết',
    unknown: 'Chưa rõ',
    anonymous: 'Ẩn danh',
    place: 'Địa điểm',
    by: 'Bởi',
    postedBy: 'Đăng bởi',
    loginRequired: 'Vui lòng đăng nhập để sử dụng tính năng này',
    backendError: 'Không kết nối được Backend',
    locationNotFound: (keyword) => `Không tìm thấy vị trí: ${keyword}`,
    mapError: 'Lỗi kết nối đến máy chủ bản đồ.',
    viewPost: 'Xem bài viết',
    viewDistance: 'Xem khoảng cách',
  },
  en: {
    home: 'Home',
    explore: 'Explore',
    community: 'Community',
    friends: 'Friends',
    searchPlaceholder: 'Press Enter to search a place...',
    notifications: 'Notifications',
    title: 'Explore Places',
    subtitle: (count) => `Explore ${count} interesting places from the community.`,
    all: 'All',
    islands: 'Islands',
    mountains: 'Mountains',
    city: 'City',
    culture: 'Culture',
    food: 'Food',
    discover: 'Explore',
    noPlaces: 'No places found.',
    details: 'Details',
    unknown: 'Unknown',
    anonymous: 'Anonymous',
    place: 'Place',
    by: 'By',
    postedBy: 'Posted by',
    loginRequired: 'Please log in to use this feature',
    backendError: 'Unable to connect to the backend',
    locationNotFound: (keyword) => `Location not found: ${keyword}`,
    mapError: 'Could not connect to the map server.',
    viewPost: 'View post',
    viewDistance: 'View distance',
  },
};

// Hàm hash để tạo màu ngẫu nhiên dựa trên username
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 75%, 50%)`;
};

function RealLeafletMap({ posts, flyToLocation, itineraryIds, osmItinerary, t }) {
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const startMarkerRef = useRef(null);
  const routePopupRef = useRef(null);

  const drawRoute = async (startLat, startLng, endLat, endLng, endTitle, usingGPS) => {
    if (!mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;

    // 1. Dọn dẹp đường cũ, ghim bắt đầu cũ và popup thông tin đường đi cũ
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (routePopupRef.current) {
      map.closePopup(routePopupRef.current);
      routePopupRef.current = null;
    }

    // 2. Thêm ghim bắt đầu (vị trí người dùng)
    const startIcon = L.divIcon({
      className: 'start-pin',
      html: `<div style="background-color: #10b981; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    startMarkerRef.current = L.marker([startLat, startLng], { icon: startIcon }).addTo(map);
    startMarkerRef.current.bindTooltip(usingGPS ? "Vị trí của bạn" : "Vị trí giả lập (Đà Nẵng)", { permanent: true, direction: 'top', offset: [0, -10] });

    try {
      // 3. Gọi OSRM Routing API để lấy hình học đường đi thực tế
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
      if (!response.ok) throw new Error("Không thể tính toán đường đi");
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);

        // 4. Vẽ đường đi bằng GeoJSON
        const geojsonFeature = {
          type: "Feature",
          properties: {},
          geometry: route.geometry
        };

        routeLayerRef.current = L.geoJSON(geojsonFeature, {
          style: {
            color: "#3b82f6",
            weight: 5,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round"
          }
        }).addTo(map);

        // 5. Căn chỉnh map để hiển thị trọn vẹn lộ trình
        const bounds = L.latLngBounds([
          [startLat, startLng],
          [endLat, endLng]
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });

        // 6. Hiển thị popup thông tin khoảng cách & thời gian ở giữa lộ trình
        const hours = Math.floor(durationMin / 60);
        const mins = durationMin % 60;
        const timeStr = hours > 0 ? `${hours} giờ ${mins} phút` : `${mins} phút`;

        const popupContent = `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 4px; text-align: center;">
            <h5 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #1e3a8a;">Thông tin đường đi</h5>
            <p style="margin: 2px 0; font-size: 12px; font-weight: bold; color: #374151;">Khoảng cách: <span style="color: #ef4444; font-size: 13px;">${distanceKm} km</span></p>
            <p style="margin: 2px 0; font-size: 11px; color: #6b7280;">Thời gian di chuyển: ${timeStr}</p>
          </div>
        `;
        
        routePopupRef.current = L.popup()
          .setLatLng([(startLat + endLat) / 2, (startLng + endLng) / 2])
          .setContent(popupContent)
          .openOn(map);
      }
    } catch (err) {
      console.error("OSRM Route Error:", err);
      // Fallback: Vẽ đường thẳng nét đứt nếu OSRM lỗi
      const latlngs = [
        [startLat, startLng],
        [endLat, endLng]
      ];
      routeLayerRef.current = L.polyline(latlngs, {
        color: '#ef4444',
        weight: 3,
        dashArray: '5, 10',
        opacity: 0.8
      }).addTo(map);
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
    }
  };

  useEffect(() => {
    window.showRouteToPost = async (postId) => {
      const post = posts.find(p => p._id === postId);
      if (!post || !post.lat || !post.lng) return;

      // Mặc định vị trí xuất phát giả lập là Đà Nẵng (nếu trình duyệt không có GPS)
      let userLat = 16.0682;
      let userLng = 108.2147;
      let usingGPS = false;

      if (navigator.geolocation) {
        try {
          const coords = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              (err) => {
                console.warn("🌐 [GPS Debug] Geolocation failed in Explore Map:", {
                  code: err.code,
                  message: err.message,
                  reason: err.code === 1 ? "Permission denied" : err.code === 2 ? "Position unavailable (No GPS hardware/WiFi signals)" : "Timeout"
                });
                reject(err);
              },
              { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
            );
          });
          userLat = coords.lat;
          userLng = coords.lng;
          usingGPS = true;
        } catch (err) {
          console.warn("GPS failed, using default fallback (Da Nang)");
        }
      }

      await drawRoute(userLat, userLng, post.lat, post.lng, post.title, usingGPS);
    };

    return () => {
      delete window.showRouteToPost;
    };
  }, [posts]);

  const drawMultiPointRoute = async (startLat, startLng, routePosts, usingGPS) => {
    if (!mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;

    // 1. Dọn dẹp đường cũ, ghim bắt đầu cũ và popup thông tin đường đi cũ
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (routePopupRef.current) {
      map.closePopup(routePopupRef.current);
      routePopupRef.current = null;
    }

    // 2. Thêm ghim bắt đầu (vị trí người dùng)
    const startIcon = L.divIcon({
      className: 'start-pin',
      html: `<div style="background-color: #10b981; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    startMarkerRef.current = L.marker([startLat, startLng], { icon: startIcon }).addTo(map);
    startMarkerRef.current.bindTooltip(usingGPS ? "Vị trí của bạn" : "Vị trí giả lập (Đà Nẵng)", { permanent: true, direction: 'top', offset: [0, -10] });

    try {
      // 3. Xây dựng chuỗi tọa độ cho OSRM (Lng,Lat)
      const coordinates = [
        [startLng, startLat],
        ...routePosts.map(p => [p.lng, p.lat])
      ];
      const coordString = coordinates.map(c => c.join(',')).join(';');
      
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`);
      if (!response.ok) throw new Error("Không thể tính toán lộ trình");
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);

        // 4. Tạo nhóm FeatureGroup để lưu các lớp của lộ trình
        routeLayerRef.current = L.featureGroup().addTo(map);

        // Vẽ đường đi bằng GeoJSON
        const geojsonFeature = {
          type: "Feature",
          properties: {},
          geometry: route.geometry
        };

        const polylineLayer = L.geoJSON(geojsonFeature, {
          style: {
            color: "#3b82f6",
            weight: 6,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round"
          }
        });
        routeLayerRef.current.addLayer(polylineLayer);

        // 5. Thêm các ghim số thứ tự 1, 2, 3... tại các điểm dừng
        routePosts.forEach((post, idx) => {
          const stopIcon = L.divIcon({
            className: 'stop-pin',
            html: `<div style="background-color: #1e3a8a; color: #fff; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 950; font-family: system-ui, sans-serif;">${idx + 1}</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          const marker = L.marker([post.lat, post.lng], { icon: stopIcon });
          marker.bindTooltip(`Chặng ${idx + 1}: ${post.title || post.name}`, { permanent: true, direction: 'top', offset: [0, -12] });
          routeLayerRef.current.addLayer(marker);
        });

        // 6. Căn chỉnh map để hiển thị trọn vẹn lộ trình
        const bounds = L.latLngBounds([
          [startLat, startLng],
          ...routePosts.map(p => [p.lat, p.lng])
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });

        // 7. Hiển thị popup thông tin ở điểm dừng đầu tiên
        const hours = Math.floor(durationMin / 60);
        const mins = durationMin % 60;
        const timeStr = hours > 0 ? `${hours} giờ ${mins} phút` : `${mins} phút`;

        const popupContent = `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 4px; text-align: center; min-width: 165px;">
            <h5 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #1e3a8a;">Lịch trình gợi ý</h5>
            <p style="margin: 2px 0; font-size: 12px; font-weight: bold; color: #374151;">Số điểm dừng: <span style="color: #3b82f6;">${routePosts.length}</span></p>
            <p style="margin: 2px 0; font-size: 12px; font-weight: bold; color: #374151;">Tổng quãng đường: <span style="color: #ef4444; font-size: 13px;">${distanceKm} km</span></p>
            <p style="margin: 2px 0; font-size: 11px; color: #6b7280;">Thời gian lái xe: ~${timeStr}</p>
          </div>
        `;
        
        routePopupRef.current = L.popup()
          .setLatLng([routePosts[0].lat, routePosts[0].lng])
          .setContent(popupContent)
          .openOn(map);
      }
    } catch (err) {
      console.error("OSRM Multi Route Error:", err);
      // Fallback: Vẽ đường thẳng nét đứt nối các điểm
      const latlngs = [
        [startLat, startLng],
        ...routePosts.map(p => [p.lat, p.lng])
      ];
      routeLayerRef.current = L.polyline(latlngs, {
        color: '#ef4444',
        weight: 3,
        dashArray: '5, 10',
        opacity: 0.8
      }).addTo(map);
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
    }
  };

  useEffect(() => {
    if (!mapInstance.current || !window.L || !posts.length || !itineraryIds || !itineraryIds.length) return;
    
    const triggerItineraryRoute = async () => {
      const routePosts = itineraryIds
        .map(id => posts.find(p => String(p._id) === String(id)))
        .filter(p => p && p.lat && p.lng);

      if (routePosts.length === 0) return;

      let userLat = 16.0682;
      let userLng = 108.2147;
      let usingGPS = false;

      if (navigator.geolocation) {
        try {
          const coords = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              (err) => reject(err),
              { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
            );
          });
          userLat = coords.lat;
          userLng = coords.lng;
          usingGPS = true;
        } catch (err) {
          console.warn("Itinerary GPS failed, using default Da Nang");
        }
      }

      await drawMultiPointRoute(userLat, userLng, routePosts, usingGPS);
    };

    triggerItineraryRoute();
  }, [posts, itineraryIds, isMapReady]);

  useEffect(() => {
    if (!mapInstance.current || !window.L || !osmItinerary || !osmItinerary.length) return;
    
    const triggerOsmItineraryRoute = async () => {
      let userLat = 16.0682;
      let userLng = 108.2147;
      let usingGPS = false;

      if (navigator.geolocation) {
        try {
          const coords = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              (err) => reject(err),
              { timeout: 30000, enableHighAccuracy: true, maximumAge: 0 }
            );
          });
          userLat = coords.lat;
          userLng = coords.lng;
          usingGPS = true;
        } catch (err) {
          console.warn("OSM Itinerary GPS failed, using default Da Nang");
        }
      }

      await drawMultiPointRoute(userLat, userLng, osmItinerary, usingGPS);
    };

    triggerOsmItineraryRoute();
  }, [osmItinerary, isMapReady]);

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
        await new Promise(resolve => { link.onload = resolve; });
      }

      // 2. Nhúng JS của Leaflet trực tiếp
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        document.head.appendChild(script);
        await new Promise(resolve => { script.onload = resolve; });
      }

      // Đợi cho window.L thực sự tồn tại (đề phòng race condition)
      let attempts = 0;
      while (!window.L && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
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
        setIsMapReady(true);

        // Ép Leaflet tính toán lại kích cỡ khung chứa để tránh ô màu xám (invalidateSize)
        setTimeout(() => {
          if (isMounted && map) {
            map.invalidateSize();
          }
        }, 300);
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
        const username = post.createdBy?.username || t.anonymous;
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
          `<div style="text-align:center;"><b>${post.location || post.title}</b><br/><span style="font-size:10px; color:#666;">${t.postedBy}: ${username}</span></div>`,
          { direction: 'top', offset: [0, -26], opacity: 0.9 }
        );
        
        // Popup HTML khi click vào ghim
        marker.bindPopup(`
          <div style="min-width: 200px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 2px;">
            <span style="font-size: 10px; font-weight: bold; background: ${isAdmin ? '#fee2e2' : '#e0f2fe'}; color: ${isAdmin ? '#ef4444' : '#0ea5e9'}; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${post.category || t.place}
            </span>
            <h4 style="margin: 8px 0 4px 0; font-size: 14px; font-weight: 900; color: #111827; line-height: 1.3;">${post.title || post.location}</h4>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #4b5563; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${post.description}</p>
            <div style="font-size: 11px; font-weight: bold; color: ${userColor}; border-top: 1px solid #f3f4f6; padding: 6px 0 8px 0;">
              ${t.by}: ${username}
            </div>
            <a href="/post-detail?postId=${post._id}" style="display: block; text-align: center; background: #f44336; color: #fff; padding: 7px 12px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: bold; transition: background 0.2s;" onmouseover="this.style.background='#e53935'" onmouseout="this.style.background='#f44336'">
              ${t.viewPost}
            </a>
            <button onclick="if(window.showRouteToPost) window.showRouteToPost('${post._id}')" style="display: block; width: 100%; text-align: center; background: #1e3a8a; color: #fff; padding: 7px 12px; border-radius: 8px; border: none; font-size: 11px; font-weight: bold; margin-top: 6px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#172554'" onmouseout="this.style.background='#1e3a8a'">
              ${t.viewDistance || 'Xem khoảng cách'}
            </button>
          </div>
        `);

        // Gắn postId vào marker để mở popup tương ứng khi chọn từ danh sách bên trái
        marker.postId = post._id;

        markersRef.current.push(marker);
      }
    });
  }, [posts, t]);

  useEffect(() => {
    if (mapInstance.current && flyToLocation) {
      let lat, lng, postId;
      if (Array.isArray(flyToLocation)) {
        lat = flyToLocation[0];
        lng = flyToLocation[1];
      } else {
        lat = flyToLocation.lat;
        lng = flyToLocation.lng;
        postId = flyToLocation.postId;
      }

      mapInstance.current.flyTo([lat, lng], 13, {
        animate: true,
        duration: 1.5 // Thời gian bay (giây)
      });

      // Tìm và mở popup của marker tương ứng sau khi bay xong
      if (postId) {
        const marker = markersRef.current.find(m => m.postId === postId);
        if (marker) {
          setTimeout(() => {
            marker.openPopup();
          }, 500);
        }
      }
    }
  }, [flyToLocation]);

  return <div ref={mapRef} className="w-full h-full z-0" />;
}

function ExploreContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = exploreCopy[language] || exploreCopy.vi;
  const [posts, setPosts] = useState([]);
  const [itineraryIds, setItineraryIds] = useState(() => {
    const stateIds = location.state?.itineraryIds;
    if (stateIds && Array.isArray(stateIds)) return stateIds;
    const localIdsStr = localStorage.getItem('itinerary_ids');
    if (localIdsStr) {
      try {
        return JSON.parse(localIdsStr);
      } catch (_) {}
    }
    return null;
  });

  const [osmItinerary, setOsmItinerary] = useState(() => {
    const stateOsm = location.state?.osmItinerary;
    if (stateOsm && Array.isArray(stateOsm)) return stateOsm;
    const localOsmStr = localStorage.getItem('osm_itinerary');
    if (localOsmStr) {
      try {
        return JSON.parse(localOsmStr);
      } catch (_) {}
    }
    return null;
  });

  useEffect(() => {
    // Xóa bộ nhớ tạm để tránh tự động vẽ lại khi F5 trang Explore lần sau
    localStorage.removeItem('itinerary_ids');
    localStorage.removeItem('osm_itinerary');
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [isLoading, setIsLoading] = useState(true);
  const [flyToLocation, setFlyToLocation] = useState(null); // Lưu tọa độ để map bay tới
  const [notification, setNotification] = useState({ type: '', text: '' }); // Quản lý Toast thông báo

  const categories = [
    { value: 'Tất cả', label: t.all },
    { value: 'Biển đảo', label: t.islands },
    { value: 'Núi rừng', label: t.mountains },
    { value: 'Thành phố', label: t.city },
    { value: 'Văn hóa', label: t.culture },
    { value: 'Ẩm thực', label: t.food },
    { value: 'Khám phá', label: t.discover },
  ];

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const showToast = (type, text) => {
    setNotification({ type, text: String(text) });
    setTimeout(() => setNotification({ type: '', text: '' }), 5000);
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error(t.loginRequired);

      let url = 'http://localhost:5000/api/posts/explore?hasLocation=true';
      if (selectedCategory !== 'Tất cả') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        throw new Error(t.backendError);
      }
    } catch (error) {
      console.log(error.message);
      // Dữ liệu mô phỏng trong quá trình dev nếu không kết nối được backend
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
          showToast('error', t.locationNotFound(keyword));
        }
      } catch (error) {
        showToast('error', t.mapError);
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
          <Link to="/friends" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.friends}</Link>
        </nav>

        <div className="w-1/4 flex items-center justify-end gap-3 shrink-0 min-w-0">
          <div className="relative w-full max-w-[200px] hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress} // Bắt sự kiện phím Enter
              className="w-full pl-9 pr-3 py-2 bg-[#f4f4f5] border-transparent rounded-full text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20"
            />
          </div>
          <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900" onClick={() => window.dispatchEvent(new CustomEvent('openNotifications'))} title={t.notifications}>
            <Bell size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* KHU VỰC CHIA ĐÔI MÀN HÌNH (SPLIT-SCREEN) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PANEL BÊN TRÁI - DANH SÁCH BÀI VIẾT */}
        <aside className="w-[420px] bg-[#f8f9fa] border-r border-gray-200 flex flex-col z-10 shadow-lg relative h-full">
          <div className="p-5 border-b border-gray-200 bg-white">
            <h2 className="text-[18px] font-black text-gray-900 flex items-center gap-2 mb-1">
              <Compass size={22} className="text-[#f44336]" /> {t.title}
            </h2>
            <p className="text-[13px] font-medium text-gray-500">{t.subtitle(posts.length)}</p>
          </div>

          <div className="px-5 py-3 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                  ? 'bg-[#f44336] text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
            {isLoading ? (
              <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-[#f44336] border-t-transparent rounded-full"></div></div>
            ) : posts.length === 0 ? (
              <div className="text-center text-gray-500 text-[13px] py-10 font-medium">{t.noPlaces}</div>
            ) : (
              posts.map((post) => (
                <div 
                  key={post._id}
                  onClick={() => post.lat && post.lng && setFlyToLocation({ lat: post.lat, lng: post.lng, postId: post._id })}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#f44336]/30 transition-all cursor-pointer group flex flex-col gap-3 animate-in fade-in"
                >
                  {post.images && post.images.length > 0 && (
                    <div className="w-full h-[160px] rounded-xl overflow-hidden relative">
                      <img src={post.images[0]} alt={t.place} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                        {post.category || t.discover}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-[15px] font-black text-gray-900 group-hover:text-[#f44336] transition-colors line-clamp-1 mb-1">
                      {post.title || post.location || t.unknown}
                    </h3>
                    <p className="text-[12px] font-medium text-gray-500 line-clamp-2 leading-relaxed mb-3">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto border-t border-gray-50 pt-3">
                      <div className="flex items-center gap-2">
                        <img src={post.createdBy?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.createdBy?.username || 'U')}&background=f44336&color=fff`} className="w-5 h-5 rounded-full object-cover" alt="User" />
                        <span className="text-[11px] font-bold text-gray-700">{post.createdBy?.username || t.anonymous}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/post-detail?postId=${post._id}`); }} className="text-[11px] font-bold text-[#f44336] bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                        {t.details}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* BẢN ĐỒ BÊN PHẢI */}
        <div className="flex-1 relative z-0 bg-[#e5e3df]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
              <div className="animate-spin w-10 h-10 border-4 border-[#f44336] border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <RealLeafletMap posts={posts} flyToLocation={flyToLocation} itineraryIds={itineraryIds} osmItinerary={osmItinerary} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ExploreContent;
