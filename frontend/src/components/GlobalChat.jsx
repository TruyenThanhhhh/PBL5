import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');
const currentUserId = () => localStorage.getItem('userId');
const authHeader = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

// Hàm chuẩn hóa đường dẫn ảnh
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
};

export default function GlobalChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [chatView, setChatView] = useState('list'); // 'list' | 'conversation'
  const [friends, setFriends] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Lắng nghe sự kiện mở chat từ bất kỳ đâu (Header, Profile...)
  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      if (e.detail && e.detail.userId) {
        setSelectedUser({ _id: e.detail.userId, username: e.detail.username || 'Người dùng' });
        setChatView('conversation');
      } else {
        setChatView('list');
      }
    };
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  // Fetch danh sách bạn bè khi mở tab danh sách
  useEffect(() => {
    if (isOpen && chatView === 'list' && token()) {
      fetch(`${API}/users/profile`, { headers: { Authorization: `Bearer ${token()}` } })
        .then(res => res.json())
        .then(data => {
          // Sửa lỗi: lấy trực tiếp data.friends vì backend trả thẳng object user ra
          if (data && Array.isArray(data.friends)) {
            setFriends(data.friends);
          } else if (data.user && Array.isArray(data.user.friends)) {
            // Dự phòng trường hợp API trả về { user: ... }
            setFriends(data.user.friends);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, chatView]);

  // Lấy lịch sử chat khi chọn 1 user
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!selectedUser || !token()) return;
      setIsLoading(true);
      try {
        // Lấy hoặc tạo Conversation
        const convRes = await fetch(`${API}/messages/conversation`, {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({ targetUserId: selectedUser._id })
        });
        
        if (!convRes.ok) throw new Error('Không thể tải hội thoại');
        const convData = await convRes.json();
        setConversationId(convData._id);

        // Lấy tin nhắn
        const msgRes = await fetch(`${API}/messages/${convData._id}`, {
          headers: { Authorization: `Bearer ${token()}` }
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && chatView === 'conversation') {
      fetchChatHistory();
    }
  }, [isOpen, chatView, selectedUser]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatView]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedUser || !conversationId) return;
    const textToSend = inputMessage;
    
    // Optimistic update
    setMessages(prev => [...prev, { sender: { _id: currentUserId() }, text: textToSend }]);
    setInputMessage('');

    try {
      await fetch(`${API}/messages`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          receiverId: selectedUser._id,
          text: textToSend,
          conversationId: conversationId
        })
      });
    } catch (error) {
      console.error('Lỗi gửi tin nhắn', error);
    }
  };

  const handleNavigateProfile = (userId) => {
    setIsOpen(false);
    navigate('/profile', { state: { targetUserId: userId } });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-6 bottom-6 z-[999] w-[340px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 h-[520px] animate-in slide-in-from-bottom-4 fade-in">
      {/* Header Modal */}
      <div className="bg-[#f44336] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          {chatView === 'conversation' ? (
            <>
              <button onClick={() => setChatView('list')} className="hover:bg-red-600 p-1 rounded-full transition-colors">
                <ArrowLeft size={18} />
              </button>
              <span onClick={() => handleNavigateProfile(selectedUser?._id)} className="font-bold text-[14px] cursor-pointer hover:underline">
                {selectedUser?.displayName || selectedUser?.username || 'Trò chuyện'}
              </span>
            </>
          ) : (
            <>
              <MessageSquare size={18} />
              <span className="font-bold text-[14px]">Danh bạ bạn bè</span>
            </>
          )}
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-red-600 p-1 rounded-full transition-colors"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white flex flex-col">
        {chatView === 'list' ? (
          <div className="p-2 pb-4">
            {friends.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-gray-500">
                Chưa có bạn bè nào. Khám phá và kết bạn ngay!
              </div>
            ) : (
              friends.map(friend => (
                <div key={friend._id} onClick={() => { setSelectedUser(friend); setChatView('conversation'); }} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 overflow-hidden hover:opacity-80">
                    {friend.avatar ? (
                      <img src={getImageUrl(friend.avatar)} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName || friend.username || 'User')}&background=f44336&color=fff`; }} className="w-full h-full object-cover"/>
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] text-gray-900 truncate">{friend.displayName || friend.username}</p>
                    <p className="text-[11px] text-gray-400 font-medium">Bấm để trò chuyện</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full bg-white relative">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#f44336]" /></div>
              ) : (
                <>
                  <div className="text-center text-[11px] text-gray-400 mb-4">Bắt đầu trò chuyện với {selectedUser?.displayName || selectedUser?.username}</div>
                  
                  {messages.map((msg, i) => {
                    const isMe = String(msg.sender?._id || msg.sender) === String(currentUserId());
                    return (
                      <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <div onClick={() => handleNavigateProfile(selectedUser?._id)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 mr-2 self-end mb-1 overflow-hidden cursor-pointer">
                            {selectedUser?.avatar ? (
                               <img src={getImageUrl(selectedUser.avatar)} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.displayName || selectedUser.username || 'User')}&background=f44336&color=fff`; }} className="w-full h-full object-cover"/>
                            ) : (
                               <User size={14} />
                            )}
                          </div>
                        )}
                        <div className={`px-4 py-2 rounded-2xl max-w-[75%] text-[13px] ${isMe ? 'bg-[#f44336] text-white rounded-br-sm' : 'bg-[#f4f4f5] text-gray-900 rounded-bl-sm border border-gray-100'}`}>
                          {msg.text}
                        </div>
                      </div>
                    )
                  })}
                  {messages.length === 0 && (
                     <div className="flex justify-center text-[12px] text-gray-400 mt-4">Hãy nói lời chào 👋</div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            {/* Thanh nhập tin nhắn */}
            <div className="p-3 border-t border-gray-100 bg-white shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Aa"
                  className="w-full bg-[#f4f4f5] rounded-full py-2 pl-4 pr-10 text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f44336] p-1.5 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}