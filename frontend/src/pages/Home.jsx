import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, ArrowRight, Compass, Share2, Users, Globe, AtSign, Share, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-gray-900">
      {/* HEADER */}
      <header className="flex items-center justify-between py-4 px-6 md:px-12 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-[#ff4d4f] font-extrabold text-xl tracking-tight">
            The Wanderer
          </Link>
          <nav className="hidden md:flex gap-6 text-[13px] font-semibold text-gray-500">
            <Link to="/explore" className="text-[#ff4d4f] border-b-2 border-[#ff4d4f] pb-1">Explore Map</Link>
            <Link to="/community" className="hover:text-gray-900 transition-colors">Community</Link>
            <Link to="/dashboard" className="hover:text-gray-900 transition-colors">Categories</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search posts, places, cities..." 
              className="pl-9 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-[13px] w-72 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/20 font-medium placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Link 
              to="/login" 
              className="text-[13px] font-bold text-gray-700 hover:text-[#ff4d4f] px-4 py-2 transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="bg-[#ff4d4f] text-white text-[13px] font-bold py-2 px-6 rounded-full hover:bg-[#e04345] shadow-sm transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="px-6 md:px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-12 max-w-[1400px] mx-auto">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-5xl md:text-[4.5rem] font-black leading-[1.05] tracking-tight">
              Explore the<br />world<br />
              <span className="text-[#ff4d4f]">through people</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-md font-medium">
              Ditch the tourist traps. Connect with a global community sharing hidden gems, authentic stories, and real experiences from every corner of the globe.
            </p>
            <div className="flex gap-4 pt-4">
              <Link to="/explore" className="bg-[#ff4d4f] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-[#ff4d4f]/30 hover:bg-[#e04345] transition-all">
                Explore Map
              </Link>
              <Link to="/community" className="bg-white text-gray-800 font-bold py-3.5 px-8 rounded-xl shadow-md border border-gray-100 hover:bg-gray-50 transition-all">
                Join Community
              </Link>
            </div>
          </div>

          <div className="md:w-1/2 relative">
            <div className="bg-[#e2efeb] rounded-3xl p-8 h-[400px] w-full relative overflow-hidden shadow-inner">
              {/* Map Illustration Placeholder */}
              <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')]"></div>
              
              {/* Fake UI Overlays on map */}
              <div className="absolute top-8 left-8 bg-white rounded-2xl p-3 shadow-lg flex items-center gap-3 animate-bounce z-10">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full" alt="User" />
                <div>
                  <p className="text-xs font-bold">Liam just posted</p>
                  <p className="text-[10px] text-gray-500">Kyoto, Japan</p>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 bg-white rounded-2xl p-4 shadow-lg w-48 z-10">
                <div className="flex items-center gap-1 text-[#ff4d4f] font-bold text-xs mb-1">
                  <Star size={12} fill="currentColor" /> 4.9 Trending
                </div>
                <p className="text-xs text-gray-600 font-medium">"Best ramen in Shinjuku..."</p>
              </div>

              {/* Fake Map Pins */}
              <div className="absolute top-1/3 left-1/2 text-[#ff4d4f]"><MapPin size={24} fill="currentColor" /></div>
              <div className="absolute top-1/2 left-1/3 text-[#ff4d4f]"><MapPin size={20} fill="currentColor" /></div>
              <div className="absolute bottom-1/3 left-2/3 text-[#00897b]"><MapPin size={28} fill="currentColor" /></div>
            </div>
          </div>
        </section>

        {/* TRENDING SECTION */}
        <section className="bg-gray-50 px-6 md:px-12 py-16">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="bg-[#b2ebf2] text-[#00838f] text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">Trending</span>
                <h2 className="text-3xl font-black">Popular this week</h2>
              </div>
              <Link to="/community" className="text-[#00897b] font-bold text-sm flex items-center gap-1 hover:underline">
                View all <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="group relative rounded-2xl overflow-hidden h-[360px] cursor-pointer shadow-md">
                <img src="https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=800&q=80" alt="Bali" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> 4.8
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">Bali, Indonesia</h3>
                  <p className="text-xs text-gray-300 font-medium">1.2k Wanderer's visited</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group relative rounded-2xl overflow-hidden h-[360px] cursor-pointer shadow-md">
                <img src="https://images.unsplash.com/photo-1502602898657-3e90760b628e?auto=format&fit=crop&w=800&q=80" alt="Paris" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> 4.7
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">Paris, France</h3>
                  <p className="text-xs text-gray-300 font-medium">980 active posts</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group relative rounded-2xl overflow-hidden h-[360px] cursor-pointer shadow-md">
                <img src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80" alt="Tokyo" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> 4.9
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">Tokyo, Japan</h3>
                  <p className="text-xs text-gray-300 font-medium">2.4k community pins</p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="group relative rounded-2xl overflow-hidden h-[360px] cursor-pointer shadow-md">
                <img src="https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=800&q=80" alt="Lauterbrunnen" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> 4.9
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">Lauterbrunnen</h3>
                  <p className="text-xs text-gray-300 font-medium">850 hidden gems</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section className="px-6 md:px-12 py-20 max-w-[1400px] mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-12">What are you looking for?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="relative rounded-3xl overflow-hidden aspect-square cursor-pointer group shadow-sm">
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Food" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl tracking-wide">Food</span>
            </div>
            <div className="relative rounded-3xl overflow-hidden aspect-square cursor-pointer group shadow-sm">
              <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Travel" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl tracking-wide">Travel</span>
            </div>
            <div className="relative rounded-3xl overflow-hidden aspect-square cursor-pointer group shadow-sm">
              <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Hotels" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl tracking-wide">Hotels</span>
            </div>
            <div className="relative rounded-3xl overflow-hidden aspect-square cursor-pointer group shadow-sm">
              <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Nightlife" />
              <div className="absolute inset-0 bg-[#0f2027]/80 group-hover:bg-[#0f2027]/90 transition-colors"></div>
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl tracking-wide">Nightlife</span>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="bg-gray-50 px-6 md:px-12 py-24 text-center">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-3xl font-black mb-16">The Journey to Exploration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#ff4d4f] mb-6">
                  <Compass size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold mb-3">Discover</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">Find real, unedited recommendations from people who've actually been there.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#ff4d4f] mb-6">
                  <Share2 size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold mb-3">Share</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">Pin your favorite spots on the map and share your own travel stories.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#ff4d4f] mb-6">
                  <Users size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold mb-3">Connect</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">Join local groups and meet fellow travelers on your next adventure.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="px-6 md:px-12 py-12">
          <div className="max-w-[1200px] mx-auto bg-gradient-to-br from-[#ef4444] to-[#f43f5e] rounded-[40px] p-16 text-center text-white shadow-xl shadow-red-500/20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to wander?</h2>
            <p className="text-white/90 text-lg font-medium max-w-lg mx-auto mb-10">
              Join the fastest growing community of modern explorers and see the world differently.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="bg-white text-[#ef4444] font-bold py-3.5 px-8 rounded-xl hover:bg-gray-50 transition-colors">
                Join the Community
              </Link>
              <Link to="/explore" className="bg-transparent border-2 border-white text-white font-bold py-3.5 px-8 rounded-xl hover:bg-white/10 transition-colors">
                Explore Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="px-6 md:px-12 pt-16 pb-8 border-t border-gray-100 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link to="/" className="text-[#ff4d4f] font-extrabold text-xl tracking-tight block mb-4">
              The Wanderer
            </Link>
            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs">
              Making travel more human, one story at a time. Join the revolution of authentic exploration.
            </p>
          </div>
          
          <div>
            <h4 className="font-extrabold text-[11px] uppercase tracking-widest text-gray-900 mb-6">Platform</h4>
            <ul className="space-y-4 text-xs font-semibold text-gray-500">
              <li><Link to="/explore" className="hover:text-[#ff4d4f]">Explore Map</Link></li>
              <li><Link to="/community" className="hover:text-[#ff4d4f]">Community</Link></li>
              <li><Link to="/dashboard" className="hover:text-[#ff4d4f]">Destinations</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-extrabold text-[11px] uppercase tracking-widest text-gray-900 mb-6">Company</h4>
            <ul className="space-y-4 text-xs font-semibold text-gray-500">
              <li><a href="#" className="hover:text-[#ff4d4f]">About</a></li>
              <li><a href="#" className="hover:text-[#ff4d4f]">Contact Us</a></li>
              <li><a href="#" className="hover:text-[#ff4d4f]">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-extrabold text-[11px] uppercase tracking-widest text-gray-900 mb-6">Legal</h4>
            <ul className="space-y-4 text-xs font-semibold text-gray-500">
              <li><a href="#" className="hover:text-[#ff4d4f]">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#ff4d4f]">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100 gap-4">
          <p className="text-[11px] font-semibold text-gray-400">
            © 2024 The Wanderer. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <Globe size={16} className="cursor-pointer hover:text-gray-900" />
            <AtSign size={16} className="cursor-pointer hover:text-gray-900" />
            <Share size={16} className="cursor-pointer hover:text-gray-900" />
          </div>
        </div>
      </footer>
    </div>
  );
}