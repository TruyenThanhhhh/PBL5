import React, { useState, useEffect, useRef } from 'react';
import { Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const bellRef = useRef(null);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const API = 'http://localhost:5000/api';
  const token = () => localStorage.getItem('token');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  const unreadCount = notifications.filter(n => !n.isRead).length;

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

  // XỬ LÝ CHỐNG ĐÈ COMPONENT
  useEffect(() => {
    const handleCloseAll = () => setIsNotificationOpen(false);
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsNotificationOpen(false);
      }
    };

    window.addEventListener('closeAllMenus', handleCloseAll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('closeAllMenus', handleCloseAll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!isNotificationOpen) {
      window.dispatchEvent(new Event('closeAllMenus'));
      setIsNotificationOpen(true);
      fetchNotifications();
    } else {
      setIsNotificationOpen(false);
    }
  };

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

  // Tính thời gian hiển thị thân thiện (nếu cần xử lý thời gian thực từ notif.createdAt)
  // Ở đây để đơn giản theo thiết kế, ta dùng label "Vừa xong"
  return (
    <div className="relative" ref={bellRef}>
      <button 
        type="button" 
        onClick={toggleMenu} 
        className={`text-gray-500 hover:text-gray-900 transition-colors focus:outline-none relative ${isNotificationOpen ? 'text-[#f44336]' : ''}`}
      >
        <Bell size={22} strokeWidth={2} />
        {unreadCount > 0 ? (
          <span className="absolute 1 top-1 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        ) : null}
      </button>

      {isNotificationOpen && (
        <div className="absolute right-0 top-12 w-[340px] bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden z-[150] animate-in slide-in-from-top-2 fade-in duration-200">
          
          {/* Header Thông báo */}
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
            <h3 className="font-extrabold text-[15px] text-[#002B49]">{t.title}</h3>
            {unreadCount > 0 ? (
              <button 
                onClick={handleMarkAllAsRead} 
                className="text-[11px] font-bold text-[#f44336] hover:underline"
              >
                {t.markRead}
              </button>
            ) : null}
          </div>

          {/* List Thông báo */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar pb-2">
            {notifications.length === 0 ? (
               <div className="p-8 text-center text-[13px] font-medium text-gray-500">
                 {t.empty}
               </div>
            ) : (
               <div className="flex flex-col">
                 {notifications.map((notif) => {
                   const avatarUrl = getImageUrl(notif.sender?.avatar);
                   return (
                     <div 
                       key={notif._id} 
                       className={`flex gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-red-50/10' : ''}`}
                       onClick={() => handleReadNotification(notif)}
                     >
                       <div 
                         className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 hover:opacity-80"
                         onClick={(e) => { e.stopPropagation(); handleNavigateProfile(notif.sender?._id); }}
                       >
                         {avatarUrl ? (
                           <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                         ) : (
                           <User size={20} className="text-gray-400" />
                         )}
                       </div>
                       
                       <div className="flex-1 min-w-0 pr-2">
                         <p className="text-[13px] text-[#1c2c3b] leading-[1.4]">
                           <span 
                             onClick={(e) => { e.stopPropagation(); handleNavigateProfile(notif.sender?._id); }} 
                             className="font-extrabold text-[#002B49] mr-1 hover:underline"
                           >
                             {notif.sender?.username}
                           </span>
                           {notif.content}
                         </p>
                         <p className="text-[12px] font-bold text-[#f44336] mt-1.5">{t.justNow}</p>
                       </div>
                     </div>
                   );
                 })}
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}