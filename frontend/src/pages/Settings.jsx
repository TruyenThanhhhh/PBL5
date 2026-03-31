import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, Lock, Palette, Bell, LogOut, 
  Camera, Edit2, CheckCircle, Clock, AlertCircle
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('creator'); // Tạm mở sẵn tab Creator cho dễ test
  const [requestStatus, setRequestStatus] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const status = localStorage.getItem('roleRequestStatus') || 'none';
    setRequestStatus(status);
  }, []);

  const handleRequestPoster = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/request-poster', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // 🛡️ Bắt lỗi 404 (Thiếu Route) cực kỳ chặt chẽ
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          setRequestStatus('pending');
          localStorage.setItem('roleRequestStatus', 'pending');
          setMessage('Your request has been sent to the Admin successfully!');
        } else {
          setMessage(data.message || 'Failed to send request.');
        }
      } else {
        // Nếu backend trả về HTML thay vì JSON -> Chắc chắn 100% thiếu Route hoặc Middleware bị lỗi
        setMessage('Lỗi Backend: Không tìm thấy Route /request-poster (Lỗi 404). Hãy kiểm tra file userRoutes.js!');
      }
    } catch (error) {
      console.error(error);
      setMessage('Network error. Không kết nối được với server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 pb-12">
      {/* NAVBAR */}
      <header className="flex items-center justify-between py-3 px-6 bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-8 w-1/4">
          <button onClick={() => navigate('/dashboard')} className="text-[#f44336] font-extrabold text-xl tracking-tight">
            The Wanderer
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-bold text-gray-500">
            <button onClick={() => navigate('/dashboard')} className="hover:text-gray-900 transition-colors py-4">Dashboard</button>
            <button className="hover:text-gray-900 transition-colors py-4">Explore</button>
            <button className="hover:text-gray-900 transition-colors py-4">Community</button>
          </nav>
        </div>
        <div className="flex items-center justify-end gap-5 w-1/4">
          <button className="text-gray-500 hover:text-gray-900 relative">
            <Bell size={22} strokeWidth={2} />
          </button>
          <button onClick={() => navigate('/profile')} className="block cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
              className="w-8 h-8 rounded-full border border-gray-200 object-cover"
              alt="Profile"
            />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-10 flex gap-8 items-start">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-[240px] flex-shrink-0 sticky top-[88px]">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900">Settings</h1>
            <p className="text-[12px] font-medium text-gray-500">Manage your account experience</p>
          </div>

          <nav className="space-y-1 text-[13px] font-bold text-gray-600 mb-8">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'profile' ? 'bg-white text-[#f44336] shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}
            >
              <User size={18} strokeWidth={2.5} /> Profile
            </button>
            <button 
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'account' ? 'bg-white text-[#f44336] shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}
            >
              <Shield size={18} strokeWidth={2.5} /> Account Security
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'privacy' ? 'bg-white text-[#f44336] shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}
            >
              <Lock size={18} strokeWidth={2.5} /> Privacy
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'appearance' ? 'bg-white text-[#f44336] shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}
            >
              <Palette size={18} strokeWidth={2.5} /> Appearance
            </button>

            {/* TAB XIN LÊN QUYỀN POSTER */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button 
                onClick={() => setActiveTab('creator')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'creator' ? 'bg-red-50 text-[#f44336]' : 'hover:bg-white text-gray-700'}`}
              >
                <div className="flex items-center gap-3">
                  <Camera size={18} strokeWidth={2.5} /> Creator Program
                </div>
                {requestStatus === 'pending' && <span className="w-2 h-2 rounded-full bg-yellow-400"></span>}
                {requestStatus === 'approved' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
              </button>
            </div>
          </nav>

          <div className="border-t border-gray-200 pt-6">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-[#f44336] hover:bg-red-50 w-full rounded-lg transition-colors">
              <LogOut size={18} strokeWidth={2.5} /> Logout
            </button>
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <section className="flex-1 max-w-[700px]">
          
          {/* TAB PROFILE */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-6">
                <h2 className="text-xl font-black text-gray-900">Profile</h2>
                <p className="text-[13px] text-gray-500 font-medium">Update your digital identity and public presence.</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="relative mb-16">
                  <div className="h-32 bg-[#2a3042] rounded-xl flex items-end justify-end p-4">
                    <button className="bg-white text-gray-700 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-50">
                      <Camera size={14} /> Edit Cover
                    </button>
                  </div>
                  <div className="absolute -bottom-10 left-6 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                      className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-sm"
                      alt="Avatar"
                    />
                    <button className="absolute bottom-0 right-0 bg-[#f44336] text-white p-1.5 rounded-full border-2 border-white hover:bg-[#d32f2f]">
                      <Edit2 size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Display Name</label>
                    <input type="text" defaultValue="Alex Rivera" className="w-full bg-[#f4f4f5] border-transparent rounded-lg px-4 py-3 text-[13px] font-bold text-gray-800 focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Username</label>
                    <input type="text" defaultValue="@alex_wander" className="w-full bg-[#f4f4f5] border-transparent rounded-lg px-4 py-3 text-[13px] font-bold text-gray-800 focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white" />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Bio</label>
                  <textarea rows="3" defaultValue="Digital nomad exploring the world, one hidden gem at a time. Obsessed with Nordic architecture and street food in Hanoi." className="w-full bg-[#f4f4f5] border-transparent rounded-lg px-4 py-3 text-[13px] font-medium text-gray-700 focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white resize-none"></textarea>
                </div>

                <div className="flex justify-end">
                  <button className="bg-[#f44336] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#e53935] shadow-md shadow-red-500/20 transition-all">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB CREATOR PROGRAM */}
          {activeTab === 'creator' && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-6">
                <h2 className="text-xl font-black text-gray-900">Creator Program</h2>
                <p className="text-[13px] text-gray-500 font-medium">Request permission to post your own travel journals.</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                {requestStatus === 'none' && (
                  <>
                    <div className="w-16 h-16 bg-red-50 text-[#f44336] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera size={32} strokeWidth={2} />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">Become a Poster</h3>
                    <p className="text-[13px] text-gray-600 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                      Upgrade your account to start sharing your own places, photos, and itineraries with the community. You can also post promoted experiences.
                    </p>
                    
                    {/* Báo lỗi cực kỳ chi tiết ở đây */}
                    {message && (
                      <div className={`mb-6 p-4 rounded-xl text-[13px] font-bold text-left ${message.includes('Lỗi Backend') ? 'bg-red-50 text-[#f44336] border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                        <AlertCircle className="inline-block mr-2" size={16} />
                        {message}
                      </div>
                    )}
                    
                    <button 
                      onClick={handleRequestPoster}
                      disabled={isLoading}
                      className="bg-[#f44336] text-white text-[14px] font-bold px-8 py-3 rounded-full hover:bg-[#e53935] shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
                    >
                      {isLoading ? 'Sending Request...' : 'Send Request to Admin'}
                    </button>
                  </>
                )}

                {requestStatus === 'pending' && (
                  <>
                    <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock size={32} strokeWidth={2} />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">Application Pending</h3>
                    <p className="text-[13px] text-gray-600 font-medium max-w-md mx-auto leading-relaxed">
                      Your request to become a Poster is currently being reviewed by our administrators. This usually takes 24-48 hours.
                    </p>
                  </>
                )}

                {requestStatus === 'approved' && (
                  <>
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} strokeWidth={2} />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">You are a Poster!</h3>
                    <p className="text-[13px] text-gray-600 font-medium mb-6 max-w-md mx-auto leading-relaxed">
                      Congratulations! You now have full access to create posts, upload photos, and share your journey.
                    </p>
                    <button onClick={() => navigate('/upload')} className="inline-block bg-gray-900 text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-black transition-all">
                      Create Your First Post
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}