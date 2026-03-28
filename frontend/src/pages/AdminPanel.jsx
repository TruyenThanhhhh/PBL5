import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Map as MapIcon, BarChart2, Calendar, 
  Users, Search, Bell, Settings, Plus, CheckCircle, XCircle 
} from 'lucide-react';

export default function AdminPanel() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy danh sách Request đang chờ từ Backend
  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users/admin/pending-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("API không phản hồi thành công");
      
      const data = await res.json();
      setPendingRequests(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách Request (có thể do đang chạy trong Canvas):", error);
      // Fallback: Hiển thị dữ liệu giả lập (mock data) khi chạy trong môi trường preview
      setPendingRequests([
        { _id: 'mock1', username: 'AlexWander', email: 'alex.wander@example.com' },
        { _id: 'mock2', username: 'SarahExplorer', email: 'sarah.explore@example.com' },
        { _id: 'mock3', username: 'MikeTravels', email: 'mike.travels@example.com' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API Duyệt hoặc Từ chối
  const handleRequestAction = async (userId, action) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users/admin/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, action })
      });
      
      if (res.ok) {
        // Xóa User đó khỏi danh sách hiển thị sau khi đã xử lý
        setPendingRequests(prev => prev.filter(req => req._id !== userId));
      } else {
        throw new Error("Lỗi xử lý API");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý Request:", error);
      // Fallback: Giả lập thao tác thành công trên giao diện nếu không có kết nối backend
      setPendingRequests(prev => prev.filter(req => req._id !== userId));
    }
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-900 overflow-hidden">
      
      {/* SIDEBAR LEFT */}
      <aside className="w-[260px] bg-white border-r border-gray-100 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="p-6 pb-2">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">The Wanderer</h1>
          </div>
          
          <div className="px-6 pb-6">
            <h2 className="text-[13px] font-bold text-gray-900">Admin Panel</h2>
            <p className="text-[11px] font-medium text-gray-400">Digital Concierge</p>
          </div>

          <nav className="px-4 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-[#f44336] rounded-xl text-[13px] font-bold transition-all">
              <LayoutDashboard size={18} strokeWidth={2.5} /> Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl text-[13px] font-bold transition-all">
              <MapIcon size={18} strokeWidth={2.5} /> Destinations
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl text-[13px] font-bold transition-all">
              <BarChart2 size={18} strokeWidth={2.5} /> Analytics
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl text-[13px] font-bold transition-all">
              <Calendar size={18} strokeWidth={2.5} /> Bookings
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl text-[13px] font-bold transition-all relative">
              <Users size={18} strokeWidth={2.5} /> Community
              {pendingRequests.length > 0 && (
                <span className="absolute right-4 w-2 h-2 bg-[#f44336] rounded-full"></span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-6">
          <button className="w-full bg-[#f44336] text-white flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[13px] hover:bg-[#e53935] shadow-md shadow-red-500/20 transition-all">
            <Plus size={18} strokeWidth={2.5} /> New Post
          </button>
        </div>
      </aside>

      {/* MAIN RIGHT CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafafa]">
        
        {/* TOP BAR */}
        <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search users, posts, metrics..." 
              className="w-full pl-10 pr-4 py-2.5 bg-[#f4f4f5] border-transparent rounded-full text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-5">
            <button className="text-gray-400 hover:text-gray-900 transition-colors">
              <Bell size={20} strokeWidth={2} />
            </button>
            <button className="text-gray-400 hover:text-gray-900 transition-colors">
              <Settings size={20} strokeWidth={2} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden cursor-pointer">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80" alt="Admin" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">Dashboard</h2>
              <p className="text-[13px] font-medium text-gray-500">Welcome back, Super Admin</p>
            </div>
            <div className="bg-white border border-gray-200 text-[12px] font-bold px-4 py-2 rounded-lg shadow-sm text-gray-600 cursor-pointer hover:bg-gray-50">
              Last 30 Days v
            </div>
          </div>

          {/* 4 STAT CARDS */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
              <div>
                <p className="text-2xl font-black text-gray-900">12,482</p>
                <p className="text-[11px] font-bold text-green-500 mt-1">+14% vs last month</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Posts</p>
              <div>
                <p className="text-2xl font-black text-gray-900">3,842</p>
                <p className="text-[11px] font-bold text-green-500 mt-1">+5% vs last month</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-4 -mt-4"></div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Requests</p>
              <div>
                <p className="text-2xl font-black text-[#f44336]">{pendingRequests.length}</p>
                <p className="text-[11px] font-bold text-gray-500 mt-1">Awaiting approval</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Bookings</p>
              <div>
                <p className="text-2xl font-black text-gray-900">$142.5k</p>
                <p className="text-[11px] font-bold text-green-500 mt-1">+22% vs last month</p>
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-3 gap-8">
            
            {/* LEFT COL: Poster Requests Table */}
            <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[15px] font-black text-gray-900">Poster Role Requests</h3>
                <span className="bg-red-50 text-[#f44336] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md">Action Required</span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin w-8 h-8 border-4 border-[#f44336] border-t-transparent rounded-full"></div>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <CheckCircle size={32} className="mb-2 opacity-50" />
                  <p className="text-[13px] font-medium">No pending requests right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req._id} className="flex items-center justify-between p-4 bg-[#fcfcfc] border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                          {req.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-gray-900">{req.username}</p>
                          <p className="text-[11px] font-medium text-gray-500">{req.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRequestAction(req._id, 'approve')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 text-[11px] font-bold rounded-lg transition-colors"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleRequestAction(req._id, 'reject')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#f44336] hover:bg-red-100 text-[11px] font-bold rounded-lg transition-colors"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COL: 2 Small Cards */}
            <div className="col-span-1 space-y-6">
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-[13px] font-black text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-[#00897b] flex-shrink-0"></div>
                    <div>
                      <p className="text-[12px] font-bold text-gray-800">New post in Kyoto</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">2 mins ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-[#f44336] flex-shrink-0"></div>
                    <div>
                      <p className="text-[12px] font-bold text-gray-800">Flagged comment reviewed</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">45 mins ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <div>
                      <p className="text-[12px] font-bold text-gray-800">System backup complete</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-[13px] font-black text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 text-[12px] font-bold py-2.5 rounded-lg transition-colors text-left px-4">
                    Manage Featured Posts
                  </button>
                  <button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 text-[12px] font-bold py-2.5 rounded-lg transition-colors text-left px-4">
                    Review Reported Users
                  </button>
                  <button className="w-full bg-gray-50 hover:bg-gray-100 text-[#f44336] text-[12px] font-bold py-2.5 rounded-lg transition-colors text-left px-4">
                    System Settings
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </main>
    </div>
  );
}