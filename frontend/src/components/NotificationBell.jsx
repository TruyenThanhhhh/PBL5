import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Bell, Heart, MessageSquare, UserPlus, CheckCheck, X } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    // Kết nối socket và đăng ký user online
    const newSocket = io(SOCKET_URL);
    newSocket.emit('registerUser', userId);
    setSocket(newSocket);

    // Lắng nghe thông báo mới
    newSocket.on('newNotification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Hiện toast nhỏ
      showPopupToast(notif);
    });

    fetchNotifications(token);
    fetchUnreadCount(token);

    return () => newSocket.close();
  }, []);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async (token) => {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setNotifications(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchUnreadCount = async (token) => {
    try {
      const res = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (err) { console.error(err); }
  };

  const handleOpen = async () => {
    setIsOpen(prev => !prev);
    if (!isOpen && unreadCount > 0) {
      // Đánh dấu đã đọc tất cả
      const token = localStorage.getItem('token');
      try {
        await fetch(`${API_URL}/notifications/read-all`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (err) { console.error(err); }
    }
  };

  const showPopupToast = (notif) => {
    const div = document.createElement('div');
    div.className = 'fixed top-4 right-4 z-[9999] bg-white border border-gray-100 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2 fade-in';
    div.style.cssText = 'width: 320px; transition: opacity 0.3s;';
    div.innerHTML = `
      <img src="${notif.sender?.avatar || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-full object-cover border border-gray-100" />
      <div class="flex-1">
        <p class="text-[13px] font-bold text-gray-900">${notif.sender?.username || 'Ai đó'}</p>
        <p class="text-[12px] text-gray-500">${notif.content}</p>
      </div>
    `;
    document.body.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      setTimeout(() => div.remove(), 300);
    }, 4000);
  };

  const getIcon = (type) => {
    if (type === 'like') return <Heart size={14} className="text-[#f44336]" fill="#f44336" />;
    if (type === 'comment') return <MessageSquare size={14} className="text-blue-500" />;
    if (type === 'follow') return <UserPlus size={14} className="text-green-500" />;
    return <Bell size={14} className="text-gray-400" />;
  };

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative text-gray-500 hover:text-gray-900 transition-colors"
      >
        <Bell size={22} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-[#f44336] text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[14px] font-black text-gray-900">Thông báo</h3>
            <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-gray-400 gap-3">
                <Bell size={36} className="opacity-40" />
                <p className="text-[13px] font-medium">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-red-50/40' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={notif.sender?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=40&q=80'}
                      alt="sender"
                      className="w-10 h-10 rounded-full object-cover border border-gray-100"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                      {getIcon(notif.type)}
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[13px] text-gray-800 leading-snug">
                      <span className="font-bold">{notif.sender?.username}</span>{' '}
                      {notif.content}
                    </p>
                    <p className="text-[11px] font-bold text-gray-400 mt-0.5">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 bg-[#f44336] rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                type="button"
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  await fetch(`${API_URL}/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  setUnreadCount(0);
                }}
                className="flex items-center gap-2 text-[12px] font-bold text-[#f44336] hover:text-[#e53935] transition-colors"
              >
                <CheckCheck size={14} /> Đánh dấu tất cả đã đọc
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
