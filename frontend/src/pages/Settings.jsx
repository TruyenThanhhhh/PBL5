import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, BrowserRouter, useInRouterContext } from 'react-router-dom';
import { 
  User, Shield, Lock, Palette, LogOut, Languages,
  Camera, CheckCircle, AlertCircle, Loader2, Check,
  Eye, EyeOff, Monitor, Moon, Sun, MessageSquare
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AccountMenu from '../components/AccountMenu';
import NotificationBell from '../components/NotificationBell';

const copy = {
  vi: {
    navDashboard: 'Bảng tin',
    navExplore: 'Khám phá',
    navCommunity: 'Cộng đồng',
    title: 'Cài đặt',
    subtitle: 'Quản lý tài khoản và trải nghiệm của bạn',
    profile: 'Hồ sơ',
    account: 'Bảo mật',
    privacy: 'Quyền riêng tư',
    appearance: 'Giao diện',
    language: 'Ngôn ngữ',
    profileTitle: 'Hồ sơ cá nhân',
    profileSubtitle: 'Cập nhật thông tin hiển thị công khai của bạn.',
    coverAlt: 'Ảnh bìa',
    avatarAlt: 'Ảnh đại diện',
    changeCover: 'Thay ảnh bìa',
    displayName: 'Tên hiển thị',
    bio: 'Tiểu sử',
    bioPlaceholder: 'Viết vài dòng giới thiệu về bạn',
    save: 'Lưu thay đổi',
    saving: 'Đang lưu...',
    loginRequired: 'Vui lòng đăng nhập để cập nhật hồ sơ.',
    loadError: 'Không thể tải thông tin.',
    saveError: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
    saveSuccess: 'Cập nhật thành công.',
    languageTitle: 'Ngôn ngữ hiển thị',
    languageSubtitle: 'Chọn ngôn ngữ mặc định cho toàn bộ giao diện.',
    vietnamese: 'Tiếng Việt',
    english: 'Tiếng Anh',
    languageSaved: 'Đã cập nhật ngôn ngữ hiển thị.',
    
    // Account Security
    accTitle: 'Bảo mật tài khoản',
    accSubtitle: 'Cập nhật mật khẩu để bảo vệ tài khoản của bạn.',
    currPass: 'Mật khẩu hiện tại',
    newPass: 'Mật khẩu mới',
    confirmPass: 'Xác nhận mật khẩu mới',
    updatePass: 'Cập nhật mật khẩu',
    passMismatch: 'Mật khẩu xác nhận không khớp.',
    passEmpty: 'Vui lòng nhập đủ các trường mật khẩu.',
    passSuccess: 'Đổi mật khẩu thành công!',
    
    // Privacy
    privTitle: 'Quyền riêng tư',
    privSubtitle: 'Quản lý ai có thể xem nội dung và tương tác với bạn.',
    privateAcc: 'Tài khoản riêng tư',
    privateDesc: 'Chỉ những người theo dõi được phê duyệt mới xem được bài viết của bạn.',
    whoMessage: 'Ai có thể nhắn tin cho bạn?',
    everyone: 'Mọi người',
    followers: 'Người theo dõi',
    noOne: 'Không ai cả',
    showActivity: 'Hiển thị trạng thái hoạt động',
    showActivityDesc: 'Người khác sẽ thấy khi bạn đang online.',
    
    // Appearance
    appTitle: 'Giao diện',
    appSubtitle: 'Tùy chỉnh màu sắc hiển thị của ứng dụng.',
    themeLight: 'Chế độ Sáng',
    themeDark: 'Chế độ Tối',
    themeSystem: 'Hệ thống'
  },
  en: {
    navDashboard: 'Home',
    navExplore: 'Explore',
    navCommunity: 'Community',
    title: 'Settings',
    subtitle: 'Manage your account and experience',
    profile: 'Profile',
    account: 'Security',
    privacy: 'Privacy',
    appearance: 'Appearance',
    language: 'Language',
    profileTitle: 'Profile',
    profileSubtitle: 'Update your public identity and profile details.',
    coverAlt: 'Cover image',
    avatarAlt: 'Avatar',
    changeCover: 'Change cover',
    displayName: 'Display name',
    bio: 'Bio',
    bioPlaceholder: 'Write a few lines about yourself',
    save: 'Save changes',
    saving: 'Saving...',
    loginRequired: 'Please sign in to update your profile.',
    loadError: 'Unable to load profile.',
    saveError: 'An error occurred. Please try again.',
    saveSuccess: 'Updated successfully.',
    languageTitle: 'Display language',
    languageSubtitle: 'Choose the default language for the interface.',
    vietnamese: 'Vietnamese',
    english: 'English',
    languageSaved: 'Display language updated.',

    // Account Security
    accTitle: 'Account Security',
    accSubtitle: 'Update your password to keep your account secure.',
    currPass: 'Current password',
    newPass: 'New password',
    confirmPass: 'Confirm new password',
    updatePass: 'Update password',
    passMismatch: 'Passwords do not match.',
    passEmpty: 'Please fill in all password fields.',
    passSuccess: 'Password changed successfully!',

    // Privacy
    privTitle: 'Privacy Settings',
    privSubtitle: 'Manage who can see your content and interact with you.',
    privateAcc: 'Private account',
    privateDesc: 'Only approved followers can see your posts.',
    whoMessage: 'Who can message you?',
    everyone: 'Everyone',
    followers: 'Followers only',
    noOne: 'No one',
    showActivity: 'Show activity status',
    showActivityDesc: 'Others will see when you are online.',

    // Appearance
    appTitle: 'Appearance',
    appSubtitle: 'Customize the app color theme.',
    themeLight: 'Light Theme',
    themeDark: 'Dark Theme',
    themeSystem: 'System'
  },
};

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
};

