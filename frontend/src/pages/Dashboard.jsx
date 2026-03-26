import React from 'react';
import { 
  Search, Bell, Home, TrendingUp, Utensils, Plane, 
  Bed, Compass, Bookmark, ChevronUp, ChevronDown, 
  MapPin, MessageSquare, Share2, Map
} from 'lucide-react';

export default function Dashboard() {
  // Hàm xử lý chuyển trang khi click vào bài viết
  const handlePostClick = () => {
    window.location.href = '/post-detail';
  };

  // Hàm chặn chuyển trang khi click vào các nút tương tác (như upvote, share...)
  const handleActionClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-gray-900">
      {/* NAVBAR */}
      <header className="flex items-center justify-between py-3 px-6 bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-8 w-1/3">
          <a href="/" className="text-[#f44336] font-extrabold text-xl tracking-tight">
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

        <div className="flex items-center justify-end gap-6 w-1/3">
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-bold text-gray-500">
            <a href="/dashboard" className="text-[#f44336] border-b-2 border-[#f44336] pb-1">Home</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Explore</a>
          </nav>
          
          <a href="/upload" className="bg-[#f44336] text-white text-[13px] font-bold py-2 px-5 rounded-full hover:bg-[#e53935] transition-colors shadow-sm block text-center">
            Create Post
          </a>
          
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-gray-900 relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#f44336] rounded-full border border-white"></span>
            </button>
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
        
        {/* SIDEBAR */}
        <aside className="w-[220px] hidden md:block flex-shrink-0">
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-1">Explore</h2>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Your Daily Feed</p>
          </div>

          <nav className="space-y-1 text-[13px] font-bold text-gray-500">
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-[#f44336] rounded-xl mb-2">
              <Home size={18} strokeWidth={2.5} /> Home
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <TrendingUp size={18} strokeWidth={2.5} /> Popular
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <Utensils size={18} strokeWidth={2.5} /> Food
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <Plane size={18} strokeWidth={2.5} /> Travel
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <Bed size={18} strokeWidth={2.5} /> Hotels
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <Compass size={18} strokeWidth={2.5} /> Experiences
            </a>
            
            <div className="pt-6 mt-6 border-t border-gray-100">
              <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
                <Bookmark size={18} strokeWidth={2.5} /> Saved Posts
              </a>
            </div>
          </nav>
        </aside>

        {/* FEED CONTENT */}
        <section className="flex-1 max-w-3xl">
          <div className="flex flex-wrap gap-2 mb-8">
            <button className="px-4 py-1.5 bg-[#40e0d0] text-teal-900 text-[11px] font-black tracking-widest uppercase rounded-full">Hiking</button>
            <button className="px-4 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 text-[11px] font-black tracking-widest uppercase rounded-full transition-colors">Local Eats</button>
            <button className="px-4 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 text-[11px] font-black tracking-widest uppercase rounded-full transition-colors">Photography</button>
            <button className="px-4 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 text-[11px] font-black tracking-widest uppercase rounded-full transition-colors">Hidden Gems</button>
            <button className="px-4 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 text-[11px] font-black tracking-widest uppercase rounded-full transition-colors">Backpacking</button>
          </div>

          {/* POST 1 - Toàn bộ thẻ div có thể click */}
          <div 
            onClick={handlePostClick}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 mb-6 flex gap-4 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 flex flex-col items-center pt-1 text-gray-400">
              <button onClick={handleActionClick} className="hover:text-[#f44336] p-1"><ChevronUp size={24} /></button>
              <span className="text-[13px] font-bold text-gray-700 my-1">1.2k</span>
              <button onClick={handleActionClick} className="hover:text-[#f44336] p-1"><ChevronDown size={24} /></button>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <a href="/profile" onClick={handleActionClick}><img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" alt="User" className="w-10 h-10 rounded-full object-cover" /></a>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-gray-900 leading-tight group-hover:text-[#f44336] transition-colors">
                      The Sapphire Lagoon at Midnight
                    </h3>
                    <p className="text-[12px] font-bold text-[#00897b] flex items-center gap-1 mt-0.5">
                      <MapPin size={12} strokeWidth={3} /> Vanuatu, South Pacific
                    </p>
                  </div>
                </div>
                <button onClick={handleActionClick} className="text-gray-400 hover:text-gray-600">
                  <Bookmark size={20} />
                </button>
              </div>

              <div className="relative mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=800&q=80" 
                  alt="Lagoon" 
                  className="w-full h-[300px] object-cover rounded-xl group-hover:opacity-95 transition-opacity"
                />
                <div className="absolute top-3 left-3 bg-[#b2ebf2] text-[#00838f] text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full">
                  HIDDEN GEM
                </div>
              </div>

              <p className="text-[13px] text-gray-600 leading-relaxed font-medium mb-4">
                Tucked away beneath the canopy of the Efate rainforest lies a geological wonder that defies logic. The Sapphire Lagoon isn't just blue—it's an bioluminescent indigo...
              </p>

              <div className="flex items-center gap-6 text-[12px] font-bold text-gray-500">
                <button onClick={handleActionClick} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                  <Map size={16} strokeWidth={2.5} /> Map
                </button>
                <button onClick={handleActionClick} className="flex items-center gap-1.5 hover:text-[#f44336] transition-colors">
                  <MessageSquare size={16} strokeWidth={2.5} /> 24 Comments
                </button>
                <button onClick={handleActionClick} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                  <Share2 size={16} strokeWidth={2.5} /> Share
                </button>
              </div>
            </div>
          </div>

          {/* POST 2 - Toàn bộ thẻ div có thể click */}
          <div 
            onClick={handlePostClick}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex gap-4 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 flex flex-col items-center pt-1 text-[#f44336]">
              <button onClick={handleActionClick} className="p-1"><ChevronUp size={24} strokeWidth={3} /></button>
              <span className="text-[13px] font-bold my-1">856</span>
              <button onClick={handleActionClick} className="text-gray-400 hover:text-[#f44336] p-1"><ChevronDown size={24} /></button>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <a href="/profile" onClick={handleActionClick}><img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="User" className="w-10 h-10 rounded-full object-cover" /></a>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-gray-900 leading-tight group-hover:text-[#f44336] transition-colors">The Best Ramen in Kyoto</h3>
                    <p className="text-[12px] font-bold text-[#00897b] flex items-center gap-1 mt-0.5">
                      <MapPin size={12} strokeWidth={3} /> Kyoto, Japan
                    </p>
                  </div>
                </div>
                <button onClick={handleActionClick} className="text-[#f44336]">
                  <Bookmark size={20} fill="currentColor" />
                </button>
              </div>

              <div className="relative mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=800&q=80" 
                  alt="Ramen" 
                  className="w-full h-[300px] object-cover rounded-xl group-hover:opacity-95 transition-opacity"
                />
              </div>

              <p className="text-[13px] text-gray-600 leading-relaxed font-medium mb-4">
                Don't let the queue intimidate you. This 8-seat stall in Gion has the richest broth I've ever tasted. Ask for the spicy miso addition—it changes everything. 🍜
              </p>

              <div className="flex items-center gap-6 text-[12px] font-bold text-gray-500">
                <button onClick={handleActionClick} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                  <Map size={16} strokeWidth={2.5} /> Map
                </button>
                <button onClick={handleActionClick} className="flex items-center gap-1.5 hover:text-[#f44336] transition-colors">
                  <MessageSquare size={16} strokeWidth={2.5} /> 48 Comments
                </button>
                <button onClick={handleActionClick} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                  <Share2 size={16} strokeWidth={2.5} /> Share
                </button>
              </div>
            </div>
          </div>
          
        </section>
      </main>
    </div>
  );
}