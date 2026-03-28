import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, BrowserRouter, useInRouterContext } from 'react-router-dom';
import { 
  Bell, MessageSquare, Compass, Settings, 
  MapPin, Image as ImageIcon, Send, ShieldAlert,
  Heart, Share2, MoreHorizontal, CheckCircle, X, Info
} from 'lucide-react';

// ==========================================
// 1. COMPONENT BẢN ĐỒ THẬT CHỌN TỌA ĐỘ (PICKER)
// ==========================================
function RealMapPicker({ setPickedCoords }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadMap = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        document.head.appendChild(script);
        await new Promise(resolve => { script.onload = resolve; });
      }

      if (isMounted && mapRef.current && window.L && !mapInstance.current) {
        const L = window.L;
        const map = L.map(mapRef.current).setView([16.4637, 107.5905], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        const defaultIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
        });

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          if (markerInstance.current) {
            markerInstance.current.setLatLng([lat, lng]);
          } else {
            markerInstance.current = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
          }
          setPickedCoords({ lat, lng });
        });

        mapInstance.current = map;
      }
    };
    loadMap();
    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [setPickedCoords]);

  return <div ref={mapRef} className="w-full h-full z-0 rounded-lg cursor-crosshair" />;
}

// ==========================================
// 2. COMPONENT BẢN ĐỒ THẬT XEM VỊ TRÍ BÀI ĐĂNG
// ==========================================
function RealMapViewer({ lat, lng, role, location }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadMap = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js'; script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        document.head.appendChild(script);
        await new Promise(resolve => { script.onload = resolve; });
      }

      if (isMounted && mapRef.current && window.L && !mapInstance.current) {
        const L = window.L;
        const map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false }).setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

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

        const icon = role === 'admin' ? adminIcon : defaultIcon;
        const popupText = typeof location === 'string' ? location : 'Vị trí được ghim';
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<b>${popupText}</b>`);

        mapInstance.current = map;
      }
    };
    loadMap();
    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng, role, location]);

  return <div ref={mapRef} className="w-full h-full z-0" />;
}

// ==========================================
// 3. GIAO DIỆN DASHBOARD CHÍNH
// ==========================================
function DashboardContent() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState({ username: 'Khách', role: 'viewer' });
  
  const [newPost, setNewPost] = useState({ title: '', description: '', category: 'General' });
  const [pickedCoords, setPickedCoords] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const [expandedMap, setExpandedMap] = useState({});
  const [notification, setNotification] = useState({ type: '', text: '' });

  useEffect(() => {
    const userRole = localStorage.getItem('role') || 'viewer';
    const username = localStorage.getItem('username');
    if (!username) {
      navigate('/login');
    } else {
      setCurrentUser({ username, role: String(userRole).toLowerCase() });
    }
    fetchPosts();
  }, [navigate]);

  const showToast = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification({ type: '', text: '' }), 5000);
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/posts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPosts(data);
      }
    } catch (error) {
      console.error("Lỗi fetch posts:", error);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        showToast('error', `Tệp "${file.name}" không phải là ảnh hợp lệ!`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) { 
        showToast('error', `Ảnh "${file.name}" vượt quá 5MB! Vui lòng chọn ảnh nhẹ hơn.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length + selectedFiles.length > 5) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return showToast('error', "Chỉ được tải lên tối đa 5 ảnh!");
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMap = (postId) => {
    setExpandedMap(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleQuickPost = async () => {
    // Ràng buộc: Phải có ít nhất 1 thứ (Text, Ảnh, hoặc Tọa độ) mới được đăng
    if (!newPost.description?.trim() && selectedFiles.length === 0 && !pickedCoords) {
      return showToast('error', "Vui lòng nhập nội dung, tải ảnh lên hoặc ghim vị trí trước khi đăng!");
    }
    
    setIsPosting(true);
    try {
      const token = localStorage.getItem('token');
      let uploadedImageUrls = [];

      // 1. UPLOAD ẢNH (NẾU CÓ)
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('images', file));

        const uploadRes = await fetch('http://localhost:5000/api/posts/upload-images', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!uploadRes.ok) {
          const contentType = uploadRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const err = await uploadRes.json();
            throw new Error(err.message || "Lỗi upload ảnh lên hệ thống.");
          } else {
            throw new Error(`Lỗi máy chủ (500). Vui lòng kiểm tra lại cấu hình Cloudinary trong file .env của Backend!`);
          }
        }
        const uploadData = await uploadRes.json();
        uploadedImageUrls = uploadData.urls || []; 
      }

      const finalLocation = pickedCoords 
        ? `[${pickedCoords.lat.toFixed(4)}, ${pickedCoords.lng.toFixed(4)}]` 
        : "Chưa xác định";

      // 🚀 THỦ THUẬT LÁCH LUẬT BACKEND (Tránh lỗi Path `description` is required)
      // Nếu không nhập caption, ta gửi đi 1 ký tự tàng hình (Zero-width space) thay vì chuỗi rỗng
      let finalDescription = newPost.description ? String(newPost.description) : "";
      if (finalDescription.trim() === "") {
        finalDescription = "\u200B"; 
      }

      const payload = {
        title: currentUser.role === 'admin' ? 'THÔNG BÁO TỪ HỆ THỐNG' : (newPost.title || `Trải nghiệm của ${currentUser.username}`),
        description: finalDescription,
        location: finalLocation,
        category: currentUser.role === 'admin' ? 'System' : newPost.category,
        lat: pickedCoords ? pickedCoords.lat : null,
        lng: pickedCoords ? pickedCoords.lng : null,
        images: uploadedImageUrls 
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
        setNewPost({ title: '', description: '', category: 'General' });
        setPickedCoords(null);
        setShowMapPicker(false);
        setSelectedFiles([]);
        setPreviewUrls([]);
        fetchPosts(); 
        showToast('success', 'Đăng bài viết thành công!');
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.message || "Lỗi tạo bài viết.");
        } else {
          throw new Error(`Lỗi server khi đăng bài (Status: ${res.status}).`);
        }
      }
    } catch (error) {
      showToast('error', error.message || "Lỗi mạng!");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans relative">
      
      {/* TOAST THÔNG BÁO */}
      {notification.text && (
        <div className={`fixed bottom-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 border-l-4 ${
          notification.type === 'error' ? 'bg-white border-[#f44336] text-gray-800' : 'bg-white border-green-500 text-gray-800'
        }`}>
          {notification.type === 'error' ? <ShieldAlert size={24} className="text-[#f44336]" /> : <CheckCircle size={24} className="text-green-500" />}
          <p className="text-[14px] font-bold max-w-[300px] leading-tight">{notification.text}</p>
          <button onClick={() => setNotification({ type: '', text: '' })} className="ml-4 text-gray-400 hover:text-gray-900 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* HEADER */}
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
          <button type="button" className="text-gray-500 hover:text-gray-900"><Bell size={22} strokeWidth={2} /></button>
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
                rows="3"
                value={newPost.description}
                onChange={e => setNewPost({...newPost, description: e.target.value})}
              ></textarea>
            </div>

            {previewUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3 pl-12">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-gray-900/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {showMapPicker && (
              <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 animate-in fade-in duration-300 ml-12">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[12px] font-bold text-gray-500">📍 Click vào bản đồ để lấy tọa độ chính xác</p>
                  {pickedCoords && (
                    <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                      [{pickedCoords.lat.toFixed(4)}, {pickedCoords.lng.toFixed(4)}]
                    </span>
                  )}
                </div>
                
                <div className="h-[250px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0 shadow-inner">
                  <RealMapPicker setPickedCoords={setPickedCoords} />
                </div>
                
                <div className="mt-3 flex items-start gap-2 bg-blue-50 text-blue-700 p-2 rounded-lg text-[11px] font-medium">
                  <Info size={16} className="mt-0.5 flex-shrink-0" />
                  <p>Hệ thống sẽ tự động lưu tọa độ và hiển thị trên bản đồ Khám phá.</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-colors select-none ${pickedCoords || showMapPicker ? 'bg-red-50 text-[#f44336]' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <MapPin size={16} strokeWidth={2.5} /> {pickedCoords ? 'Đã ghim vị trí' : 'Ghim vị trí'}
                </button>
                
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors select-none cursor-pointer"
                >
                  <ImageIcon size={16} strokeWidth={2.5} /> Tải ảnh lên
                </button>
              </div>

              <button 
                type="button"
                onClick={handleQuickPost}
                disabled={isPosting}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-bold text-white transition-all shadow-md ${currentUser.role === 'admin' ? 'bg-gray-900 hover:bg-black' : 'bg-[#f44336] shadow-red-500/20 hover:bg-[#e53935]'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isPosting ? <span>Đang tải...</span> : <span className="flex items-center gap-1.5"><Send size={16} /> Đăng Bài</span>}
              </button>
            </div>
          </div>

          {/* DANH SÁCH BÀI VIẾT FEED */}
          <div className="space-y-6 pb-12">
            {posts.map((post) => {
              const isAdmin = post.createdBy?.role === 'admin';
              
              return (
                <div key={post._id || Math.random()} className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${isAdmin ? 'border-red-200' : 'border-gray-100'}`}>
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
                            {post.createdBy?.username || "Ẩn danh"} 
                            {isAdmin && <CheckCircle size={14} className="text-[#f44336]" />}
                          </h3>
                          <p className="text-[11px] font-medium text-gray-400">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                      <button type="button" className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20} /></button>
                    </div>

                    {/* Chỉ hiển thị Caption nếu nó không phải là ký tự tàng hình \u200B */}
                    {post.description && typeof post.description === 'string' && post.description !== '\u200B' && (
                      <p className="text-[14px] text-gray-800 font-medium leading-relaxed mb-4 whitespace-pre-wrap">{post.description}</p>
                    )}

                    {/* BẢN ĐỒ VIEWER */}
                    {post.lat && post.lng && (
                      <div className="mb-4">
                        <button 
                          type="button"
                          onClick={() => toggleMap(post._id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-bold transition-all border ${expandedMap[post._id] ? 'bg-[#f44336] text-white border-[#f44336] shadow-md shadow-red-500/20' : 'bg-red-50 text-[#f44336] border-transparent hover:bg-red-100'}`}
                        >
                          <MapPin size={16} /> 
                          {typeof post.location === 'string' && post.location !== 'Chưa xác định' ? post.location : "Vị trí được ghim"}
                          <span className={`text-[10px] px-2 py-0.5 rounded-md ml-2 transition-colors ${expandedMap[post._id] ? 'bg-black/20 text-white' : 'bg-white text-[#f44336] shadow-sm'}`}>
                            {expandedMap[post._id] ? 'Đóng Bản đồ' : '📍 Xem Map'}
                          </span>
                        </button>

                        {expandedMap[post._id] && (
                          <div className="mt-3 h-[250px] w-full border border-gray-200 rounded-xl overflow-hidden relative z-0 animate-in slide-in-from-top-2 duration-200">
                            <RealMapViewer lat={post.lat} lng={post.lng} role={post.createdBy?.role} location={post.location} />
                          </div>
                        )}
                      </div>
                    )}

                    {Array.isArray(post.images) && post.images.length > 0 && (
                      <div className={`grid gap-2 mb-4 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {post.images.map((imgUrl, idx) => (
                          <img key={idx} src={imgUrl} alt={`media-${idx}`} className={`w-full rounded-xl object-cover border border-gray-100 ${post.images.length === 1 ? 'max-h-[400px]' : 'h-[200px]'}`} />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
                      <button type="button" className="flex items-center gap-1.5 text-gray-500 hover:text-[#f44336] transition-colors text-[13px] font-bold">
                        <Heart size={20} strokeWidth={2.5} /> {Array.isArray(post.likes) ? post.likes.length : 0}
                      </button>
                      <button type="button" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-bold">
                        <MessageSquare size={20} strokeWidth={2.5} /> Bình luận
                      </button>
                      <button type="button" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-bold ml-auto">
                        <Share2 size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="w-[320px] hidden xl:block flex-shrink-0 space-y-6 sticky top-[104px]">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-4">📍 Địa điểm Đang Hot</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-[#f44336] uppercase tracking-wider mb-0.5">Biển</p>
                <p className="text-[13px] font-bold text-gray-900 leading-tight cursor-pointer hover:underline">Bãi Sao, Phú Quốc</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Hơn 200 người đang check-in</p>
              </div>
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}

// Bọc Router để chống lỗi Preview trên Canvas
export default function Dashboard() {
  const hasRouter = typeof useInRouterContext === 'function' ? useInRouterContext() : false;
  if (!hasRouter) {
    return <BrowserRouter><DashboardContent /></BrowserRouter>;
  }
  return <DashboardContent />;
}