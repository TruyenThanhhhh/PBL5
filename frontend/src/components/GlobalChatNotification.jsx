import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  MessageSquare, X, ArrowLeft, Send, User, Image as ImageIcon,
  Search, Users, Loader2, MoreHorizontal, Trash2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const API = 'http://localhost:5000';

export default function GlobalChatNotification() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [isUserChatOpen, setIsUserChatOpen] = useState(false);
  const [chatView, setChatView] = useState('list');
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userMessageInput, setUserMessageInput] = useState('');
  const [userMessages, setUserMessages] = useState({});
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationsList, setConversationsList] = useState([]);
  const [friends, setFriends] = useState([]);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatImageFile, setChatImageFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isChatOptionsOpen, setIsChatOptionsOpen] = useState(false);
  const [typingInfo, setTypingInfo] = useState(null);

  const getToken = () => localStorage.getItem('token');
  const getMyId = () => localStorage.getItem('userId');

  const currentKey =
    currentConversationId ||
    (selectedGroup ? selectedGroup._id : selectedChatUser ? String(selectedChatUser._id) : null);
  const currentChatMessages = currentKey ? userMessages[currentKey] || [] : [];

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (_) {
      setNotifications([]);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        setFriends((user.friends || []).filter((u) => u && (u._id || u)));
      }
    } catch (_) {}
  }, []);

  const fetchConversations = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setConversationsList(await res.json());
    } catch (_) {}
  }, []);

  const markAsSeen = useCallback(async (convId) => {
    if (!convId) return;
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API}/api/messages/${convId}/seen`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      socketRef.current?.emit('mark_as_seen', {
        conversationId: convId,
        userId: getMyId(),
      });
    } catch (_) {}
  }, []);

  const loadConversationMessages = useCallback(
    async (convId) => {
      const token = getToken();
      const myId = getMyId();
      if (!token || !convId) return;
      setIsChatLoading(true);
      try {
        setCurrentConversationId(convId);
        socketRef.current?.emit('join_room', convId);
        const msgRes = await fetch(`${API}/api/messages/${convId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (msgRes.ok) {
          const messages = await msgRes.json();
          const formattedMessages = messages.map((msg) => {
            const senderId = String(msg.sender?._id || msg.sender);
            const isMe = senderId === String(myId);
            return {
              sender: isMe ? 'me' : 'them',
              senderName: msg.sender?.username,
              senderAvatar: msg.sender?.avatar,
              senderId,
              text: msg.text,
              image: msg.image,
              readBy: msg.readBy?.map((u) => u._id || u),
              createdAt: msg.createdAt,
            };
          });
          setUserMessages((prev) => ({ ...prev, [convId]: formattedMessages }));
          markAsSeen(convId);
        }
      } catch (_) {
      } finally {
        setIsChatLoading(false);
      }
    },
    [markAsSeen]
  );

  const fetchChatHistory = useCallback(
    async (targetUserId, groupId = null) => {
      const token = getToken();
      const myId = getMyId();
      if (!token || (!targetUserId && !groupId)) return;

      setIsChatLoading(true);
      try {
        let convId = groupId;

        if (!convId) {
          const convRes = await fetch(`${API}/api/messages/conversation`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ targetUserId }),
          });
          if (!convRes.ok) return;
          const conversation = await convRes.json();
          convId = conversation._id;
        }

        setCurrentConversationId(convId);
        socketRef.current?.emit('join_room', convId);

        const msgRes = await fetch(`${API}/api/messages/${convId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (msgRes.ok) {
          const messages = await msgRes.json();
          const formattedMessages = messages.map((msg) => {
            const senderId = String(msg.sender?._id || msg.sender);
            const isMe = senderId === String(myId);
            return {
              sender: isMe ? 'me' : 'them',
              senderName: msg.sender?.username,
              senderAvatar: msg.sender?.avatar,
              senderId,
              text: msg.text,
              image: msg.image,
              readBy: msg.readBy?.map((u) => u._id || u),
              createdAt: msg.createdAt,
            };
          });
          setUserMessages((prev) => ({ ...prev, [convId]: formattedMessages }));
          markAsSeen(convId);
        }
      } catch (_) {
      } finally {
        setIsChatLoading(false);
      }
    },
    [markAsSeen]
  );

  const openConversationWithUser = useCallback(
    async (targetUser) => {
      if (!targetUser?._id) return;
      setSelectedGroup(null);
      setSelectedChatUser(targetUser);
      setChatView('conversation');
      setCurrentConversationId(null);
      await fetchChatHistory(String(targetUser._id), null);
    },
    [fetchChatHistory]
  );

  const fetchUserById = useCallback(async (userId) => {
    const token = getToken();
    if (!token || !userId) return null;
    try {
      const res = await fetch(`${API}/api/users/${userId}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return res.json();
    } catch (_) {}
    return { _id: userId, username: 'Người dùng' };
  }, []);

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
  };

  const handleReadNotification = async (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
    );
    setIsNotificationOpen(false);

    const token = getToken();
    if (token && !notif.isRead) {
      fetch(`${API}/api/notifications/${notif._id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    if (notif.type === 'message' && notif.sender) {
      setIsUserChatOpen(true);
      await openConversationWithUser(notif.sender);
      return;
    }

    if (notif.post) {
      navigate('/post-detail', { state: { postId: notif.post } });
    }
  };

  const handleSendMessage = async () => {
    if ((!userMessageInput.trim() && !chatImageFile) || (!selectedChatUser && !selectedGroup)) return;

    const token = getToken();
    const myId = getMyId();
    if (!token) return;

    const text = userMessageInput.trim();
    let convId = currentConversationId;
    setUserMessageInput('');
    setIsChatOptionsOpen(false);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socketRef.current && convId) {
      socketRef.current.emit('stop_typing', { conversationId: convId, userId: myId });
    }

    try {
      let imageUrl = null;
      if (chatImageFile) {
        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append('image', chatImageFile);
        const uploadRes = await fetch(`${API}/api/messages/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }
        setChatImageFile(null);
        setIsUploadingImage(false);
      }

      if (!convId && !selectedGroup && selectedChatUser) {
        const convRes = await fetch(`${API}/api/messages/conversation`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ targetUserId: String(selectedChatUser._id) }),
        });
        if (convRes.ok) {
          const conversation = await convRes.json();
          convId = conversation._id;
          setCurrentConversationId(convId);
          socketRef.current?.emit('join_room', convId);
        }
      }

      if (!convId && selectedGroup) convId = selectedGroup._id;
      if (!convId) return;

      const res = await fetch(`${API}/api/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: convId,
          receiverId: selectedGroup ? undefined : String(selectedChatUser._id),
          text,
          image: imageUrl,
        }),
      });

      if (res.ok) {
        socketRef.current?.emit('send_message', {
          conversationId: convId,
          text,
          image: imageUrl,
          senderId: myId,
          senderName: localStorage.getItem('username'),
          senderAvatar: localStorage.getItem('avatar'),
        });

        const msgObj = {
          sender: 'me',
          text,
          image: imageUrl,
          senderName: localStorage.getItem('username'),
          senderAvatar: localStorage.getItem('avatar'),
          readBy: [myId],
          createdAt: new Date().toISOString(),
        };
        setUserMessages((prev) => ({
          ...prev,
          [convId]: [...(prev[convId] || []), msgObj],
        }));
        fetchConversations();
      }
    } catch (_) {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!currentConversationId) return;
    const token = getToken();
    if (!token || !window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) return;
    try {
      const res = await fetch(`${API}/api/messages/${currentConversationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setChatView('list');
        setSelectedChatUser(null);
        setSelectedGroup(null);
        setCurrentConversationId(null);
        fetchConversations();
      }
    } catch (_) {}
  };

  const handleChatInputChange = (e) => {
    setUserMessageInput(e.target.value);
    if (!socketRef.current || !currentConversationId) return;
    socketRef.current.emit('typing', {
      conversationId: currentConversationId,
      userId: getMyId(),
      username: localStorage.getItem('username'),
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', {
        conversationId: currentConversationId,
        userId: getMyId(),
      });
    }, 1500);
  };

  useEffect(() => {
    const myId = getMyId();
    if (!myId) return;

    const socket = io(API, { transports: ['websocket', 'polling'], withCredentials: true });
    socketRef.current = socket;
    socket.emit('user_online', myId);

    socket.on('receive_message', (data) => {
      const { conversationId, text, image, readBy, sender, createdAt } = data;
      const currentUserId = getMyId();
      const isMine = String(sender._id || sender) === String(currentUserId);

      const msgObj = {
        sender: isMine ? 'me' : 'them',
        text,
        image,
        readBy: readBy || [],
        senderName: sender.username,
        senderAvatar: sender.avatar,
        senderId: sender._id || sender,
        createdAt,
      };

      setUserMessages((prev) => {
        const existing = prev[conversationId] || [];
        const isDuplicate = existing.some(
          (m) =>
            m.text === text &&
            m.sender === (isMine ? 'me' : 'them') &&
            Math.abs(new Date(m.createdAt || Date.now()) - new Date(createdAt)) < 2000
        );
        if (isDuplicate) return prev;
        return { ...prev, [conversationId]: [...existing, msgObj] };
      });

      setCurrentConversationId((openId) => {
        if (openId === conversationId) markAsSeen(conversationId);
        return openId;
      });
      fetchConversations();
    });

    socket.on('message_seen', ({ conversationId, userId }) => {
      setUserMessages((prev) => {
        const messages = prev[conversationId] || [];
        const updated = messages.map((m) => {
          const currentReadBy = m.readBy || [];
          if (!currentReadBy.includes(userId)) {
            return { ...m, readBy: [...currentReadBy, userId] };
          }
          return m;
        });
        return { ...prev, [conversationId]: updated };
      });
    });

    socket.on('user_typing', ({ username }) => setTypingInfo({ username }));
    socket.on('user_stop_typing', () => setTypingInfo(null));

    socket.on(`notification_${myId}`, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [fetchConversations, markAsSeen]);

  useEffect(() => {
    if (currentConversationId) {
      socketRef.current?.emit('join_room', currentConversationId);
    }
  }, [currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userMessages, chatView, isUserChatOpen]);

  useEffect(() => {
    if (getMyId()) {
      fetchNotifications();
      fetchConversations();
      fetchFriends();
    }
  }, [fetchNotifications, fetchConversations, fetchFriends]);

  useEffect(() => {
    const handleOpenChat = async (e) => {
      const targetUserId = e.detail?.targetUserId || e.detail?.userId;
      if (targetUserId) {
        setIsUserChatOpen(true);
        setIsNotificationOpen(false);
        const user = await fetchUserById(targetUserId);
        if (user) await openConversationWithUser(user);
        return;
      }
      setIsUserChatOpen((open) => {
        if (open) return false;
        fetchConversations();
        fetchFriends();
        setChatView('list');
        setSelectedChatUser(null);
        setSelectedGroup(null);
        setCurrentConversationId(null);
        return true;
      });
      setIsNotificationOpen(false);
    };

    const handleOpenNotifications = () => {
      setIsNotificationOpen((open) => {
        if (open) return false;
        fetchNotifications();
        return true;
      });
      setIsUserChatOpen(false);
    };

    window.addEventListener('openChat', handleOpenChat);
    window.addEventListener('openNotifications', handleOpenNotifications);
    return () => {
      window.removeEventListener('openChat', handleOpenChat);
      window.removeEventListener('openNotifications', handleOpenNotifications);
    };
  }, [fetchNotifications, openConversationWithUser, fetchUserById, fetchConversations, fetchFriends]);

  useEffect(() => {
    if (isUserChatOpen && chatView === 'conversation') {
      if (selectedGroup) {
        fetchChatHistory(null, selectedGroup._id);
      } else if (selectedChatUser && !currentConversationId) {
        fetchChatHistory(selectedChatUser._id, null);
      }
    }
  }, [isUserChatOpen, chatView, selectedChatUser, selectedGroup, currentConversationId, fetchChatHistory]);

  const myId = getMyId();
  if (!myId) return null;

  const panelBg = isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200';
  const panelHeader = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100';

  return (
    <>
      {isNotificationOpen && (
        <>
          <div onClick={() => setIsNotificationOpen(false)} role="presentation" className="fixed inset-0 z-[140]" />
          <div className={`fixed right-6 top-[72px] w-[340px] border shadow-2xl rounded-2xl overflow-hidden z-[150] ${panelBg}`}>
            <div className={`px-4 py-3 border-b flex justify-between items-center ${panelHeader}`}>
              <h3 className={`font-bold text-[14px] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Thông báo</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className="text-[11px] font-semibold text-[#f44336] hover:underline">
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>
            <div className={`max-h-[400px] overflow-y-auto ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-[12px] text-gray-500">Không có thông báo mới.</div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleReadNotification(notif)}
                    className={`flex items-start gap-3 p-3 border-b cursor-pointer transition-colors ${
                      isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-50 hover:bg-gray-50'
                    } ${!notif.isRead ? (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50/30') : ''}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-gray-400 shrink-0 overflow-hidden border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      {notif.sender?.avatar ? (
                        <img src={notif.sender.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-tight ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                        <span className={`font-bold mr-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {notif.sender?.username}
                        </span>
                        {notif.content}
                      </p>
                      <p className="text-[11px] text-[#f44336] font-medium mt-1">Vừa xong</p>
                    </div>
                    {!notif.isRead && <div className="w-2.5 h-2.5 bg-[#f44336] rounded-full shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {isUserChatOpen && (
        <div className="fixed right-6 top-[80px] z-[150] w-[340px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 h-[520px]">
          <div className="bg-[#f44336] text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {chatView === 'conversation' ? (
                <>
                  <button
                    onClick={() => {
                      setChatView('list');
                      setIsChatOptionsOpen(false);
                      fetchConversations();
                    }}
                    className="hover:bg-red-600 p-1 rounded-full"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <span className="font-bold text-[14px] truncate">
                    {selectedGroup ? selectedGroup.groupName : selectedChatUser?.username || 'Trò chuyện'}
                  </span>
                </>
              ) : (
                <>
                  <MessageSquare size={18} />
                  <span className="font-bold text-[14px]">Tin nhắn</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              {chatView === 'conversation' && (
                <div className="relative">
                  <button onClick={() => setIsChatOptionsOpen(!isChatOptionsOpen)} className="hover:bg-red-600 p-1 rounded-full">
                    <MoreHorizontal size={18} />
                  </button>
                  {isChatOptionsOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border py-1 z-[160] text-gray-700">
                      <button
                        onClick={() => {
                          setIsChatOptionsOpen(false);
                          handleDeleteConversation();
                        }}
                        className="w-full text-left px-4 py-2 text-[12px] font-bold hover:bg-gray-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 size={14} /> Xóa cuộc trò chuyện
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {chatView === 'list' ? (
            <div className="flex flex-col flex-1 overflow-hidden bg-white">
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm cuộc trò chuyện..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="w-full rounded-full py-2 pl-8 pr-3 text-[13px] bg-[#f4f4f5] outline-none"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {chatSearchQuery.trim() === '' ? (
                  <>
                    {conversationsList.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-2">Cuộc trò chuyện</p>
                        {conversationsList.map((conv) => {
                          const isGroup = conv.isGroup;
                          const other = !isGroup
                            ? conv.participants?.find((p) => String(p._id) !== String(myId))
                            : null;
                          const name = isGroup ? conv.groupName : other?.username || 'Người dùng';
                          const avatar = isGroup ? null : other?.avatar;
                          return (
                            <div
                              key={conv._id}
                              onClick={() => {
                                if (isGroup) {
                                  setSelectedGroup(conv);
                                  setSelectedChatUser(null);
                                } else {
                                  setSelectedGroup(null);
                                  setSelectedChatUser(other);
                                }
                                setChatView('conversation');
                                loadConversationMessages(conv._id);
                              }}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                {avatar ? (
                                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Users size={18} className="text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[12px] truncate">{name}</p>
                                <p className="text-[11px] text-gray-400 truncate">
                                  {conv.lastMessage?.text || 'Bắt đầu trò chuyện'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-2">Bạn bè</p>
                      {friends.length === 0 ? (
                        <p className="text-[11px] text-gray-400 text-center py-4 italic">Hãy kết thêm bạn để nhắn tin!</p>
                      ) : (
                        friends.map((friend) => (
                          <div
                            key={friend._id}
                            onClick={() => {
                              setSelectedGroup(null);
                              setSelectedChatUser(friend);
                              setCurrentConversationId(null);
                              setChatView('conversation');
                            }}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {friend.avatar ? (
                                <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={18} className="text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[12px] truncate">{friend.username}</p>
                              <p className="text-[11px] text-gray-400">Nhấn để nhắn tin</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {friends
                      .filter((f) => f.username?.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                      .map((friend) => (
                        <div
                          key={friend._id}
                          onClick={() => {
                            setSelectedGroup(null);
                            setSelectedChatUser(friend);
                            setCurrentConversationId(null);
                            setChatView('conversation');
                            setChatSearchQuery('');
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {friend.avatar ? (
                              <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[12px] truncate">{friend.username}</p>
                            <p className="text-[11px] text-gray-400">Bạn bè</p>
                          </div>
                        </div>
                      ))}
                    {conversationsList
                      .filter(
                        (c) =>
                          c.isGroup &&
                          c.groupName?.toLowerCase().includes(chatSearchQuery.toLowerCase())
                      )
                      .map((conv) => (
                        <div
                          key={conv._id}
                          onClick={() => {
                            setSelectedGroup(conv);
                            setSelectedChatUser(null);
                            setChatView('conversation');
                            setChatSearchQuery('');
                            loadConversationMessages(conv._id);
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 flex items-center justify-center">
                            <Users size={18} className="text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[12px] truncate">{conv.groupName}</p>
                            <p className="text-[11px] text-gray-400">Nhóm chat</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden bg-[#fafafa]">
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {isChatLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-[#f44336]" size={24} />
                  </div>
                ) : currentChatMessages.length === 0 ? (
                  <div className="text-center text-[12px] text-gray-400 py-8">Bắt đầu cuộc trò chuyện!</div>
                ) : (
                  currentChatMessages.map((msg, idx) => {
                    const isMe = msg.sender === 'me';
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-2xl text-[13px] font-medium whitespace-pre-wrap break-words ${
                            isMe
                              ? 'bg-[#f44336] text-white rounded-br-md'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                          }`}
                        >
                          {msg.image && (
                            <img
                              src={msg.image}
                              className="max-w-full rounded-xl mb-1 cursor-pointer"
                              alt=""
                              onClick={() => window.open(msg.image, '_blank')}
                            />
                          )}
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {typingInfo && (
                <p className="text-[11px] text-gray-400 px-3 pb-1 animate-pulse">
                  ✏️ {typingInfo.username} đang gõ...
                </p>
              )}

              {chatImageFile && (
                <div className="px-3 pb-1 flex items-center gap-2">
                  <img
                    src={URL.createObjectURL(chatImageFile)}
                    className="h-12 w-12 object-cover rounded-lg border"
                    alt=""
                  />
                  <button onClick={() => setChatImageFile(null)} className="text-red-500">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="p-3 border-t border-gray-100 flex gap-2 bg-white">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => setChatImageFile(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-[#f44336] shrink-0"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  value={userMessageInput}
                  onChange={handleChatInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Nhắn tin..."
                  disabled={isUploadingImage}
                  className="flex-1 bg-[#f4f4f5] rounded-xl px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={(!userMessageInput.trim() && !chatImageFile) || isUploadingImage}
                  className="px-3 py-2 rounded-xl bg-[#f44336] text-white disabled:opacity-50 shrink-0"
                >
                  {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
