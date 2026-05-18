import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Compass, Home, LogOut, Settings, Shield, TrendingUp, UserCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const fallbackAvatar =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';

const copy = {
  vi: {
    profile: 'Xem hồ sơ',
    home: 'Trang chủ',
    explore: 'Khám phá',
    trending: 'Xu hướng',
    saved: 'Đã lưu',
    settings: 'Cài đặt',
    manage: 'Quản lý',
    logout: 'Đăng xuất',
    traveler: 'Người du hành',
    openMenu: 'Mở menu tài khoản',
  },
  en: {
    profile: 'View profile',
    home: 'Home',
    explore: 'Explore',
    trending: 'Trending',
    saved: 'Saved',
    settings: 'Settings',
    manage: 'Management',
    logout: 'Log out',
    traveler: 'Traveler',
    openMenu: 'Open account menu',
  },
};

const normalizeRole = (role) => (String(role || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user');

export default function AccountMenu({ avatar, username, onSavedClick, onTrendingClick }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = copy[language] || copy.vi;
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState({
    username: username || localStorage.getItem('displayName') || localStorage.getItem('username') || '',
    avatar: avatar || localStorage.getItem('avatar') || '',
    role: normalizeRole(localStorage.getItem('role') || 'user'),
  });

  useEffect(() => {
    setProfile((prev) => ({
      username: username || prev.username,
      avatar: avatar || prev.avatar,
      role: normalizeRole(localStorage.getItem('role') || prev.role),
    }));
  }, [avatar, username]);

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const user = data.user || data;
        setProfile({
          username: user.displayName || user.username || localStorage.getItem('displayName') || localStorage.getItem('username') || '',
          avatar: user.avatar || localStorage.getItem('avatar') || '',
          role: normalizeRole(user.role || localStorage.getItem('role')),
        });
      } catch {
        // Keep localStorage fallback if the profile endpoint is unavailable.
      }
    };

    loadProfile();
  }, []);

  // XỬ LÝ CHỐNG ĐÈ COMPONENT
  useEffect(() => {
    const handleCloseAll = () => setIsOpen(false);
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('closeAllMenus', handleCloseAll);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('closeAllMenus', handleCloseAll);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      window.dispatchEvent(new Event('closeAllMenus'));
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const closeAndNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleSaved = () => {
    setIsOpen(false);
    if (onSavedClick) {
      onSavedClick();
      return;
    }
    navigate('/profile');
  };

  const handleTrending = () => {
    setIsOpen(false);
    if (onTrendingClick) {
      onTrendingClick();
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new CustomEvent('authChange'));
    setIsOpen(false);
    navigate('/login');
  };

  const displayName = profile.username || t.traveler;
  
  // Chuẩn hóa URL ảnh
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
  };
  const displayAvatar = getImageUrl(profile.avatar) || fallbackAvatar;
  const isAdmin = normalizeRole(profile.role) === 'admin';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={toggleMenu}
        className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden bg-white shadow-sm hover:ring-2 hover:ring-[#f44336]/20 transition-all focus:outline-none"
        aria-label={t.openMenu}
      >
        <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-[280px] rounded-3xl bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-3 z-[150] animate-in slide-in-from-top-2 fade-in duration-200">
          
          {/* Header hiển thị Profile giống y hệt thiết kế */}
          <div className="bg-gray-50/80 rounded-2xl p-3 mb-2 border border-gray-100/50">
            <div className="flex items-center gap-3">
              <img src={displayAvatar} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-black text-[#002B49] truncate leading-tight">{displayName}</p>
                <p className="text-[12px] font-medium text-gray-400 truncate">@{displayName.toLowerCase().replace(/\s+/g, '_')}</p>
              </div>
            </div>
          </div>

          {/* Danh sách Menu */}
          <div className="space-y-1 text-[14px] font-extrabold text-[#1c2c3b]">
            <MenuButton icon={UserCircle} label={t.profile} onClick={() => closeAndNavigate('/profile')} />
            <MenuButton icon={Home} label={t.home} onClick={() => closeAndNavigate('/dashboard')} />
            <MenuButton icon={Compass} label={t.explore} onClick={() => closeAndNavigate('/explore')} />
            <MenuButton icon={TrendingUp} label={t.trending} onClick={handleTrending} />
            <MenuButton icon={Bookmark} label={t.saved} onClick={handleSaved} />
            <MenuButton icon={Settings} label={t.settings} onClick={() => closeAndNavigate('/settings')} />
            {isAdmin && <MenuButton icon={Shield} label={t.manage} onClick={() => closeAndNavigate('/admin')} />}
            <MenuButton icon={LogOut} label={t.logout} onClick={handleLogout} danger />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-left transition-colors ${
        danger ? 'hover:bg-red-50' : 'hover:bg-gray-50'
      }`}
    >
      <span className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
        danger 
        ? 'border-red-100 text-[#f44336] bg-red-50/50' 
        : 'border-gray-200 text-gray-500 bg-gray-50/50'
      }`}>
        <Icon size={16} strokeWidth={2.5} />
      </span>
      <span className={danger ? 'text-[#f44336]' : 'text-[#1c2c3b]'}>
        {label}
      </span>
    </button>
  );
}