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
        const res = await fetch('http://localhost:5000/api/profile', {
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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
  const displayAvatar = profile.avatar || fallbackAvatar;
  const isAdmin = normalizeRole(profile.role) === 'admin';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden bg-white shadow-sm hover:ring-2 hover:ring-[#f44336]/20 transition-all"
        aria-label={t.openMenu}
      >
        <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-[320px] rounded-2xl bg-white border border-gray-100 shadow-2xl shadow-gray-900/10 p-3 z-[100]">
          <button
            type="button"
            onClick={() => closeAndNavigate('/profile')}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left"
          >
            <img src={displayAvatar} alt={displayName} className="w-11 h-11 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="text-[14px] font-black text-gray-900 truncate">{displayName}</p>
              <p className="text-[12px] font-semibold text-gray-400 truncate">@{displayName.toLowerCase().replace(/\s+/g, '_')}</p>
            </div>
          </button>

          <div className="h-px bg-gray-100 my-2" />

          <div className="space-y-1 text-[14px] font-bold text-gray-700">
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
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left ${
        danger ? 'text-[#f44336] hover:bg-red-50' : 'hover:bg-gray-50'
      }`}
    >
      <span className={`w-9 h-9 rounded-full flex items-center justify-center ${danger ? 'bg-red-50 text-[#f44336]' : 'bg-gray-100 text-gray-600'}`}>
        <Icon size={19} strokeWidth={2.4} />
      </span>
      {label}
    </button>
  );
}
