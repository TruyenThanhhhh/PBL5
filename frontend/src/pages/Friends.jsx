import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserPlus, UserCheck, X, Check, Search, ArrowLeft, MoreHorizontal, MessageSquare, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const friendsCopy = {
  vi: {
    home: 'Trang chủ',
    explore: 'Khám phá',
    community: 'Cộng đồng',
    friends: 'Bạn bè',
    profile: 'Hồ sơ',
    search: 'Tìm kiếm bạn bè',
    clearSearch: 'Xóa tìm kiếm',
    requests: 'Lời mời kết bạn',
    suggestions: 'Gợi ý',
    allFriends: 'Tất cả bạn bè',
    searchResults: '{t.searchResults}',
    noSearchResults: 'Không tìm thấy người dùng phù hợp.',
    viewProfile: 'Xem trang cá nhân',
    alreadyFriends: 'Đã là bạn bè',
    confirm: 'Xác nhận',
    sent: 'Đã gửi lời mời',
    addFriend: 'Thêm bạn bè',
    noRequests: 'Không có lời mời kết bạn nào.',
    delete: 'Xóa',
    peopleYouMayKnow: 'Những người bạn có thể biết',
    noSuggestions: 'Không có gợi ý nào.',
    noFriends: 'Bạn chưa có người bạn nào.',
    message: 'Nhắn tin',
    unfriend: 'Hủy kết bạn',
    unfriendConfirm: 'Bạn có chắc chắn muốn hủy kết bạn?',
  },
  en: {
    home: 'Home',
    explore: 'Explore',
    community: 'Community',
    friends: 'Friends',
    profile: 'Profile',
    search: 'Search friends',
    clearSearch: 'Clear search',
    requests: 'Friend Requests',
    suggestions: 'Suggestions',
    allFriends: 'All Friends',
    searchResults: 'Search Results',
    noSearchResults: 'No matching users found.',
    viewProfile: 'View profile',
    alreadyFriends: 'Already friends',
    confirm: 'Confirm',
    sent: 'Request sent',
    addFriend: 'Add friend',
    noRequests: 'No friend requests.',
    delete: 'Delete',
    peopleYouMayKnow: 'People you may know',
    noSuggestions: 'No suggestions.',
    noFriends: 'You do not have any friends yet.',
    message: 'Message',
    unfriend: 'Unfriend',
    unfriendConfirm: 'Are you sure you want to unfriend this user?',
  },
};