function SettingsContent() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = copy[language] || copy.vi;
  const [activeTab, setActiveTab] = useState('profile');

  // --- STATE: PROFILE ---
  const [profileData, setProfileData] = useState({ displayName: '', bio: '', avatar: '', cover: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // --- STATE: ACCOUNT (PASSWORD) ---
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [accountMessage, setAccountMessage] = useState({ type: '', text: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // --- STATE: PRIVACY ---
  const [privacySettings, setPrivacySettings] = useState({
    isPrivate: false,
    messagePermission: 'everyone',
    showActivity: true
  });
  const [privacyMessage, setPrivacyMessage] = useState({ type: '', text: '' });
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  // --- STATE: APPEARANCE ---
  const [theme, setTheme] = useState('light');

  // --- GLOBAL STATE ---
  const [languageMessage, setLanguageMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const menuItems = useMemo(
    () => [
      { id: 'profile', label: t.profile, icon: User },
      { id: 'account', label: t.account, icon: Shield },
      { id: 'privacy', label: t.privacy, icon: Lock },
      { id: 'appearance', label: t.appearance, icon: Palette },
      { id: 'language', label: t.language, icon: Languages },
    ],
    [t]
  );

  // --- TẢI DỮ LIỆU BAN ĐẦU ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if(!token || !userId) {
          setAuthError(t.loginRequired);
          setIsLoading(false);
          return;
        }

        // 1. Tải Profile và Cấu hình Privacy từ Database
        const res = await fetch(`http://localhost:5000/api/users/${userId}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          setAuthError(t.loadError);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        
        if(data.user) {
          const user = data.user;
          setProfileData({
            displayName: user.displayName || user.username || '',
            bio: user.bio || '',
            avatar: user.avatar || '',
            cover: user.cover || ''
          });
          setAvatarPreview(getImageUrl(user.avatar) || '');
          setCoverPreview(getImageUrl(user.cover) || '');

          // Đồng bộ hóa trạng thái Privacy thật từ Database
          setPrivacySettings({
            isPrivate: user.isPrivate || false,
            messagePermission: user.messagePermission || 'everyone',
            showActivity: user.showActivity !== false 
          });
        }

        // 2. Tải Appearance từ LocalStorage
        const savedTheme = localStorage.getItem('app-theme') || 'light';
        setTheme(savedTheme);
        applyThemeClass(savedTheme);

      } catch (error) {
        setAuthError(t.loadError);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [t]);

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new CustomEvent('authChange'));
    navigate('/login');
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file)); 
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file)); 
  };

  // --- SUBMIT: PROFILE ---
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setProfileMessage({ type: 'error', text: t.loginRequired });
        return;
      }

      const formData = new FormData();
      formData.append('username', profileData.displayName); 
      formData.append('displayName', profileData.displayName);
      formData.append('bio', profileData.bio);
      
      if (avatarFile) formData.append('avatar', avatarFile, avatarFile.name); 
      if (coverFile) formData.append('cover', coverFile, coverFile.name);    

      const res = await fetch(`http://localhost:5000/api/users/update-profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const result = await res.json().catch(() => ({}));
      
      if (res.ok) {
        const user = result.user || {};
        setProfileData(prev => ({
          ...prev,
          displayName: user.displayName || user.username || prev.displayName,
          bio: user.bio || prev.bio,
          avatar: user.avatar || prev.avatar,
          cover: user.cover || prev.cover
        }));
        
        setAvatarPreview(getImageUrl(user.avatar) || avatarPreview);
        setCoverPreview(getImageUrl(user.cover) || coverPreview);

        if (user.username) localStorage.setItem('username', user.username);
        if (user.displayName) localStorage.setItem('displayName', user.displayName);
        if (user.avatar) localStorage.setItem('avatar', user.avatar);
        
        setProfileMessage({ type: 'success', text: t.saveSuccess });
        setAvatarFile(null);
        setCoverFile(null);

        window.dispatchEvent(new Event('closeAllMenus')); 
      } else {
        setProfileMessage({ type: 'error', text: result.message || t.saveError });
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: t.saveError });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- SUBMIT: PASSWORD (ĐỔI MẬT KHẨU THẬT & UPDATE DATABASE) ---
  const handleSavePassword = async () => {
    setAccountMessage({ type: '', text: '' });
    
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setAccountMessage({ type: 'error', text: t.passEmpty });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setAccountMessage({ type: 'error', text: t.passMismatch });
      return;
    }

    setIsSavingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/users/change-password`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: passwords.current, // Key khớp chuẩn xác 100% với xử lý Backend của bạn
          newPassword: passwords.new
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setAccountMessage({ type: 'success', text: t.passSuccess });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        setAccountMessage({ type: 'error', text: data.message || t.saveError });
      }
    } catch (error) {
      setAccountMessage({ type: 'error', text: t.saveError });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // --- SUBMIT: PRIVACY (CẬP NHẬT QUYỀN RIÊNG TƯ VÀO DATABASE) ---
  const handleSavePrivacy = async () => {
    setIsSavingPrivacy(true);
    setPrivacyMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/users/update-privacy`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(privacySettings) // Lưu trực tiếp cấu hình thật vào DB
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setPrivacyMessage({ type: 'success', text: t.saveSuccess });
      } else {
        setPrivacyMessage({ type: 'error', text: data.message || t.saveError });
      }
    } catch (error) {
      setPrivacyMessage({ type: 'error', text: t.saveError });
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  // --- RENDER & THIẾT LẬP THEME GIAO DIỆN ---
  const applyThemeClass = (selectedTheme) => {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (selectedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Hệ thống
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    applyThemeClass(newTheme);
  };

  // --- RENDER HELPERS ---
  const renderMessage = (msgObj) => {
    if (!msgObj.text) return null;
    return (
      <div className={`mb-6 px-4 py-3 rounded-xl flex items-center gap-3 text-[13px] font-bold animate-in fade-in ${msgObj.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-100'}`}>
        {msgObj.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
        {msgObj.text}
      </div>
    );
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center"><Loader2 className="animate-spin text-[#f44336]" size={32}/></div>;
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-gray-800 font-bold text-lg mb-6">{authError}</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-[#f44336] text-white font-bold rounded-full hover:bg-red-600 shadow-md transition-colors">
          {t.navDashboard}
        </button>
      </div>
    );
  }

  const userAvatar = avatarPreview || profileData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-900 font-sans text-gray-900 dark:text-white pb-12 transition-colors duration-200">
      
      {/* HEADER ĐỒNG BỘ VỚI PROFILE VÀ DASHBOARD */}
      <header className="flex items-center justify-between py-3 px-6 bg-white dark:bg-[#131B2E] sticky top-0 z-50 border-b border-gray-100 dark:border-slate-800 h-[72px] shadow-sm">
        <div className="w-1/4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-[#f44336] font-extrabold text-xl tracking-tight hidden sm:block">The Wanderer</button>
        </div>

        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500 dark:text-slate-400">
          <button onClick={() => navigate('/dashboard')} className="hover:text-gray-900 dark:hover:text-white transition-colors h-[72px] flex items-center">{t.navDashboard}</button>
          <button onClick={() => navigate('/explore')} className="hover:text-gray-900 dark:hover:text-white transition-colors h-[72px] flex items-center">{t.navExplore}</button>
          <button onClick={() => navigate('/community')} className="hover:text-gray-900 dark:hover:text-white transition-colors h-[72px] flex items-center">{t.navCommunity}</button>
        </nav>

        <div className="w-1/4 flex items-center justify-end gap-5">
          <NotificationBell />
          <button onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <MessageSquare size={22} strokeWidth={2} />
          </button>
          <AccountMenu avatar={userAvatar} username={profileData.displayName} />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[1360px] mx-auto px-6 2xl:px-8 pt-6 flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-full md:w-[220px] flex-shrink-0 md:sticky md:top-[96px]">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t.title}</h1>
            <p className="text-[12px] font-medium text-gray-500 dark:text-slate-400">{t.subtitle}</p>
          </div>

          <nav className="space-y-1 text-[13px] font-bold text-gray-600 dark:text-slate-300 mb-8">
            {menuItems.map(({ id, label, icon: Icon }) => (
              <button 
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setProfileMessage({ type: '', text: '' });
                  setAccountMessage({ type: '', text: '' });
                  setPrivacyMessage({ type: '', text: '' });
                  setLanguageMessage('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === id ? 'bg-white dark:bg-[#1A2338] text-[#f44336] shadow-sm border border-gray-100 dark:border-slate-800' : 'hover:bg-white dark:hover:bg-[#1A2338] border border-transparent hover:shadow-sm'}`}
              >
                <Icon size={18} strokeWidth={2.5} /> {label}
              </button>
            ))}
          </nav>

          <div className="border-t border-gray-200 dark:border-slate-800 pt-6">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-[#f44336] hover:bg-red-50 dark:hover:bg-red-950/20 w-full rounded-lg transition-colors">
              <LogOut size={18} strokeWidth={2.5} /> {t.logout}
            </button>
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <section className="flex-1 min-w-0 w-full">
          
          {/* 1. TAB PROFILE */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-300">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{t.profileTitle}</h2>
                  <p className="text-[13px] text-gray-500 dark:text-slate-400 font-medium">{t.profileSubtitle}</p>
                </div>

                <div className="bg-white dark:bg-[#1A2338] rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                  <div className="relative mb-16 rounded-xl">
                    <label className="block w-full h-40 bg-gray-200 dark:bg-slate-700 relative overflow-hidden rounded-2xl group cursor-pointer border border-gray-100 dark:border-slate-800">
                      <img
                        src={coverPreview || 'https://images.unsplash.com/photo-1502602898657-3e90760b628e?auto=format&fit=crop&w=1000&q=80'}
                        alt={t.coverAlt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                        <Camera className="text-white mb-2" size={32} />
                        <span className="text-white text-[12px] font-bold tracking-wide shadow-sm">{t.changeCover}</span>
                      </div>
                      <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleCoverChange} className="hidden" />
                    </label>

                    <div className="absolute -bottom-12 left-8 z-10">
                      <label className="block w-[120px] h-[120px] relative rounded-full border-4 border-white dark:border-[#1A2338] bg-white dark:bg-[#1a2338] shadow-lg overflow-hidden group cursor-pointer">
                        <img
                          src={userAvatar}
                          alt={t.avatarAlt}
                          onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=User&background=f44336&color=fff'; }}
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

                  <div className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">{t.displayName}</label>
                        <input
                          type="text"
                          value={profileData.displayName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="w-full bg-[#f4f4f5] dark:bg-slate-800 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f44336]/30 focus:border-[#f44336]/50 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">{t.bio}</label>
                        <input
                          type="text"
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder={t.bioPlaceholder}
                          className="w-full bg-[#f4f4f5] dark:bg-slate-800 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-[#f44336]/30 focus:border-[#f44336]/50 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {renderMessage(profileMessage)}

                    <div className="flex justify-end pt-5 border-t border-gray-100 dark:border-slate-800 mt-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="bg-[#f44336] text-white text-[14px] font-bold px-8 py-3 rounded-full hover:bg-[#e53935] shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 flex items-center gap-2 transform active:scale-95"
                      >
                        {isSavingProfile ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>}
                        {isSavingProfile ? t.saving : t.save}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. TAB ACCOUNT SECURITY */}
          {activeTab === 'account' && (
            <div className="animate-in fade-in duration-300">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{t.accTitle}</h2>
                  <p className="text-[13px] text-gray-500 dark:text-slate-400 font-medium">{t.accSubtitle}</p>
                </div>

                <div className="bg-white dark:bg-[#1A2338] rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 md:w-3/4">
                  <div className="space-y-5 mb-6">
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">{t.currPass}</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={passwords.current}
                          onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                          className="w-full bg-[#f4f4f5] dark:bg-slate-800 border border-transparent rounded-xl pl-4 pr-12 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f44336]/30 focus:border-[#f44336]/50 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white">
                          {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">{t.newPass}</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        className="w-full bg-[#f4f4f5] dark:bg-slate-800 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f44336]/30 focus:border-[#f44336]/50 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">{t.confirmPass}</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        className="w-full bg-[#f4f4f5] dark:bg-slate-800 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f44336]/30 focus:border-[#f44336]/50 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {renderMessage(accountMessage)}

                  <div className="flex justify-end pt-5 border-t border-gray-100 dark:border-slate-800">
                    <button
                      onClick={handleSavePassword}
                      disabled={isSavingPassword}
                      className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[14px] font-bold px-8 py-3 rounded-full hover:bg-black dark:hover:bg-slate-100 shadow-lg shadow-gray-500/30 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2 transform active:scale-95"
                    >
                      {isSavingPassword ? <Loader2 size={18} className="animate-spin"/> : <Shield size={18}/>}
                      {t.updatePass}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. TAB PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="animate-in fade-in duration-300">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{t.privTitle}</h2>
                  <p className="text-[13px] text-gray-500 dark:text-slate-400 font-medium">{t.privSubtitle}</p>
                </div>

                <div className="bg-white dark:bg-[#1A2338] rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 md:w-3/4 space-y-8">
                  {/* Private Account Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">{t.privateAcc}</h3>
                      <p className="text-[12px] font-medium text-gray-500 dark:text-slate-400 mt-0.5">{t.privateDesc}</p>
                    </div>
                    <button 
                      onClick={() => setPrivacySettings({...privacySettings, isPrivate: !privacySettings.isPrivate})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${privacySettings.isPrivate ? 'bg-[#f44336]' : 'bg-gray-200 dark:bg-slate-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings.isPrivate ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Show Activity Status Toggle */}
                  <div className="flex items-center justify-between border-t border-gray-50 dark:border-slate-800 pt-6">
                    <div>
                      <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">{t.showActivity}</h3>
                      <p className="text-[12px] font-medium text-gray-500 dark:text-slate-400 mt-0.5">{t.showActivityDesc}</p>
                    </div>
                    <button 
                      onClick={() => setPrivacySettings({...privacySettings, showActivity: !privacySettings.showActivity})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${privacySettings.showActivity ? 'bg-[#00897b]' : 'bg-gray-200 dark:bg-slate-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings.showActivity ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Message Permissions */}
                  <div className="border-t border-gray-50 dark:border-slate-800 pt-6">
                    <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">{t.whoMessage}</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'everyone', label: t.everyone },
                        { value: 'followers', label: t.followers },
                        { value: 'none', label: t.noOne },
                      ].map((opt) => (
                        <label key={opt.value} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
                          <input 
                            type="radio" 
                            name="messagePerm" 
                            value={opt.value} 
                            checked={privacySettings.messagePermission === opt.value}
                            onChange={(e) => setPrivacySettings({...privacySettings, messagePermission: e.target.value})}
                            className="w-4 h-4 accent-[#f44336]"
                          />
                          <span className="text-[14px] font-medium text-gray-800 dark:text-slate-200">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {renderMessage(privacyMessage)}

                  <div className="flex justify-end pt-5 border-t border-gray-100 dark:border-slate-800">
                    <button
                      onClick={handleSavePrivacy}
                      disabled={isSavingPrivacy}
                      className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[14px] font-bold px-8 py-3 rounded-full hover:bg-black dark:hover:bg-slate-100 shadow-lg shadow-gray-500/30 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2 transform active:scale-95"
                    >
                      {isSavingPrivacy ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>}
                      {t.save}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. TAB APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="animate-in fade-in duration-300">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{t.appTitle}</h2>
                  <p className="text-[13px] text-gray-500 dark:text-slate-400 font-medium">{t.appSubtitle}</p>
                </div>

                <div className="bg-white dark:bg-[#1A2338] rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 md:w-3/4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <button 
                      onClick={() => handleThemeChange('light')}
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-[#f44336] bg-red-50/50 dark:bg-red-900/20' : 'border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600'}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
                        <Sun size={24} strokeWidth={2.5}/>
                      </div>
                      <span className={`text-[13px] font-bold ${theme === 'light' ? 'text-[#f44336]' : 'text-gray-600 dark:text-slate-300'}`}>{t.themeLight}</span>
                    </button>

                    <button 
                      onClick={() => handleThemeChange('dark')}
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-[#f44336] bg-red-50/50 dark:bg-red-900/20' : 'border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600'}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center">
                        <Moon size={24} strokeWidth={2.5}/>
                      </div>
                      <span className={`text-[13px] font-bold ${theme === 'dark' ? 'text-[#f44336]' : 'text-gray-600 dark:text-slate-300'}`}>{t.themeDark}</span>
                    </button>

                    <button 
                      onClick={() => handleThemeChange('system')}
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${theme === 'system' ? 'border-[#f44336] bg-red-50/50 dark:bg-red-900/20' : 'border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600'}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-500 flex items-center justify-center">
                        <Monitor size={24} strokeWidth={2.5}/>
                      </div>
                      <span className={`text-[13px] font-bold ${theme === 'system' ? 'text-[#f44336]' : 'text-gray-600 dark:text-slate-300'}`}>{t.themeSystem}</span>
                    </button>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. TAB LANGUAGE */}
          {activeTab === 'language' && (
            <div className="animate-in fade-in duration-300">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{t.languageTitle}</h2>
                  <p className="text-[13px] text-gray-500 dark:text-slate-400 font-medium">{t.languageSubtitle}</p>
                </div>

                <div className="bg-white dark:bg-[#1A2338] rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 md:w-3/4 space-y-3">
                  {[
                    { value: 'vi', label: t.vietnamese },
                    { value: 'en', label: t.english },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 cursor-pointer transition-all ${
                        language === option.value ? 'border-[#f44336] bg-red-50 dark:bg-red-900/20' : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className={`text-[14px] font-bold ${language === option.value ? 'text-[#f44336]' : 'text-gray-700 dark:text-slate-300'}`}>{option.label}</span>
                      <input
                        type="radio"
                        name="language"
                        value={option.value}
                        checked={language === option.value}
                        onChange={() => {
                          setLanguage(option.value);
                          setLanguageMessage(copy[option.value].languageSaved);
                          setTimeout(() => setLanguageMessage(''), 3000);
                        }}
                        className="w-4 h-4 accent-[#f44336]"
                      />
                    </label>
                  ))}

                  {languageMessage && <p className="text-[13px] font-bold text-[#00897b] pt-2 ml-1 animate-in fade-in">{languageMessage}</p>}
                </div>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}

export default function Settings() {
  const hasRouter = useInRouterContext();
  if (!hasRouter) {
    return (
      <BrowserRouter>
        <SettingsContent />
      </BrowserRouter>
    );
  }
  return <SettingsContent />;
}