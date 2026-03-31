import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, FileText, CheckCircle, XCircle,
  Eye, EyeOff, Trash2, Search, Bell, Settings, Plus,
  ChevronDown, RefreshCw, Shield, User, Image as ImageIcon,
  MapPin, Star, Calendar, MoreVertical, X, AlertTriangle
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');
const authHeader = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

// ─── Helpers ────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const roleColor = { admin: 'bg-red-100 text-red-600', poster: 'bg-blue-100 text-blue-600', viewer: 'bg-gray-100 text-gray-500' };
const roleLabel = { admin: 'Admin', poster: 'Poster', viewer: 'Viewer' };

// ─── Toast ──────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast.text) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border-l-4 bg-white transition-all
      ${toast.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
      {toast.type === 'error'
        ? <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
        : <CheckCircle size={18} className="text-green-500 flex-shrink-0" />}
      <p className="text-[13px] font-bold text-gray-800 max-w-xs">{toast.text}</p>
      <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-700"><X size={16} /></button>
    </div>
  );
}

// ─── Confirm Modal ───────────────────────────────────────────────
function ConfirmModal({ confirm, onCancel, onOk }) {
  if (!confirm) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <h3 className="text-[15px] font-black text-gray-900">{confirm.title}</h3>
        </div>
        <p className="text-[13px] text-gray-600 font-medium mb-6 pl-[52px]">{confirm.desc}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-[13px] font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Hủy</button>
          <button onClick={onOk} className="px-4 py-2 text-[13px] font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">Xác nhận</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB: QUẢN LÝ BÀI VIẾT
// ════════════════════════════════════════════════════════════════
function PostsTab({ showToast }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | hidden | visible
  const [confirm, setConfirm] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/posts`, { headers: authHeader() });
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      showToast('error', 'Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleToggleVisibility = async (postId, isHidden) => {
    try {
      const res = await fetch(`${API}/posts/${postId}/toggle-visibility`, {
        method: 'PATCH', headers: authHeader()
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, isHidden: data.isHidden } : p));
      showToast('success', data.message || 'Đã cập nhật trạng thái');
    } catch {
      showToast('error', 'Lỗi khi thay đổi trạng thái bài viết');
    }
    setOpenMenu(null);
  };

  const handleDelete = async (postId) => {
    try {
      const res = await fetch(`${API}/posts/${postId}`, { method: 'DELETE', headers: authHeader() });
      if (!res.ok) throw new Error();
      setPosts(prev => prev.filter(p => p._id !== postId));
      showToast('success', 'Đã xóa bài viết');
    } catch {
      showToast('error', 'Lỗi khi xóa bài viết');
    }
    setConfirm(null);
  };

  const filtered = posts.filter(p => {
    const matchSearch = !search.trim() ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase()) ||
      p.createdBy?.username?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
      filter === 'hidden' ? p.isHidden :
      !p.isHidden;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: posts.length,
    visible: posts.filter(p => !p.isHidden).length,
    hidden: posts.filter(p => p.isHidden).length,
  };

  return (
    <div>
      <ConfirmModal confirm={confirm} onCancel={() => setConfirm(null)} onOk={() => handleDelete(confirm.id)} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Tổng bài', value: stats.total, color: 'text-gray-900' },
          { label: 'Đang hiển thị', value: stats.visible, color: 'text-green-600' },
          { label: 'Đang ẩn', value: stats.hidden, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề, địa điểm, tác giả..."
              className="w-full pl-9 pr-3 py-2 bg-[#f4f4f5] rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <select
            value={filter} onChange={e => setFilter(e.target.value)}
            className="bg-[#f4f4f5] rounded-xl px-3 py-2 text-[13px] font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 cursor-pointer"
          >
            <option value="all">Tất cả</option>
            <option value="visible">Đang hiện</option>
            <option value="hidden">Đang ẩn</option>
          </select>
        </div>
        <button onClick={fetchPosts} className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={14} /> Tải lại
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-[#f44336] border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-[13px] font-medium">Không tìm thấy bài viết nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 bg-[#fafafa]">
                  <th className="text-left px-5 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">Bài viết</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider hidden md:table-cell">Địa điểm</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider hidden lg:table-cell">Tác giả</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider hidden lg:table-cell">Ngày</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider hidden md:table-cell">❤️</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(post => (
                  <tr key={post._id} className="border-b border-gray-50 hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {post.images?.[0] ? (
                          <img src={post.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 leading-tight line-clamp-1 max-w-[160px]">{post.title}</p>
                          <p className="text-[11px] text-gray-400 font-medium capitalize">{post.category || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin size={12} className="text-[#f44336]" />
                        <span className="truncate max-w-[120px]">{post.location || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500 flex-shrink-0">
                          {post.createdBy?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-gray-700">{post.createdBy?.username || 'Ẩn danh'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">{fmt(post.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold
                        ${post.isHidden ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                        {post.isHidden ? <><EyeOff size={11}/> Ẩn</> : <><Eye size={11}/> Hiện</>}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 hidden md:table-cell font-bold">
                      {post.likes?.length || 0}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === post._id ? null : post._id)}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenu === post._id && (
                          <div className="absolute right-0 top-8 z-30 w-44 bg-white rounded-xl border border-gray-100 shadow-xl p-1">
                            <button
                              onClick={() => handleToggleVisibility(post._id, post.isHidden)}
                              className="w-full text-left px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                            >
                              {post.isHidden ? <><Eye size={14}/> Hiện bài viết</> : <><EyeOff size={14}/> Ẩn bài viết</>}
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenu(null);
                                setConfirm({ id: post._id, title: 'Xóa bài viết?', desc: `Bài "${post.title}" sẽ bị xóa vĩnh viễn.` });
                              }}
                              className="w-full text-left px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2"
                            >
                              <Trash2 size={14}/> Xóa bài viết
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB: QUẢN LÝ USER
// ════════════════════════════════════════════════════════════════
function UsersTab({ showToast }) {
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [subTab, setSubTab] = useState('list'); // list | pending

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Lấy danh sách users từ posts (cách làm hiện tại của project)
      const [postsRes, pendingRes] = await Promise.all([
        fetch(`${API}/posts`, { headers: authHeader() }),
        fetch(`${API}/users/admin/pending-requests`, { headers: authHeader() }),
      ]);
      const postsData = await postsRes.json();
      const pendingData = await pendingRes.json();

      // Gom user từ posts, dedup theo _id
      const userMap = {};
      if (Array.isArray(postsData)) {
        postsData.forEach(p => {
          if (p.createdBy?._id) {
            const u = p.createdBy;
            if (!userMap[u._id]) {
              userMap[u._id] = { ...u, postCount: 0 };
            }
            userMap[u._id].postCount++;
          }
        });
      }
      setUsers(Object.values(userMap));
      setPending(Array.isArray(pendingData) ? pendingData : []);
    } catch {
      showToast('error', 'Lỗi tải dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (userId, action) => {
    try {
      const res = await fetch(`${API}/users/admin/approve-request`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) throw new Error();
      setPending(prev => prev.filter(u => u._id !== userId));
      showToast('success', action === 'approve' ? 'Đã duyệt thành Poster' : 'Đã từ chối yêu cầu');
      fetchData();
    } catch {
      showToast('error', 'Lỗi khi xử lý yêu cầu');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !search.trim() ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    poster: users.filter(u => u.role === 'poster').length,
    viewer: users.filter(u => u.role === 'viewer').length,
    pending: pending.length,
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng users', value: stats.total, color: 'text-gray-900' },
          { label: 'Poster', value: stats.poster, color: 'text-blue-600' },
          { label: 'Viewer', value: stats.viewer, color: 'text-gray-500' },
          { label: 'Chờ duyệt', value: stats.pending, color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSubTab('list')}
          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-colors ${subTab === 'list' ? 'bg-[#f44336] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
        >
          <span className="flex items-center gap-2"><Users size={14}/> Danh sách Users</span>
        </button>
        <button
          onClick={() => setSubTab('pending')}
          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-colors flex items-center gap-2 ${subTab === 'pending' ? 'bg-[#f44336] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
        >
          <Shield size={14}/> Yêu cầu Poster
          {pending.length > 0 && (
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${subTab === 'pending' ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-600'}`}>
              {pending.length}
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB: DANH SÁCH USERS */}
      {subTab === 'list' && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 items-center flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc email..."
                  className="w-full pl-9 pr-3 py-2 bg-[#f4f4f5] rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>
              <select
                value={filterRole} onChange={e => setFilterRole(e.target.value)}
                className="bg-[#f4f4f5] rounded-xl px-3 py-2 text-[13px] font-bold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả role</option>
                <option value="admin">Admin</option>
                <option value="poster">Poster</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button onClick={fetchData} className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
              <RefreshCw size={14}/> Tải lại
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-[#f44336] border-t-transparent rounded-full"/>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <User size={32} className="mx-auto mb-2 opacity-30"/>
                <p className="text-[13px] font-medium">Không tìm thấy user nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#fafafa]">
                      <th className="text-left px-5 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">Người dùng</th>
                      <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider hidden md:table-cell">Role</th>
                      <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider hidden lg:table-cell">Bài viết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user._id} className="border-b border-gray-50 hover:bg-[#fafafa] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-[13px] font-black text-gray-500 flex-shrink-0">
                                {user.username?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-900">{user.username}</p>
                              <p className="text-[11px] text-gray-400">{user.email || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-black ${roleColor[user.role] || roleColor.viewer}`}>
                            {roleLabel[user.role] || user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 font-bold hidden lg:table-cell">
                          {user.postCount || 0} bài
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* SUB-TAB: YÊU CẦU POSTER */}
      {subTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[14px] font-black text-gray-900">Yêu cầu nâng cấp lên Poster</h3>
            {pending.length > 0 && (
              <span className="bg-amber-100 text-amber-600 text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                {pending.length} chờ duyệt
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin w-8 h-8 border-4 border-[#f44336] border-t-transparent rounded-full"/>
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckCircle size={32} className="mb-2 opacity-30"/>
              <p className="text-[13px] font-medium">Không có yêu cầu nào đang chờ</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pending.map(req => (
                <div key={req._id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[14px] font-black text-gray-500">
                      {req.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">{req.username}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{req.email}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Đăng ký: {fmt(req.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(req._id, 'approve')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 text-[12px] font-bold rounded-xl transition-colors"
                    >
                      <CheckCircle size={14}/> Duyệt
                    </button>
                    <button
                      onClick={() => handleApprove(req._id, 'reject')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 text-[12px] font-bold rounded-xl transition-colors"
                    >
                      <XCircle size={14}/> Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ADMIN PANEL MAIN
// ════════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('posts');
  const [toast, setToast] = useState({ type: '', text: '' });
  const [pendingCount, setPendingCount] = useState(0);

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  }, []);

  // Fetch pending count for badge
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch(`${API}/users/admin/pending-requests`, { headers: authHeader() });
        if (res.ok) {
          const data = await res.json();
          setPendingCount(Array.isArray(data) ? data.length : 0);
        }
      } catch {}
    };
    fetchPending();
  }, [activeTab]);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'posts', icon: FileText, label: 'Bài viết' },
    { id: 'users', icon: Users, label: 'Người dùng', badge: pendingCount },
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-900 overflow-hidden">
      <Toast toast={toast} onClose={() => setToast({ type: '', text: '' })} />

      {/* SIDEBAR */}
      <aside className="w-[240px] bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">The Wanderer</h1>
          <p className="text-[11px] font-bold text-gray-400 mt-0.5">Admin Panel</p>
        </div>

        <nav className="p-4 flex-1 space-y-1">
          {navItems.map(({ id, icon: Icon, label, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all
                ${activeTab === id ? 'bg-red-50 text-[#f44336]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <span className="flex items-center gap-3"><Icon size={18} strokeWidth={2.5}/>{label}</span>
              {badge > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-[#f44336] text-white' : 'bg-amber-100 text-amber-600'}`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80" alt="Admin" className="w-full h-full object-cover"/>
            </div>
            <div>
              <p className="text-[12px] font-bold text-gray-900">Super Admin</p>
              <p className="text-[10px] text-gray-400">admin@wanderer.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER */}
        <header className="h-[64px] bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0">
          <div>
            <h2 className="text-[16px] font-black text-gray-900">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'posts' && 'Quản lý Bài viết'}
              {activeTab === 'users' && 'Quản lý Người dùng'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-700 transition-colors relative">
              <Bell size={20} strokeWidth={2}/>
              {pendingCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#f44336] rounded-full text-white text-[9px] font-black flex items-center justify-center">{pendingCount}</span>}
            </button>
            <button className="text-gray-400 hover:text-gray-700 transition-colors">
              <Settings size={20} strokeWidth={2}/>
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <div>
              <p className="text-[14px] text-gray-500 font-medium mb-6">Tổng quan hệ thống</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                {[
                  { label: 'Bài viết chờ duyệt', value: pendingCount, color: 'text-amber-500', sub: 'Yêu cầu Poster' },
                  { label: 'Tổng bài viết', value: '—', color: 'text-gray-900', sub: 'Xem tab Bài viết' },
                  { label: 'Người dùng', value: '—', color: 'text-blue-600', sub: 'Xem tab Users' },
                  { label: 'Trạng thái', value: '✓', color: 'text-green-500', sub: 'Hệ thống ổn định' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{s.label}</p>
                    <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <button onClick={() => setActiveTab('posts')} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-[#f44336]/30 hover:shadow-md transition-all text-left group">
                  <FileText size={24} className="text-[#f44336] mb-3"/>
                  <h3 className="text-[15px] font-black text-gray-900 mb-1 group-hover:text-[#f44336] transition-colors">Quản lý Bài viết</h3>
                  <p className="text-[12px] text-gray-500">Xem, ẩn/hiện, xóa tất cả bài viết trên hệ thống.</p>
                </button>
                <button onClick={() => setActiveTab('users')} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-[#f44336]/30 hover:shadow-md transition-all text-left group">
                  <Users size={24} className="text-[#f44336] mb-3"/>
                  <h3 className="text-[15px] font-black text-gray-900 mb-1 group-hover:text-[#f44336] transition-colors">Quản lý Người dùng</h3>
                  <p className="text-[12px] text-gray-500">Xem danh sách users và duyệt yêu cầu nâng quyền Poster.</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'posts' && <PostsTab showToast={showToast}/>}
          {activeTab === 'users' && <UsersTab showToast={showToast}/>}
        </div>
      </main>
    </div>
  );
}