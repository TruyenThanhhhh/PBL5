import React, { useState } from 'react';
import { 
  Search, Bell, Home, TrendingUp, Utensils, Plane, 
  Bed, Compass, Bookmark, MapPin, Star, CalendarPlus, 
  MessageSquare, ArrowUp, ArrowDown, Map, Share2, CornerDownRight, Flag, ChevronDown
} from 'lucide-react';

export default function PostDetail() {
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [votes, setVotes] = useState({ 'c1': { count: 42, userVote: null }, 'c2': { count: 12, userVote: null } });
  const [savedPosts, setSavedPosts] = useState(false);
  const [sortMethod, setSortMethod] = useState('Top');

  const showToast = (type, message) => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast({ open: false, message: '', type: 'info' }), 3000);
  };

  const handleVote = (commentId, type) => {
    setVotes(prev => {
      const current = prev[commentId];
      if (current.userVote === type) {
        // Hủy vote
        return { ...prev, [commentId]: { count: type === 'up' ? current.count - 1 : current.count + 1, userVote: null } };
      }
      
      let newCount = current.count;
      if (type === 'up') newCount += current.userVote === 'down' ? 2 : 1;
      if (type === 'down') newCount -= current.userVote === 'up' ? 2 : 1;
      
      return { ...prev, [commentId]: { count: newCount, userVote: type } };
    });
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-gray-900 pb-16 relative">
      {/* MOCK TOAST NOTIFICATION */}
      {toast.open && (
        <div className={`fixed bottom-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 border-l-4 ${toast.type === 'error' ? 'bg-white border-[#f44336] text-gray-800' : 'bg-white border-green-500 text-gray-800'}`}>
          <p className="text-[14px] font-bold max-w-[300px] leading-tight">{toast.message}</p>
        </div>
      )}

      {/* NAVBAR */}
      <header className="flex items-center justify-between py-3 px-6 bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-8 w-1/4">
          <a href="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">
            The Wanderer
          </a>
        </div>

        <div className="flex-1 max-w-2xl relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search destinations..." 
            className="w-full pl-11 pr-4 py-2.5 bg-[#f4f4f5] border-transparent rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 font-medium placeholder-gray-400 transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-6 w-1/4">
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-bold text-gray-500">
            <button onClick={() => showToast('info', 'Trang Explore đang được phát triển.')} className="text-[#f44336] border-b-2 border-[#f44336] pb-1">Explore</button>
            <button onClick={() => showToast('info', 'Trang Journals đang được phát triển.')} className="hover:text-gray-900 transition-colors">Journals</button>
            <button onClick={() => showToast('info', 'Trang Community đang được phát triển.')} className="hover:text-gray-900 transition-colors">Community</button>
          </nav>
          
          <div className="flex items-center gap-4">
            <button onClick={() => showToast('info', 'Không có thông báo mới.')} className="text-gray-500 hover:text-gray-900 relative">
              <Bell size={20} />
            </button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} className="text-gray-500 hover:text-gray-900"><MessageSquare size={20} /></button>
            <a href="/profile" className="block cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                className="w-8 h-8 rounded-full border border-gray-200 object-cover hover:ring-2 hover:ring-[#f44336]/50 transition-all"
                alt="Profile"
              />
            </a>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-[1400px] mx-auto px-6 py-6 flex gap-8">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-[220px] hidden md:block flex-shrink-0">
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-1">Explore</h2>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Your Daily Feed</p>
          </div>

          <nav className="space-y-1 text-[13px] font-bold text-gray-500">
            <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-[#f44336] rounded-xl mb-2">
              <Home size={18} strokeWidth={2.5} /> Home
            </a>
            <button onClick={() => showToast('info', 'Trang Popular đang được phát triển.')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <TrendingUp size={18} strokeWidth={2.5} /> Popular
            </button>
            <button onClick={() => showToast('info', 'Trang Food đang được phát triển.')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <Utensils size={18} strokeWidth={2.5} /> Food
            </button>
            <button onClick={() => showToast('info', 'Trang Travel đang được phát triển.')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <Plane size={18} strokeWidth={2.5} /> Travel
            </button>
            <button onClick={() => showToast('info', 'Trang Hotels đang được phát triển.')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <Bed size={18} strokeWidth={2.5} /> Hotels
            </button>
            <button onClick={() => showToast('info', 'Trang Experiences đang được phát triển.')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <Compass size={18} strokeWidth={2.5} /> Experiences
            </button>
            
            <div className="pt-6 mt-6 border-t border-gray-100">
              <button onClick={() => {
                setSavedPosts(!savedPosts);
                showToast('info', !savedPosts ? 'Đã chuyển sang mục các bài viết đã lưu.' : 'Quay lại mục mặc định.');
              }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${savedPosts ? 'bg-red-50 text-[#f44336]' : 'hover:bg-gray-50 hover:text-gray-900'}`}>
                <Bookmark size={18} strokeWidth={2.5} /> Saved Posts
              </button>
            </div>
          </nav>
        </aside>

        {/* FEED CONTENT (POST DETAIL) */}
        <section className="flex-1 max-w-3xl pt-2">
          
          {/* Tags & Rating */}
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[#b2ebf2] text-[#00838f] text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full">
              HIDDEN GEM
            </span>
            <div className="flex items-center gap-1 text-[#f44336]">
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
            </div>
            <span className="text-[11px] font-bold text-gray-500">(128 Reviews)</span>
          </div>

          {/* Title & Actions */}
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-4">
            The Sapphire Lagoon at Midnight
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 text-[13px] font-bold text-gray-600">
              <div className="flex items-center gap-1.5 text-gray-800">
                <MapPin size={16} className="text-[#f44336]" /> Vanuatu, South Pacific
              </div>
              <span className="text-gray-300">/</span>
              <div className="flex items-center gap-2">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=40&q=80" className="w-6 h-6 rounded-full object-cover" alt="Author" />
                Elena Wild
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} className="flex items-center gap-2 bg-gray-100 text-gray-700 text-[13px] font-bold px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors shadow-sm">
                <MessageSquare size={16} /> Nhắn tin
              </button>
              <button onClick={() => showToast('success', 'Đã thêm The Sapphire Lagoon vào Lịch trình du lịch của bạn!')} className="flex items-center gap-2 bg-[#f44336] text-white text-[13px] font-bold px-5 py-2.5 rounded-xl hover:bg-[#e53935] transition-colors shadow-sm">
                <CalendarPlus size={16} /> Add to travel plan
              </button>
            </div>
          </div>

          {/* Featured Image */}
          <div className="w-full h-[450px] md:h-[550px] rounded-3xl overflow-hidden mb-8">
            <img 
              src="https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=1200&q=80" 
              alt="Lagoon" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Article Content */}
          <div className="text-[15px] text-gray-700 leading-relaxed font-medium space-y-6 mb-10">
            <p>
              Tucked away beneath the canopy of the Efate rainforest lies a geological wonder that defies logic. The Sapphire Lagoon isn't just blue—it's an bioluminescent indigo that seems to glow from within, especially during the new moon cycles.
            </p>
            <p>
              Reaching the lagoon requires a 45-minute trek through terrain that transitions from volcanic rock to dense fern-covered paths. The reward is a natural amphitheater of limestone cliffs and spring-fed waters that maintain a constant, refreshing temperature year-round.
            </p>
          </div>

          {/* Insider Tips Box */}
          <div className="bg-[#fafafa] border border-gray-100 p-6 rounded-2xl mb-10">
            <h3 className="text-[14px] font-extrabold text-gray-900 mb-4">Insider Tips</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 text-[14px] text-gray-700 font-medium">
                <div className="mt-1 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-[#f44336]">
                  <div className="w-2 h-2 bg-[#f44336] rounded-full"></div>
                </div>
                Visit between 2:00 PM and 4:00 PM for the most dramatic lighting.
              </li>
              <li className="flex gap-3 text-[14px] text-gray-700 font-medium">
                <div className="mt-1 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-[#f44336]">
                  <div className="w-2 h-2 bg-[#f44336] rounded-full"></div>
                </div>
                Local guides at the trailhead offer biodegradable bug spray.
              </li>
            </ul>
          </div>

          {/* Location Details */}
          <div className="mb-12">
            <h3 className="text-xl font-black text-gray-900 mb-4">Location Details</h3>
            <div className="bg-[#fce4e4] h-[250px] rounded-2xl relative overflow-hidden flex flex-col justify-between p-4">
              {/* Fake Map Background */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')] opacity-30"></div>
              
              {/* Map Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <div className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <MapPin size={20} className="text-[#f44336]" fill="#fce4e4" />
                </div>
              </div>

              <div className="mt-auto relative z-10 bg-white rounded-xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Coordinates</p>
                  <p className="text-[13px] font-extrabold text-gray-900">17.7333° S, 168.3273° E</p>
                </div>
                <button onClick={() => showToast('success', 'Mở Google Maps cho tọa độ: 17.7333° S, 168.3273° E')} className="text-[12px] font-bold text-[#00897b] hover:text-[#00796b]">Open in Maps</button>
              </div>
            </div>
          </div>

          {/* Discussion Section */}
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900">Discussion (24)</h3>
            <div 
              className="flex items-center gap-1 text-[12px] font-bold text-gray-500 cursor-pointer hover:text-gray-900"
              onClick={() => {
                const newSort = sortMethod === 'Top' ? 'Newest' : 'Top';
                setSortMethod(newSort);
                showToast('info', `Đã sắp xếp bình luận theo: ${newSort}`);
              }}
            >
              Sort by: {sortMethod} <ChevronDown size={14} />
            </div>
          </div>

          {/* Comment Input */}
          <div className="mb-10">
            <div className="flex gap-4">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=40&q=80" className="w-10 h-10 rounded-full object-cover" alt="User" />
              <div className="flex-1">
                <textarea 
                  className="w-full bg-[#f4f4f5] border-transparent rounded-xl p-4 text-[13px] font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 resize-none h-[100px]"
                  placeholder="Share your experience or ask Elena a question..."
                ></textarea>
                <div className="flex justify-end mt-3">
                  <button className="bg-[#f44336] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#e53935] shadow-sm">
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-8">
            {/* Comment Thread 1 */}
            <div className="flex gap-4">
              {/* Upvote Column */}
              <div className="flex flex-col items-center text-gray-400 w-8">
                <button onClick={() => handleVote('c1', 'up')} className={votes.c1.userVote === 'up' ? 'text-[#f44336]' : 'hover:text-[#f44336]'}><ArrowUp size={20} /></button>
                <span className={`text-[12px] font-bold my-1 ${votes.c1.userVote ? 'text-[#f44336]' : 'text-gray-700'}`}>{votes.c1.count}</span>
                <button onClick={() => handleVote('c1', 'down')} className={votes.c1.userVote === 'down' ? 'text-[#00897b]' : 'hover:text-[#00897b]'}><ArrowDown size={20} /></button>
              </div>

              {/* Comment Body */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-[13px] font-extrabold text-gray-900">Marco Polo</h4>
                  <span className="text-[11px] font-medium text-gray-400">2 hours ago</span>
                </div>
                <p className="text-[13px] text-gray-700 font-medium leading-relaxed mb-3">
                  I was there last July! Pro tip: the water level drops significantly during low tide, making the limestone structures even more visible for photography.
                </p>
                <div className="flex gap-4 text-[11px] font-bold text-gray-500 mb-4">
                  <button className="hover:text-gray-800">Reply</button>
                  <button onClick={() => showToast('success', 'Đã lưu đường dẫn liên kết của bình luận này')} className="hover:text-gray-800">Share</button>
                  <button onClick={() => showToast('error', 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét bình luận này.')} className="hover:text-gray-800">Report</button>
                </div>

                {/* Reply */}
                <div className="pl-4 border-l-2 border-red-100 flex gap-4 mt-4">
                  <div className="flex flex-col items-center text-gray-400 w-6">
                    <button onClick={() => handleVote('c2', 'up')} className={votes.c2.userVote === 'up' ? 'text-[#f44336]' : 'hover:text-[#f44336]'}><ArrowUp size={16} /></button>
                    <span className={`text-[11px] font-bold my-0.5 ${votes.c2.userVote ? 'text-[#f44336]' : 'text-gray-700'}`}>{votes.c2.count}</span>
                    <button onClick={() => handleVote('c2', 'down')} className={votes.c2.userVote === 'down' ? 'text-[#00897b]' : 'hover:text-[#00897b]'}><ArrowDown size={16} /></button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[13px] font-extrabold text-gray-900">Elena Wild</h4>
                      <span className="bg-red-100 text-[#f44336] text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">Author</span>
                      <span className="text-[11px] font-medium text-gray-400">1 hour ago</span>
                    </div>
                    <p className="text-[13px] text-gray-700 font-medium leading-relaxed mb-2">
                      Great point, Marco! I noticed the same thing. The low tide pools are incredible for macro shots of the coral.
                    </p>
                    <div className="flex gap-4 text-[11px] font-bold text-gray-500">
                      <button className="hover:text-gray-800">Reply</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[300px] hidden xl:block flex-shrink-0 space-y-6">
          
          {/* Aesthetic Blocks */}
          <div className="bg-[#fdf4e6] h-[220px] rounded-3xl flex items-center justify-center relative overflow-hidden shadow-sm">
            <div className="w-28 h-28 bg-white rounded-full shadow-lg flex items-center justify-center z-10">
              {/* Leaf Icon Placeholder */}
              <svg className="w-16 h-16 text-green-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z" />
              </svg>
            </div>
          </div>

          <div className="relative h-[220px] rounded-3xl overflow-hidden shadow-sm group cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=500&q=80" 
              alt="Nature" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-lg tracking-wide">+12 Photos</span>
            </div>
          </div>

          {/* Nearby Places */}
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="w-20 h-16 bg-[#e0f2f1] rounded-xl flex items-center justify-center text-[#00897b]">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="text-[13px] font-extrabold text-gray-900">Cascading Rainwater Falls</h4>
                <p className="text-[11px] font-bold text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} /> 1.2 miles away
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-20 h-16 bg-[#f1f8e9] rounded-xl flex items-center justify-center text-green-700">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[13px] font-extrabold text-gray-900">Port Vila Local Market</h4>
                <p className="text-[11px] font-bold text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} /> 4.8 miles away
                </p>
              </div>
            </div>
          </div>

          {/* Curated Itinerary */}
          <div className="bg-[#fff0f0] p-6 rounded-3xl border border-red-50">
            <h3 className="text-[15px] font-black text-[#d32f2f] mb-2">Curated Itinerary</h3>
            <p className="text-[12px] font-medium text-gray-600 mb-5 leading-relaxed">
              This location is part of Elena's "Hidden Gems of Oceania" collection.
            </p>
            <button onClick={() => showToast('info', 'Đang tải lịch trình chi tiết...')} className="w-full bg-white text-[#f44336] text-[13px] font-bold py-2.5 rounded-xl border border-red-100 hover:bg-red-50 transition-colors shadow-sm flex items-center justify-center gap-2">
              <Compass size={16} /> View full itinerary
            </button>
          </div>

          {/* Promoted Experience */}
          <div className="relative h-[220px] rounded-3xl overflow-hidden shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=500&q=80" 
              alt="Experience" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5">
              <p className="text-[9px] font-extrabold text-white/80 uppercase tracking-widest mb-1">Promoted Experience</p>
              <h3 className="text-[16px] font-bold text-white leading-tight mb-4">Private Lagoon Sunset Cruise</h3>
              <button onClick={() => showToast('success', 'Chuyển hướng đến trang đối tác để xác nhận thanh toán $120')} className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[12px] font-bold py-2 rounded-lg hover:bg-white/30 transition-colors">
                Book from $120
              </button>
            </div>
          </div>

        </aside>
      </main>
    </div>
  );
}