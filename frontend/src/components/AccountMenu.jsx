import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  Users,
  Bookmark,
  Globe2,
  TrendingUp,
  Compass,
  Home,
  Upload,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { accountNavMenu } from '../constants/accountNavMenu';

const getAvatarUrl = (url, name) =>
  url ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff&size=200`;

export default function AccountMenu({ avatar, username }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = accountNavMenu[language] || accountNavMenu.vi;
  const wrapRef = useRef(null);

  const role = String(localStorage.getItem('role') || 'user').toLowerCase();

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('avatar');
    localStorage.removeItem('displayName');
    localStorage.removeItem('roleRequestStatus');
    setOpen(false);
    navigate('/login');
  };

  const displayName = username || localStorage.getItem('displayName') || localStorage.getItem('username') || 'User';
  const avatarUrl = avatar || localStorage.getItem('avatar') || '';
  const uname = localStorage.getItem('username') || '';

  const btnRow =
    'mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold text-gray-800 transition-colors hover:bg-gray-50';

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50 transition"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {avatarUrl ? (
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200">
            <img src={getAvatarUrl(avatarUrl, uname)} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
          </span>
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 ring-1 ring-gray-200">
            <User size={16} />
          </span>
        )}
        <span className="hidden max-w-[140px] truncate sm:inline">{displayName}</span>
        <ChevronDown size={16} className={`shrink-0 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-[140] mt-2 w-[min(calc(100vw-1.5rem),18rem)] rounded-2xl border border-gray-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
          <div className="mb-1 border-b border-gray-100 px-4 pb-2">
            <p className="truncate text-[13px] font-black text-gray-900">{displayName}</p>
            <p className="truncate text-[11px] font-medium text-gray-500">
              @{String(uname)
                .toLowerCase()
                .replace(/\s+/g, '_')}
            </p>
          </div>

          <p className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400">{t.sectionAccount}</p>
          <button type="button" onClick={() => go('/profile')} className={btnRow}>
            <User size={18} className="shrink-0 opacity-80" />
            {t.myProfile}
          </button>
          <button type="button" onClick={() => go('/settings')} className={btnRow}>
            <Settings size={18} className="shrink-0 opacity-80" />
            {t.settings}
          </button>
          <button type="button" onClick={() => go('/friends')} className={btnRow}>
            <Users size={18} className="shrink-0 opacity-80" />
            {t.friends}
          </button>
          <button type="button" onClick={() => go('/saved')} className={btnRow}>
            <Bookmark size={18} className="shrink-0 opacity-80" />
            {t.saved}
          </button>

          <div className="my-2 border-t border-gray-100" />
          <p className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400">{t.sectionMore}</p>
          <button type="button" onClick={() => go('/dashboard')} className={btnRow}>
            <Home size={18} className="shrink-0 opacity-80" />
            {t.feed}
          </button>
          <button type="button" onClick={() => go('/explore')} className={btnRow}>
            <Compass size={18} className="shrink-0 opacity-80" />
            {t.explore}
          </button>
          <button type="button" onClick={() => go('/community')} className={btnRow}>
            <Globe2 size={18} className="shrink-0 opacity-80" />
            {t.community}
          </button>
          <button type="button" onClick={() => go('/trending')} className={btnRow}>
            <TrendingUp size={18} className="shrink-0 opacity-80" />
            {t.trending}
          </button>
          <button type="button" onClick={() => go('/upload')} className={btnRow}>
            <Upload size={18} className="shrink-0 opacity-80" />
            {t.newPost}
          </button>

          {role === 'admin' && (
            <button
              type="button"
              onClick={() => go('/admin')}
              className="mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold text-amber-800 transition-colors hover:bg-amber-50"
            >
              <ShieldAlert size={18} className="shrink-0 opacity-90" />
              {t.adminPanel}
            </button>
          )}

          <div className="my-2 border-t border-gray-100" />
          <button
            type="button"
            onClick={handleLogout}
            className="mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut size={18} className="shrink-0 opacity-90" />
            {t.logout}
          </button>
        </div>
      )}
    </div>
  );
}
