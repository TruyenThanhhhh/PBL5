import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserPlus, UserCheck, X, Check, Search, ArrowLeft, MoreHorizontal, MessageSquare, Loader2 } from 'lucide-react';

const getAvatarUrl = (url, name) => {
  return url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff&size=200`;
};

export default function Friends() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'friends', 'suggestions'
  const [currentUser, setCurrentUser] = useState(null);
  
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Lấy userId hiện tại
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) {
      navigate('/login');
      return;
    }
    setCurrentUser({ id: userId });
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchFriendRequests(),
      fetchFriendsList(),
      fetchSuggestions()
    ]);
    setIsLoading(false);
  };

  const fetchFriendRequests = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriendRequests(data.friendRequests || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFriendsList = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/follow-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriendsList(data.friends || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSuggestions = async () => {
    const token = localStorage.getItem('token');
    try {
      // Tìm tất cả user, sau đó Frontend sẽ lọc bớt bạn bè và những người đã gửi yêu cầu
      const res = await fetch(`http://localhost:5000/api/users/search`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Actions
  const handleAcceptRequest = async (senderId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/users/accept-friend/${senderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Remove from requests, add to friends
        const acceptedUser = friendRequests.find(u => u._id === senderId);
        setFriendRequests(prev => prev.filter(u => u._id !== senderId));
        if (acceptedUser) setFriendsList(prev => [...prev, acceptedUser]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejectRequest = async (senderId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/users/unfriend/${senderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFriendRequests(prev => prev.filter(u => u._id !== senderId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUnfriend = async (targetId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy kết bạn?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/users/unfriend/${targetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFriendsList(prev => prev.filter(u => u._id !== targetId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendRequest = async (targetId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/users/friend-request/${targetId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Optionally update UI to show "Sent" state
        fetchSuggestions();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(u => {
    // Không phải là bạn, không nằm trong list request, và chưa được gửi request
    const isFriend = friendsList.some(f => f._id === u._id);
    const hasRequestedMe = friendRequests.some(f => f._id === u._id);
    const iRequestedThem = u.friendRequests?.includes(currentUser?.id);
    return !isFriend && !hasRequestedMe && !iRequestedThem;
  });

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
      {/* Header (Tương tự Dashboard) */}
      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm shrink-0">
        <div className="w-1/4">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">The Wanderer</Link>
        </div>
        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500">
          <Link to="/dashboard" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">Trang chủ</Link>
          <Link to="/explore" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">Khám phá</Link>
          <Link to="/community" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">Cộng đồng</Link>
          <Link to="/friends" className="text-[#f44336] border-b-[3px] border-[#f44336] h-[72px] flex items-center">Bạn bè</Link>
        </nav>
        <div className="w-1/4 flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={() => navigate('/profile')} className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 hover:opacity-90 transition-opacity" title="Hồ sơ">
            <img 
              src={getAvatarUrl(localStorage.getItem('avatar'), localStorage.getItem('username'))} 
              className="h-full w-full object-cover object-center"
              alt="Profile"
            />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-[360px] bg-white shadow-sm border-r border-gray-200 h-[calc(100vh-72px)] sticky top-[72px] flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h1 className="text-[24px] font-black text-gray-900">Bạn bè</h1>
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
            <button 
              onClick={() => setActiveTab('requests')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors font-bold text-[15px] ${activeTab === 'requests' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${activeTab === 'requests' ? 'bg-[#f44336] text-white' : 'bg-gray-200 text-gray-600'}`}>
                <UserCheck size={20} />
              </div>
              <span className="flex-1 text-left">Lời mời kết bạn</span>
              {friendRequests.length > 0 && <span className="text-[#f44336]">{friendRequests.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('suggestions')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors font-bold text-[15px] mt-1 ${activeTab === 'suggestions' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${activeTab === 'suggestions' ? 'bg-[#f44336] text-white' : 'bg-gray-200 text-gray-600'}`}>
                <UserPlus size={20} />
              </div>
              <span className="flex-1 text-left">Gợi ý</span>
            </button>
            <button 
              onClick={() => setActiveTab('friends')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors font-bold text-[15px] mt-1 ${activeTab === 'friends' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${activeTab === 'friends' ? 'bg-[#f44336] text-white' : 'bg-gray-200 text-gray-600'}`}>
                <Users size={20} />
              </div>
              <span className="flex-1 text-left">Tất cả bạn bè</span>
              {friendsList.length > 0 && <span className="text-gray-500 text-[13px]">{friendsList.length}</span>}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto bg-[#f0f2f5] h-[calc(100vh-72px)]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-[#f44336]" size={40} />
            </div>
          ) : (
            <div className="max-w-[1000px] mx-auto">
              
              {/* Lời mời kết bạn */}
              {activeTab === 'requests' && (
                <>
                  <h2 className="text-[20px] font-black text-gray-900 mb-6 flex items-center gap-2">
                    Lời mời kết bạn <span className="text-gray-500 text-[16px]">({friendRequests.length})</span>
                  </h2>
                  {friendRequests.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">Không có lời mời kết bạn nào.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {friendRequests.map(user => (
                        <div key={user._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group">
                          <div className="aspect-square bg-gray-100 cursor-pointer relative overflow-hidden" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>
                            <img src={getAvatarUrl(user.avatar, user.username)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="text-white font-bold text-[13px] bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Xem trang cá nhân</span>
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <h3 className="font-extrabold text-[16px] text-gray-900 truncate mb-4 cursor-pointer hover:text-[#f44336] transition-colors" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>{user.username}</h3>
                            <div className="space-y-2 mt-auto">
                              <button onClick={() => handleAcceptRequest(user._id)} className="w-full bg-[#f44336] hover:bg-red-600 text-white font-bold text-[14px] py-2 rounded-xl transition-colors shadow-md shadow-red-500/20">Xác nhận</button>
                              <button onClick={() => handleRejectRequest(user._id)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-[14px] py-2 rounded-xl transition-colors">Xóa</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Gợi ý kết bạn */}
              {activeTab === 'suggestions' && (
                <>
                  <h2 className="text-[20px] font-black text-gray-900 mb-6">Những người bạn có thể biết</h2>
                  {filteredSuggestions.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">Không có gợi ý nào.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredSuggestions.slice(0, 20).map(user => (
                        <div key={user._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group">
                          <div className="aspect-square bg-gray-100 cursor-pointer relative overflow-hidden" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>
                            <img src={getAvatarUrl(user.avatar, user.username)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="text-white font-bold text-[13px] bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Xem trang cá nhân</span>
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <h3 className="font-extrabold text-[16px] text-gray-900 truncate mb-4 cursor-pointer hover:text-[#f44336] transition-colors" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>{user.username}</h3>
                            <button onClick={() => handleSendRequest(user._id)} className="w-full mt-auto bg-[#e8f3ff] hover:bg-[#d0e6ff] text-[#0866ff] font-bold text-[14px] py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                               <UserPlus size={16} /> Thêm bạn bè
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Tất cả bạn bè */}
              {activeTab === 'friends' && (
                <>
                  <h2 className="text-[20px] font-black text-gray-900 mb-6">Tất cả bạn bè</h2>
                  {friendsList.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">Bạn chưa có người bạn nào.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {friendsList.map(user => (
                        <div key={user._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group">
                          <div className="aspect-square bg-gray-100 cursor-pointer relative overflow-hidden" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>
                            <img src={getAvatarUrl(user.avatar, user.username)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="text-white font-bold text-[13px] bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Xem trang cá nhân</span>
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <h3 className="font-extrabold text-[16px] text-gray-900 truncate mb-4 cursor-pointer hover:text-[#f44336] transition-colors" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>{user.username}</h3>
                            <div className="space-y-2 mt-auto">
                              <button onClick={() => window.dispatchEvent(new CustomEvent('openChat', { detail: { targetUserId: user._id } }))} className="w-full bg-[#f4f4f5] hover:bg-gray-200 text-gray-900 font-bold text-[14px] py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"><MessageSquare size={16}/> Nhắn tin</button>
                              <button onClick={() => handleUnfriend(user._id)} className="w-full text-red-500 hover:bg-red-50 font-bold text-[13px] py-2 rounded-xl transition-colors">Hủy kết bạn</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
