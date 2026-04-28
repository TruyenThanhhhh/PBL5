import React, { useState, useEffect } from 'react';
import { useNavigate, BrowserRouter, useInRouterContext } from 'react-router-dom';
import { 
  User, Shield, Lock, Palette, Bell, LogOut, 
  Camera, CheckCircle, AlertCircle, Loader2, Check
} from 'lucide-react';

// Tạo avatar chữ mặc định nếu database chưa có ảnh
const getAvatarUrl = (url, name) => {
  return url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff&size=200`;
};

function SettingsContent() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Dữ liệu hiển thị
  const [profileData, setProfileData] = useState({ username: '', bio: '', avatar: '', cover: '' });
  
  // Lưu trữ file thật lấy từ máy tính
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  
  // Dữ liệu để Preview ảnh trước khi lưu
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load dữ liệu thật từ Database khi vào trang
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if(!token || !userId) throw new Error("Chưa đăng nhập");

        const res = await fetch(`http://localhost:5000/api/users/${userId}/profile`);
        if (!res.ok) throw new Error('Không tải được profile');
        const data = await res.json();
        
        if(data.user) {
          setProfileData({
            username: data.user.username || '',
            bio: data.user.bio || '',
            avatar: data.user.avatar || '',
            cover: data.user.cover || ''
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Chọn file Avatar từ máy
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file)); // Hiển thị xem trước ngay lập tức
  };

  // Chọn file Ảnh bìa từ máy
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage('');
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token) throw new Error('Vui lòng đăng nhập để cập nhật profile');

      // 1. GÓI DỮ LIỆU ĐỂ LƯU VÀO DATABASE
      const formData = new FormData();
      formData.append('username', profileData.username);
      formData.append('bio', profileData.bio);
      if (avatarFile) formData.append('avatar', avatarFile); // Đính kèm file ảnh đại diện
      if (coverFile) formData.append('cover', coverFile);    // Đính kèm file ảnh bìa

      // Gọi API gửi lên Backend
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData // multipart/form-data
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Lỗi từ Server khi lưu dữ liệu.');
      }
      
      const result = await res.json();
      
      // Cập nhật lại UI sau khi Backend lưu thành công
      setProfileData(prev => ({ ...prev, ...result }));
      if (result.username) localStorage.setItem('username', result.username);
      if (result.avatar) localStorage.setItem('avatar', result.avatar);

      // 2. TỰ ĐỘNG ĐĂNG BÀI LÊN FEED ĐỂ THÔNG BÁO CHO BẠN BÈ
      if (avatarFile || coverFile) {
        const postForm = new FormData();
        
        if (avatarFile && !coverFile) {
          postForm.append('title', 'Cập nhật ảnh đại diện');
          postForm.append('description', `${profileData.username} vừa cập nhật một ảnh đại diện mới rạng rỡ! 🎉`);
          postForm.append('images', avatarFile); 
        } else if (coverFile && !avatarFile) {
          postForm.append('title', 'Cập nhật ảnh bìa');
          postForm.append('description', `${profileData.username} vừa thay đổi ảnh bìa trang cá nhân. Mọi người thấy sao? ✨`);
          postForm.append('images', coverFile);
        } else {
          postForm.append('title', 'Cập nhật trang cá nhân');
          postForm.append('description', `${profileData.username} vừa thay đổi diện mạo mới cho trang cá nhân của mình!`);
          postForm.append('images', avatarFile); // Ưu tiên show avatar lên post
        }
        
        postForm.append('category', 'Update'); 

        // Bắn API tạo bài đăng
        await fetch('http://localhost:5000/api/posts/create-with-media', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: postForm
        });
      }

      setProfileMessage('Cập nhật thành công! Dữ liệu đã lưu vào hệ thống.');
      
      // Clear files sau khi lưu xong
      setAvatarFile(null);
      setCoverFile(null);
      setAvatarPreview('');
      setCoverPreview('');

    } catch (error) {
      setProfileMessage(error.message || 'Lỗi không xác định khi lưu profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Ưu tiên hiển thị Ảnh Preview đang chọn, nếu không thì lấy ảnh từ Database (hoặc mặc định)
  const displayAvatar = avatarPreview || getAvatarUrl(profileData.avatar, profileData.username);
  const displayCover = coverPreview || profileData.cover || 'https://images.unsplash.com/photo-1502602898657-3e90760b628e?auto=format&fit=crop&w=1000&q=80';

  if (isLoading) {
    return <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center"><Loader2 className="animate-spin text-[#f44336]" size={32}/></div>;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 pb-12">
      {/* NAVBAR */}
      <header className="flex items-center justify-between py-3 px-6 bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-8 w-1/4">
          <button onClick={() => navigate('/dashboard')} className="text-[#f44336] font-extrabold text-xl tracking-tight">
            The Wanderer
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-bold text-gray-500">
            <button onClick={() => navigate('/dashboard')} className="hover:text-gray-900 transition-colors py-4">Dashboard</button>
            <button onClick={() => navigate('/explore')} className="hover:text-gray-900 transition-colors py-4">Explore</button>
            <button onClick={() => navigate('/community')} className="hover:text-gray-900 transition-colors py-4">Community</button>
          </nav>
        </div>
        <div className="flex items-center justify-end gap-5 w-1/4">
          <button className="text-gray-500 hover:text-gray-900 relative">
            <Bell size={22} strokeWidth={2} />
          </button>
          <button onClick={() => navigate('/profile')} className="block cursor-pointer">
            <img 
              src={displayAvatar} 
              className="w-8 h-8 rounded-full border border-gray-200 object-cover"
              alt="Profile"
            />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-10 flex gap-8 items-start">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-[240px] flex-shrink-0 sticky top-[88px]">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900">Settings</h1>
            <p className="text-[12px] font-medium text-gray-500">Quản lý tài khoản của bạn</p>
          </div>

          <nav className="space-y-1 text-[13px] font-bold text-gray-600 mb-8">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'profile' ? 'bg-white text-[#f44336] shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}
            >
              <User size={18} strokeWidth={2.5} /> Profile
            </button>
            <button 
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'account' ? 'bg-white text-[#f44336] shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}
            >
              <Shield size={18} strokeWidth={2.5} /> Security
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'privacy' ? 'bg-white text-[#f44336] shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}
            >
              <Lock size={18} strokeWidth={2.5} /> Privacy
            </button>
          </nav>

          <div className="border-t border-gray-200 pt-6">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-[#f44336] hover:bg-red-50 w-full rounded-lg transition-colors">
              <LogOut size={18} strokeWidth={2.5} /> Logout
            </button>
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <section className="flex-1 max-w-[700px]">
          
          {/* TAB PROFILE */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-6">
                <h2 className="text-xl font-black text-gray-900">Profile</h2>
                <p className="text-[13px] text-gray-500 font-medium">Cập nhật thông tin và hình ảnh hiển thị công khai.</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                
                {/* ẢNH BÌA VÀ ẢNH ĐẠI DIỆN */}
                <div className="relative mb-20 rounded-xl">
                  {/* Ảnh Bìa */}
                  <label className="block w-full h-48 bg-gray-200 relative overflow-hidden rounded-2xl group cursor-pointer border border-gray-100">
                    <img
                      src={displayCover}
                      alt="Cover"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                      <Camera className="text-white mb-2" size={32} />
                      <span className="text-white text-[12px] font-bold tracking-wide shadow-sm">TẢI ẢNH TỪ MÁY</span>
                    </div>
                    <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleCoverChange} className="hidden" />
                  </label>

                  {/* Ảnh Đại Diện */}
                  <div className="absolute -bottom-12 left-8 z-10">
                    <label className="block w-[120px] h-[120px] relative rounded-full border-4 border-white bg-white shadow-lg overflow-hidden group cursor-pointer">
                      <img
                        src={displayAvatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white mb-1" size={26} />
                        <span className="text-white text-[10px] font-bold tracking-widest text-center">TẢI ẢNH</span>
                      </div>
                      <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleAvatarChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="grid grid-cols-2 gap-5 mb-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Tên hiển thị</label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-bold text-gray-900 focus:ring-2 focus:ring-[#f44336]/30 focus:border-[#f44336]/50 focus:bg-white outline-none transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Tiểu sử (Bio)</label>
                      <input
                        type="text"
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Viết một vài dòng về bạn..."
                        className="w-full bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-800 focus:ring-2 focus:ring-[#f44336]/30 focus:border-[#f44336]/50 focus:bg-white outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {profileMessage && (
                    <div className={`mb-6 px-4 py-3 rounded-xl flex items-center gap-3 text-[13px] font-bold animate-in fade-in ${profileMessage.includes('thành công') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                      {profileMessage.includes('thành công') ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
                      {profileMessage}
                    </div>
                  )}

                  <div className="flex justify-end pt-5 border-t border-gray-100">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="bg-[#f44336] text-white text-[14px] font-bold px-8 py-3 rounded-full hover:bg-[#e53935] shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 flex items-center gap-2 transform active:scale-95"
                    >
                      {isSavingProfile ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>}
                      {isSavingProfile ? 'Đang lưu vào CSDL...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}

// 🛡️ LỚP BỌC AN TOÀN (SAFE WRAPPER)
export default function Settings() {
  const hasRouter = typeof useInRouterContext === 'function' ? useInRouterContext() : false;
  if (!hasRouter) {
    return (
      <BrowserRouter>
        <SettingsContent />
      </BrowserRouter>
    );
  }
  return <SettingsContent />;
}