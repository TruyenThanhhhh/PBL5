import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Send, ArrowLeft, Loader2, User, X, MessageSquare } from 'lucide-react';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  const messagesEndRef = useRef(null);

  // Lắng nghe event mở chat
  useEffect(() => {
    const handleOpenChat = async (e) => {
      setIsOpen(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const targetUserId = e.detail?.userId;
      
      // Nếu có targetUserId, hãy tạo/lấy cuộc trò chuyện với người đó
      if (targetUserId) {
        setLoadingConfig(true);
        try {
          const res = await fetch(`${API_URL}/messages/conversation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ targetUserId })
          });
          if (res.ok) {
            const newConv = await res.json();
            await fetchConversations(token);
            // Auto Select the conversation
            handleSelectConversation(newConv);
          }
        } catch (error) {
          console.error("Failed to start new chat", error);
        } finally {
          setLoadingConfig(false);
        }
      } else {
        // Chỉ mở hộp thoại
        fetchConversations(token);
      }
    };

    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  // Socket & Auth Init
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    if (!token || !userId) return;

    setCurrentUser({ id: userId });
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    if (isOpen) {
      fetchConversations(token);
      fetchSuggestedUsers(token);
    }

    return () => newSocket.close();
  }, [isOpen]);

  useEffect(() => {
    if (socket && activeConversation) {
      socket.emit('joinConversation', activeConversation._id);

      const handleNewMessage = (msg) => {
        if (msg.conversationId === activeConversation._id) {
          setMessages((prev) => [...prev, msg]);
          // Cuộn mượt
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      };

      socket.on('newMessage', handleNewMessage);
      return () => {
        socket.off('newMessage', handleNewMessage);
      };
    }
  }, [socket, activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversation]);

  const fetchConversations = async (token) => {
    try {
      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        return data;
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  const fetchSuggestedUsers = async (token) => {
    try {
      const res = await fetch(`${API_URL}/users/search`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    fetchMessages(conv._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversation) return;

    // Hiển thị tạm tin nhắn bên UI để trông có vẻ gửi nhanh
    const tempMsg = {
      _id: Date.now().toString(),
      text: inputMessage,
      sender: { _id: currentUser.id },
      conversationId: activeConversation._id
    };
    // setMessages(prev => [...prev, tempMsg]); => Không set vội vì socket sẽ tự emit về

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: activeConversation._id,
          text: inputMessage
        })
      });

      if (res.ok) {
        setInputMessage('');
        fetchConversations(token); // Cập nhật lại lastMessage
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getOtherParticipant = (conv) => {
    if (!currentUser || !conv.participants) return null;
    return conv.participants.find((p) => p._id !== currentUser.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
      {/* HEADER */}
      <div className="bg-[#f44336] text-white p-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2">
          {activeConversation ? (
            <button onClick={() => setActiveConversation(null)} className="hover:bg-red-600 p-1.5 rounded-full transition-colors">
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="p-1.5">
              <MessageSquare size={18} />
            </div>
          )}
          <h3 className="font-bold text-[14px]">
            {activeConversation 
              ? getOtherParticipant(activeConversation)?.username || 'Trò chuyện' 
              : 'Tin nhắn'}
          </h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-red-600 p-1.5 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      {loadingConfig && (
        <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#f44336]" size={30} />
        </div>
      )}

      {/* BODY */}
      <div className="flex-1 overflow-hidden relative bg-[#f8f9fa]">
        
        {/* VIEW 1: CONVERSATION LIST */}
        <div className={`absolute inset-0 transition-transform duration-300 flex flex-col bg-white ${activeConversation ? '-translate-x-full' : 'translate-x-0'}`}>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-gray-400 space-y-3">
                <MessageSquare size={40} className="opacity-40" />
                <p className="text-[13px] text-center font-medium">Chưa có tin nhắn nào. Gợi ý bạn bè dưới đây:</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  if (!other) return null;
                  return (
                    <div
                      key={conv._id}
                      onClick={() => handleSelectConversation(conv)}
                      className="flex items-center gap-3 p-3 hover:bg-[#fafafa] cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                        {other.avatar ? (
                          <img src={other.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-[14px] font-bold text-gray-900 truncate">{other.username}</h4>
                        <p className="text-[12px] text-gray-500 truncate mt-0.5">
                          {conv.lastMessage?.text || 'Bắt đầu cuộc trò chuyện...'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* SUGGESTED USERS LIST */}
            {suggestedUsers.length > 0 && (
              <div className="mt-4 pb-4">
                <h4 className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Gợi ý kết nối
                </h4>
                <div className="divide-y divide-gray-50">
                  {suggestedUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('openChat', { detail: { userId: user._id } }));
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-[#fafafa] cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-[13px] font-bold text-gray-900 truncate">{user.username}</h4>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">Mạng lưới The Wanderer</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VIEW 2: ACTIVE CHAT */}
        <div className={`absolute inset-0 transition-transform duration-300 flex flex-col ${activeConversation ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, index) => {
              const isMe = msg.sender?._id === currentUser?.id;
              return (
                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <img 
                      src={getOtherParticipant(activeConversation)?.avatar || 'https://via.placeholder.com/150'} 
                      className="w-6 h-6 rounded-full mr-2 self-end object-cover border border-gray-200" 
                      alt="avatar" 
                    />
                  )}
                  <div
                    className={`max-w-[75%] px-3.5 py-2 text-[13px] font-medium leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-[#f44336] text-white rounded-2xl rounded-br-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Aa"
                className="flex-1 bg-[#f4f4f5] border-transparent rounded-full px-4 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2 text-[#f44336] hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
