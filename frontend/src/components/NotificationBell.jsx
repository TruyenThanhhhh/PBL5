import React, { useState, useEffect } from 'react';
import { Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const API = 'http://localhost:5000/api';
  const token = () => localStorage.getItem('token');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayBadgeCount = unreadCount > 9 ? '9+' : unreadCount;

  const t = {
    vi: {
      title: 'Thông báo',
      markRead: 'Đánh dấu đã đọc',
      empty: 'Không có thông báo mới.',
      justNow: 'Vừa xong'
    },
    en: {
      title: 'Notifications',
      markRead: 'Mark all as read',
      empty: 'No new notifications.',
      justNow: 'Just now'
    }
  }[language] || {
    title: 'Thông báo',
    markRead: 'Đánh dấu đã đọc',
    empty: 'Không có thông báo mới.',
    justNow: 'Vừa xong'
  };

  const fetchNotifications = async () => {
    if (!token()) return;
    try {
      const res = await fetch(`${API}/notifications`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleReadNotification = async (notif) => {
    setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
    setIsNotificationOpen(false);

    if (token()) {
      fetch(`${API}/notifications/${notif._id}/read`, {
        method: 'PUT', headers: authHeader()
      }).catch(() => {});
    }

    if (notif.type === 'message' && notif.sender) {
      window.dispatchEvent(new CustomEvent('openChat', {
        detail: { userId: notif.sender._id }
      }));
    } else if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (token()) {
      fetch(`${API}/notifications/read-all`, {
        method: 'PUT', headers: authHeader()
      }).catch(() => {});
    }
  };

  const handleNavigateProfile = (userId) => {
    if (userId) {
      navigate('/profile', { state: { targetUserId: userId } });
      setIsNotificationOpen(false);
    }
  };

  return (
    <div className="relative">
      <button 
        type="button" 
        onClick={() => {
          setIsNotificationOpen(!isNotificationOpen);
          if (!isNotificationOpen) fetchNotifications();
        }} 
        className={`text-gray-500 hover:text-gray-900 transition-colors relative ${isNotificationOpen ? 'text-[#f44336]' : ''}`}
      >
        <Bell size={22} strokeWidth={2} />
        {unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white flex items-center justify-center min-w-[18px]">
            {displayBadgeCount}
          </span>
        ) : null}
      </button>

      {isNotificationOpen && (
        <div className="absolute right-0 top-12 w-[340px] bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden z-[130] animate-in slide-in-from-top-2 fade-in">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-[14px] text-gray-900">{t.title}</h3>
            {unreadCount > 0 ? (
              <button 
                onClick={handleMarkAllAsRead} 
                className="text-[11px] font-semibold text-[#f44336] hover:underline"
              >
                {t.markRead}
              </button>
            ) : null}
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            {notifications.length === 0 ? (
               <div className="p-6 text-center text-[12px] text-gray-500">
                  {t.empty}
               </div>
            ) : (
               notifications.map(notif => (
                 <div 
                   key={notif._id} 
                   onClick={() => handleReadNotification(notif)}
                   className={`flex items-start gap-3 p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                 >
                   <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 overflow-hidden border border-gray-200" onClick={(e) => { e.stopPropagation(); handleNavigateProfile(notif.sender?._id); }}>
                     {notif.sender?.avatar ? <img src={notif.sender.avatar} className="w-full h-full object-cover"/> : <User size={20} />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-[13px] text-gray-800 leading-tight">
                       <span onClick={(e) => { e.stopPropagation(); handleNavigateProfile(notif.sender?._id); }} className="font-bold text-gray-900 mr-1 hover:underline">{notif.sender?.username}</span>
                       {notif.content}
                     </p>
                     <p className="text-[11px] text-[#f44336] font-medium mt-1">{t.justNow}</p>
                   </div>
                   {!notif.isRead && <div className="w-2.5 h-2.5 bg-[#f44336] rounded-full shrink-0 mt-1.5 shadow-sm"></div>}
                 </div>
               ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}