const getAvatarUrl = (url, name) => {
  return url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff&size=200`;
};

export default function Friends() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = friendsCopy[language] || friendsCopy.vi;
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'friends', 'suggestions'
  const [currentUser, setCurrentUser] = useState(null);
  
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

  useEffect(() => {
    const keyword = searchTerm.trim();
    if (!keyword) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      const token = localStorage.getItem('token');
      setIsSearching(true);
      try {
        const res = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(keyword)}&limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error(error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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
    if (!window.confirm(t.unfriendConfirm)) return;
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
        setSearchResults(prev => prev.map(user => (
          user._id === targetId
            ? { ...user, friendRequests: [...(user.friendRequests || []), currentUser?.id].filter(Boolean) }
            : user
        )));
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

  const getRelationshipStatus = (user) => {
    if (friendsList.some(f => f._id === user._id)) return 'friends';
    if (friendRequests.some(f => f._id === user._id)) return 'requestedMe';
    if (user.friendRequests?.some(id => String(id) === String(currentUser?.id))) return 'pending';
    return 'none';
  };

  const renderSearchAction = (user) => {
    const status = getRelationshipStatus(user);
    if (status === 'friends') {
      return <span className="text-[13px] font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl text-center">{t.alreadyFriends}</span>;
    }
    if (status === 'requestedMe') {
      return (
        <button onClick={() => handleAcceptRequest(user._id)} className="w-full bg-[#f44336] hover:bg-red-600 text-white font-bold text-[14px] py-2 rounded-xl transition-colors">
          Xác nhận
        </button>
      );
    }
    if (status === 'pending') {
      return <span className="text-[13px] font-bold text-[#0866ff] bg-[#e8f3ff] px-3 py-2 rounded-xl text-center">{t.sent}</span>;
    }
    return (
      <button onClick={() => handleSendRequest(user._id)} className="w-full bg-[#e8f3ff] hover:bg-[#d0e6ff] text-[#0866ff] font-bold text-[14px] py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
        <UserPlus size={16} /> {t.addFriend}
      </button>
    );
  };

  const isSearchMode = searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
      {/* Header (Tương tự Dashboard) */}
      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm shrink-0">
        <div className="w-1/4">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">The Wanderer</Link>
        </div>
        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500">
          <Link to="/dashboard" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.home}</Link>
          <Link to="/explore" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.explore}</Link>
          <Link to="/community" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.community}</Link>
          <Link to="/friends" className="text-[#f44336] border-b-[3px] border-[#f44336] h-[72px] flex items-center">{t.friends}</Link>
        </nav>
        <div className="w-1/4 flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={() => navigate('/profile')} className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 hover:opacity-90 transition-opacity" title={t.profile}>
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
            <h1 className="text-[24px] font-black text-gray-900">{t.friends}</h1>
            <div className="mt-4 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.search}
                className="w-full h-11 rounded-xl bg-gray-100 pl-10 pr-10 text-[14px] font-semibold text-gray-800 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-[#f44336]/20"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500"
                  title={t.clearSearch}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
            <button 
              onClick={() => setActiveTab('requests')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors font-bold text-[15px] ${activeTab === 'requests' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${activeTab === 'requests' ? 'bg-[#f44336] text-white' : 'bg-gray-200 text-gray-600'}`}>
                <UserCheck size={20} />
              </div>
              <span className="flex-1 text-left">{t.requests}</span>
              {friendRequests.length > 0 && <span className="text-[#f44336]">{friendRequests.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('suggestions')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors font-bold text-[15px] mt-1 ${activeTab === 'suggestions' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${activeTab === 'suggestions' ? 'bg-[#f44336] text-white' : 'bg-gray-200 text-gray-600'}`}>
                <UserPlus size={20} />
              </div>
              <span className="flex-1 text-left">{t.suggestions}</span>
            </button>
            <button 
              onClick={() => setActiveTab('friends')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors font-bold text-[15px] mt-1 ${activeTab === 'friends' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${activeTab === 'friends' ? 'bg-[#f44336] text-white' : 'bg-gray-200 text-gray-600'}`}>
                <Users size={20} />
              </div>
              <span className="flex-1 text-left">{t.allFriends}</span>
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
              {isSearchMode && (
                <>
                  <h2 className="text-[20px] font-black text-gray-900 mb-6 flex items-center gap-2">
                    {t.searchResults} <span className="text-gray-500 text-[16px]">"{searchTerm.trim()}"</span>
                  </h2>
                  {isSearching ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="animate-spin text-[#f44336]" size={32} />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">{t.noSearchResults}</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {searchResults.map(user => (
                        <div key={user._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group">
                          <div className="aspect-square bg-gray-100 cursor-pointer relative overflow-hidden" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>
                            <img src={getAvatarUrl(user.avatar, user.displayName || user.username)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="text-white font-bold text-[13px] bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">{t.viewProfile}</span>
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <h3 className="font-extrabold text-[16px] text-gray-900 truncate cursor-pointer hover:text-[#f44336] transition-colors" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>{user.displayName || user.username}</h3>
                            {user.displayName && user.displayName !== user.username && <p className="text-[13px] text-gray-500 truncate mb-4">@{user.username}</p>}
                            {(!user.displayName || user.displayName === user.username) && <div className="mb-4" />}
                            <div className="mt-auto">
                              {renderSearchAction(user)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              {/* Lời mời kết bạn */}
              {!isSearchMode && activeTab === 'requests' && (
                <>
                  <h2 className="text-[20px] font-black text-gray-900 mb-6 flex items-center gap-2">
                    {t.requests} <span className="text-gray-500 text-[16px]">({friendRequests.length})</span>
                  </h2>
                  {friendRequests.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">{t.noRequests}</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {friendRequests.map(user => (
                        <div key={user._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group">
                          <div className="aspect-square bg-gray-100 cursor-pointer relative overflow-hidden" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>
                            <img src={getAvatarUrl(user.avatar, user.username)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="text-white font-bold text-[13px] bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">{t.viewProfile}</span>
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <h3 className="font-extrabold text-[16px] text-gray-900 truncate mb-4 cursor-pointer hover:text-[#f44336] transition-colors" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>{user.username}</h3>
                            <div className="space-y-2 mt-auto">
                              <button onClick={() => handleAcceptRequest(user._id)} className="w-full bg-[#f44336] hover:bg-red-600 text-white font-bold text-[14px] py-2 rounded-xl transition-colors shadow-md shadow-red-500/20">{t.confirm}</button>
                              <button onClick={() => handleRejectRequest(user._id)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-[14px] py-2 rounded-xl transition-colors">{t.delete}</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Gợi ý kết bạn */}
              {!isSearchMode && activeTab === 'suggestions' && (
                <>
                  <h2 className="text-[20px] font-black text-gray-900 mb-6">{t.peopleYouMayKnow}</h2>
                  {filteredSuggestions.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">{t.noSuggestions}</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredSuggestions.slice(0, 20).map(user => (
                        <div key={user._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group">
                          <div className="aspect-square bg-gray-100 cursor-pointer relative overflow-hidden" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>
                            <img src={getAvatarUrl(user.avatar, user.username)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="text-white font-bold text-[13px] bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">{t.viewProfile}</span>
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <h3 className="font-extrabold text-[16px] text-gray-900 truncate mb-4 cursor-pointer hover:text-[#f44336] transition-colors" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>{user.username}</h3>
                            <button onClick={() => handleSendRequest(user._id)} className="w-full mt-auto bg-[#e8f3ff] hover:bg-[#d0e6ff] text-[#0866ff] font-bold text-[14px] py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                               <UserPlus size={16} /> {t.addFriend}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Tất cả bạn bè */}
              {!isSearchMode && activeTab === 'friends' && (
                <>
                  <h2 className="text-[20px] font-black text-gray-900 mb-6">{t.allFriends}</h2>
                  {friendsList.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">{t.noFriends}</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {friendsList.map(user => (
                        <div key={user._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group">
                          <div className="aspect-square bg-gray-100 cursor-pointer relative overflow-hidden" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>
                            <img src={getAvatarUrl(user.avatar, user.username)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="text-white font-bold text-[13px] bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">{t.viewProfile}</span>
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <h3 className="font-extrabold text-[16px] text-gray-900 truncate mb-4 cursor-pointer hover:text-[#f44336] transition-colors" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>{user.username}</h3>
                            <div className="space-y-2 mt-auto">
                              <button onClick={() => window.dispatchEvent(new CustomEvent('openChat', { detail: { targetUserId: user._id } }))} className="w-full bg-[#f4f4f5] hover:bg-gray-200 text-gray-900 font-bold text-[14px] py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"><MessageSquare size={16}/> {t.message}</button>
                              <button onClick={() => handleUnfriend(user._id)} className="w-full text-red-500 hover:bg-red-50 font-bold text-[13px] py-2 rounded-xl transition-colors">{t.unfriend}</button>
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
