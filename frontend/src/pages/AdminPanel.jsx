import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, FileText, CheckCircle, XCircle,
  Eye, EyeOff, Trash2, Search, Bell, Settings, Plus,
  ChevronDown, RefreshCw, Shield, User, Image as ImageIcon,
  MapPin, Star, Calendar, MoreVertical, X, AlertTriangle
} from 'lucide-react';
import AccountMenu from '../components/AccountMenu';
import { useLanguage } from '../contexts/LanguageContext';

const API = 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');
const authHeader = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

// ─── Helpers ────────────────────────────────────────────────────
const normalizeRole = (role) => (String(role || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user');
const fmt = (d, locale = 'vi-VN') => d ? new Date(d).toLocaleDateString(locale) : '—';
const roleColor = { admin: 'bg-red-100 text-red-600', user: 'bg-gray-100 text-gray-600' };
const roleLabel = { admin: 'Admin', user: 'User' };

const copy = {
  vi: {
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    cannotLoadPosts: 'Không thể tải danh sách bài viết',
    statusUpdated: 'Đã cập nhật trạng thái',
    togglePostError: 'Lỗi khi thay đổi trạng thái bài viết',
    postDeleted: 'Đã xóa bài viết',
    deletePostError: 'Lỗi khi xóa bài viết',
    totalPosts: 'Tổng bài',
    visiblePosts: 'Đang hiển thị',
    hiddenPosts: 'Đang ẩn',
    searchPosts: 'Tìm theo tiêu đề, địa điểm, tác giả...',
    all: 'Tất cả',
    visible: 'Đang hiện',
    hidden: 'Đang ẩn',
    reload: 'Tải lại',
    noPostsFound: 'Không tìm thấy bài viết nào',
    post: 'Bài viết',
    location: 'Địa điểm',
    author: 'Tác giả',
    date: 'Ngày',
    status: 'Trạng thái',
    anonymous: 'Ẩn danh',
    hide: 'Ẩn',
    show: 'Hiện',
    showPost: 'Hiện bài viết',
    hidePost: 'Ẩn bài viết',
    deletePost: 'Xóa bài viết',
    deletePostTitle: 'Xóa bài viết?',
    permanentDelete: 'sẽ bị xóa vĩnh viễn.',
    cannotLoadUsers: 'Lỗi tải dữ liệu người dùng',
    totalUsers: 'Tổng users',
    admin: 'Admin',
    user: 'User',
    searchUsers: 'Tìm theo tên hoặc email...',
    allRoles: 'Tất cả role',
    noUsersFound: 'Không tìm thấy user nào',
    users: 'Người dùng',
    postsCountSuffix: 'bài',
    dashboardOverview: 'Tổng quan hệ thống',
    reloadData: 'Tải lại dữ liệu',
    totalPostsCard: 'Tổng bài viết',
    currentlyVisible: 'đang hiện',
    currentlyHidden: 'Đang ẩn',
    hiddenPostsDesc: 'Bài viết bị ẩn',
    usersCard: 'Người dùng',
    regularUsers: 'Người dùng thường',
    managePosts: 'Quản lý Bài viết',
    managePostsDesc: 'Xem, ẩn/hiện, xóa tất cả bài viết trên hệ thống.',
    manageUsers: 'Quản lý Người dùng',
    manageUsersDesc: 'Xem danh sách users và thống kê vai trò.',
    dashboard: 'Trang chủ',
    postsNav: 'Bài viết',
    usersNav: 'Người dùng',
    adminPanel: 'Admin Panel',
    adminProfile: 'Hồ sơ Admin',
    cannotLoadDashboard: 'Không thể tải dữ liệu dashboard',
    profileFallback: 'Admin',
    profileEmailFallback: 'Chưa cập nhật email',
    accountInfo: 'Thông tin tài khoản',
    displayName: 'Tên hiển thị',
    email: 'Email',
    role: 'Quyền',
    accountStatus: 'Trạng thái',
    active: 'Đang hoạt động',
    editProfile: 'Chỉnh sửa hồ sơ',
    reportsNav: 'Báo cáo vi phạm',
    manageReports: 'Quản lý Báo cáo',
    reporter: 'Người báo cáo',
    target: 'Đối tượng bị tố cáo',
    reason: 'Lý do',
    details: 'Chi tiết',
    action: 'Hành động',
    dismiss: 'Bỏ qua',
    banUser: 'Khóa tài khoản',
    unbanUser: 'Mở khóa',
    bannedStatus: 'Bị khóa',
    activeStatus: 'Hoạt động',
    targetPost: 'Bài viết',
    targetUser: 'Tài khoản',
    noReportsFound: 'Không tìm thấy báo cáo nào',
    cannotLoadReports: 'Lỗi tải danh sách báo cáo',
    reportProcessed: 'Xử lý báo cáo thành công',
    confirmBanTitle: 'Khóa tài khoản này?',
    confirmBanDesc: 'Tài khoản này sẽ không thể đăng nhập hoặc dùng hệ thống.',
    confirmDismissTitle: 'Bỏ qua báo cáo?',
    confirmDismissDesc: 'Báo cáo này sẽ được đánh dấu là đã xử lý và bỏ qua.',
  },
  en: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    cannotLoadPosts: 'Unable to load posts',
    statusUpdated: 'Status updated',
    togglePostError: 'Failed to change post status',
    postDeleted: 'Post deleted',
    deletePostError: 'Failed to delete post',
    totalPosts: 'Total posts',
    visiblePosts: 'Visible',
    hiddenPosts: 'Hidden',
    searchPosts: 'Search by title, location, author...',
    all: 'All',
    visible: 'Visible',
    hidden: 'Hidden',
    reload: 'Reload',
    noPostsFound: 'No posts found',
    post: 'Post',
    location: 'Location',
    author: 'Author',
    date: 'Date',
    status: 'Status',
    anonymous: 'Anonymous',
    hide: 'Hide',
    show: 'Show',
    showPost: 'Show post',
    hidePost: 'Hide post',
    deletePost: 'Delete post',
    deletePostTitle: 'Delete post?',
    permanentDelete: 'will be permanently deleted.',
    cannotLoadUsers: 'Failed to load users',
    totalUsers: 'Total users',
    admin: 'Admin',
    user: 'User',
    searchUsers: 'Search by name or email...',
    allRoles: 'All roles',
    noUsersFound: 'No users found',
    users: 'Users',
    postsCountSuffix: 'posts',
    dashboardOverview: 'System overview',
    reloadData: 'Reload data',
    totalPostsCard: 'Total posts',
    currentlyVisible: 'visible',
    currentlyHidden: 'Hidden',
    hiddenPostsDesc: 'Posts are hidden',
    usersCard: 'Users',
    regularUsers: 'Regular users',
    managePosts: 'Manage Posts',
    managePostsDesc: 'View, hide/show, and delete all posts.',
    manageUsers: 'Manage Users',
    manageUsersDesc: 'View user list and role statistics.',
    dashboard: 'Dashboard',
    postsNav: 'Posts',
    usersNav: 'Users',
    adminPanel: 'Admin Panel',
    adminProfile: 'Admin Profile',
    cannotLoadDashboard: 'Unable to load dashboard data',
    profileFallback: 'Admin',
    profileEmailFallback: 'Email not set',
    accountInfo: 'Account information',
    displayName: 'Display name',
    email: 'Email',
    role: 'Role',
    accountStatus: 'Status',
    active: 'Active',
    editProfile: 'Edit profile',
    reportsNav: 'Violations / Reports',
    manageReports: 'Manage Reports',
    reporter: 'Reporter',
    target: 'Reported Target',
    reason: 'Reason',
    details: 'Details',
    action: 'Action',
    dismiss: 'Dismiss',
    banUser: 'Ban Account',
    unbanUser: 'Unban',
    bannedStatus: 'Banned',
    activeStatus: 'Active',
    targetPost: 'Post',
    targetUser: 'Account',
    noReportsFound: 'No reports found',
    cannotLoadReports: 'Failed to load reports',
    reportProcessed: 'Report processed successfully',
    confirmBanTitle: 'Ban this account?',
    confirmBanDesc: 'This user will no longer be able to log in or use the platform.',
    confirmDismissTitle: 'Dismiss report?',
    confirmDismissDesc: 'This report will be marked as resolved and ignored.',
  },
};

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
function ConfirmModal({ confirm, onCancel, onOk, t }) {
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
          <button onClick={onCancel} className="px-4 py-2 text-[13px] font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">{t.cancel}</button>
          <button onClick={onOk} className="px-4 py-2 text-[13px] font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">{t.confirm}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB: QUẢN LÝ BÀI VIẾT
// ════════════════════════════════════════════════════════════════
function PostsTab({ showToast, t, locale }) {
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
      showToast('error', t.cannotLoadPosts);
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
      showToast('success', data.message || t.statusUpdated);
    } catch {
      showToast('error', t.togglePostError);
    }
    setOpenMenu(null);
  };

  const handleDelete = async (postId) => {
    try {
      const res = await fetch(`${API}/posts/${postId}`, { method: 'DELETE', headers: authHeader() });
      if (!res.ok) throw new Error();
      setPosts(prev => prev.filter(p => p._id !== postId));
      showToast('success', t.postDeleted);
    } catch {
      showToast('error', t.deletePostError);
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
      <ConfirmModal confirm={confirm} onCancel={() => setConfirm(null)} onOk={() => handleDelete(confirm.id)} t={t} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: t.totalPosts, value: stats.total, color: 'text-gray-900' },
          { label: t.visiblePosts, value: stats.visible, color: 'text-green-600' },
          { label: t.hiddenPosts, value: stats.hidden, color: 'text-red-500' },
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
              placeholder={t.searchPosts}
              className="w-full pl-9 pr-3 py-2 bg-[#f4f4f5] rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <select
            value={filter} onChange={e => setFilter(e.target.value)}
            className="bg-[#f4f4f5] rounded-xl px-3 py-2 text-[13px] font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 cursor-pointer"
          >
            <option value="all">{t.all}</option>
            <option value="visible">{t.visible}</option>
            <option value="hidden">{t.hidden}</option>
          </select>
        </div>
        <button onClick={fetchPosts} className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={14} /> {t.reload}
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
            <p className="text-[13px] font-medium">{t.noPostsFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 bg-[#fafafa]">
                  <th className="text-left px-5 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">{t.post}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider hidden md:table-cell">{t.location}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider hidden lg:table-cell">{t.author}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider hidden lg:table-cell">{t.date}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">{t.status}</th>
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
                        <span className="font-medium text-gray-700">{post.createdBy?.username || t.anonymous}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">{fmt(post.createdAt, locale)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold
                        ${post.isHidden ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                        {post.isHidden ? <><EyeOff size={11}/> {t.hide}</> : <><Eye size={11}/> {t.show}</>}
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
                              {post.isHidden ? <><Eye size={14}/> {t.showPost}</> : <><EyeOff size={14}/> {t.hidePost}</>}
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenu(null);
                                setConfirm({ id: post._id, title: t.deletePostTitle, desc: `"${post.title}" ${t.permanentDelete}` });
                              }}
                              className="w-full text-left px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2"
                            >
                              <Trash2 size={14}/> {t.deletePost}
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
function UsersTabLegacy({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const postsRes = await fetch(`${API}/posts`, { headers: authHeader() });
      const postsData = await postsRes.json();

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
    } catch {
      showToast('error', 'Lỗi tải dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);


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
    user: users.filter(u => u.role !== 'admin').length,
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng users', value: stats.total, color: 'text-gray-900' },
          { label: 'Admin', value: stats.admin, color: 'text-red-600' },
          { label: 'User', value: stats.user, color: 'text-gray-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* DANH SÁCH USERS */}
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
                <option value="user">User</option>
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
                          <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-black ${roleColor[normalizeRole(user.role)] || roleColor.user}`}>
                            {roleLabel[normalizeRole(user.role)] || 'User'}
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
      </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ADMIN PANEL MAIN
// ════════════════════════════════════════════════════════════════
function UsersTab({ showToast, t }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, postsRes] = await Promise.all([
        fetch(`${API}/users/search`, { headers: authHeader() }),
        fetch(`${API}/posts`, { headers: authHeader() }),
      ]);
      const usersData = await usersRes.json();
      const postsData = await postsRes.json();

      const postCountByUser = {};
      if (Array.isArray(postsData)) {
        postsData.forEach((post) => {
          const userId = post.createdBy?._id;
          if (userId) postCountByUser[userId] = (postCountByUser[userId] || 0) + 1;
        });
      }

      setUsers(Array.isArray(usersData)
        ? usersData.map((user) => ({
            ...user,
            role: normalizeRole(user.role),
            postCount: postCountByUser[user._id] || user.postCount || 0,
          }))
        : []
      );
    } catch {
      showToast('error', t.cannotLoadUsers);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleBan = async (userId) => {
    try {
      const res = await fetch(`${API}/users/admin/${userId}/toggle-ban`, {
        method: 'PUT',
        headers: authHeader()
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Lỗi hệ thống khi khóa tài khoản');
      }
      const data = await res.json();
      showToast('success', data.message);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: data.isBanned } : u));
    } catch (error) {
      showToast('error', error.message);
    }
  };

  const filteredUsers = users.filter((user) => {
    const role = normalizeRole(user.role);
    const keyword = search.trim().toLowerCase();
    const matchSearch = !keyword ||
      user.username?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword);
    const matchRole = filterRole === 'all' || role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    admin: users.filter((user) => normalizeRole(user.role) === 'admin').length,
    user: users.filter((user) => normalizeRole(user.role) !== 'admin').length,
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: t.totalUsers, value: stats.total, color: 'text-gray-900' },
          { label: t.admin, value: stats.admin, color: 'text-red-600' },
          { label: t.user, value: stats.user, color: 'text-gray-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
            <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.searchUsers}
              className="w-full pl-9 pr-3 py-2 bg-[#f4f4f5] rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <select
            value={filterRole}
            onChange={(event) => setFilterRole(event.target.value)}
            className="bg-[#f4f4f5] rounded-xl px-3 py-2 text-[13px] font-bold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="all">{t.allRoles}</option>
            <option value="admin">{t.admin}</option>
            <option value="user">{t.user}</option>
          </select>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={14}/> {t.reload}
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
            <p className="text-[13px] font-medium">{t.noUsersFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 bg-[#fafafa]">
                  <th className="text-left px-5 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">{t.users}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider hidden md:table-cell">{t.role}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider hidden lg:table-cell">{t.post}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">{t.accountStatus}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-55 hover:bg-[#fafafa] transition-colors">
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
                          <p className="text-[11px] text-gray-400">{user.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-black ${roleColor[normalizeRole(user.role)] || roleColor.user}`}>
                        {roleLabel[normalizeRole(user.role)] || 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 font-bold hidden lg:table-cell">
                      {user.postCount || 0} {t.postsCountSuffix}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-black ${user.isBanned ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                        {user.isBanned ? t.bannedStatus : t.activeStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleBan(user._id)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors
                          ${user.isBanned ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-[#f44336] hover:bg-red-100'}`}
                      >
                        {user.isBanned ? t.unbanUser : t.banUser}
                      </button>
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
// TAB: QUẢN LÝ BÁO CÁO VI PHẠM
// ════════════════════════════════════════════════════════════════
function ReportsTab({ showToast, t, locale }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // { type: 'dismiss'|'ban_user'|'delete_post', reportId: string, title: string, desc: string }
  const [processing, setProcessing] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/reports`, { headers: authHeader() });
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch {
      showToast('error', t.cannotLoadReports);
    } finally {
      setLoading(false);
    }
  }, [t.cannotLoadReports, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (reportId, action) => {
    setProcessing(true);
    try {
      const res = await fetch(`${API}/reports/${reportId}/action`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      showToast('success', data.message || t.reportProcessed);
      fetchReports();
    } catch {
      showToast('error', 'Có lỗi xảy ra khi xử lý báo cáo.');
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status !== 'pending');

  return (
    <div>
      {confirm && (
        <div className="fixed inset-0 bg-black/40 z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <h3 className="text-[15px] font-black text-gray-900">{confirm.title}</h3>
            </div>
            <p className="text-[13px] text-gray-600 font-medium mb-6 pl-[52px]">{confirm.desc}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirm(null)} 
                disabled={processing}
                className="px-4 py-2 text-[13px] font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={() => handleAction(confirm.reportId, confirm.type)} 
                disabled={processing}
                className="px-4 py-2 text-[13px] font-bold text-white bg-[#f44336] rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                {processing && <RefreshCw size={12} className="animate-spin" />}
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Tổng số báo cáo', value: reports.length, color: 'text-gray-900' },
          { label: 'Chưa xử lý', value: pendingReports.length, color: 'text-red-500 font-black' },
          { label: 'Đã xử lý / Bỏ qua', value: resolvedReports.length, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-black text-gray-900">{t.manageReports}</h3>
        <button onClick={fetchReports} className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={14} /> {t.reload}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-[#f44336] border-t-transparent rounded-full" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-[13px] font-medium">{t.noReportsFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 bg-[#fafafa]">
                  <th className="text-left px-5 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">{t.reporter}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">{t.target}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">{t.reason}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">{t.status}</th>
                  <th className="text-left px-4 py-3 font-black text-gray-400 text-[11px] uppercase tracking-wider">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => {
                  const isPending = report.status === 'pending';
                  const isPost = report.targetType === 'post';
                  const targetObj = isPost ? report.targetPost : report.targetUser;
                  
                  let targetName = '—';
                  let targetSub = '';
                  if (targetObj) {
                    if (isPost) {
                      targetName = targetObj.title || 'Bài viết không tiêu đề';
                      targetSub = `Bởi: ${targetObj.createdBy?.username || t.anonymous}`;
                    } else {
                      targetName = targetObj.username || 'Tài khoản ẩn danh';
                      targetSub = targetObj.email || '';
                    }
                  } else {
                    targetName = isPost ? 'Bài viết đã bị xóa trước đó' : 'Tài khoản đã bị xóa';
                  }

                  return (
                    <tr key={report._id} className="border-b border-gray-50 hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {report.reporter?.avatar ? (
                              <img src={report.reporter.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-gray-500">
                                {report.reporter?.username?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{report.reporter?.username || '—'}</p>
                            <p className="text-[10px] text-gray-400">{report.reporter?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase mb-1
                            ${isPost ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                            {isPost ? t.targetPost : t.targetUser}
                          </span>
                          <p className="font-bold text-gray-800 line-clamp-1 max-w-[200px]">{targetName}</p>
                          {targetSub && <p className="text-[10px] text-gray-400">{targetSub}</p>}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-bold text-gray-900">{report.reason}</p>
                          {report.details && (
                            <p className="text-[11px] text-gray-400 line-clamp-2 max-w-[200px]" title={report.details}>
                              {report.details}
                            </p>
                          )}
                          <p className="text-[9px] text-gray-400 mt-1">
                            {new Date(report.createdAt).toLocaleString(locale)}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black
                          ${report.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                            report.status === 'dismissed' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}>
                          {report.status === 'pending' ? 'Đang chờ duyệt' : 
                           report.status === 'dismissed' ? 'Đã bỏ qua' : 'Đã xử lý'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {isPending && targetObj ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirm({
                                type: 'dismiss',
                                reportId: report._id,
                                title: t.confirmDismissTitle,
                                desc: t.confirmDismissDesc
                              })}
                              className="px-2.5 py-1 text-[11px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              {t.dismiss}
                            </button>

                            {isPost && (
                              <button
                                onClick={() => setConfirm({
                                  type: 'delete_post',
                                  reportId: report._id,
                                  title: 'Xóa bài viết vi phạm?',
                                  desc: 'Bài viết này sẽ bị gỡ bỏ vĩnh viễn khỏi nền tảng.'
                                })}
                                className="px-2.5 py-1 text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                Xóa bài
                              </button>
                            )}

                            {(() => {
                              const targetUserObj = isPost ? report.targetPost?.createdBy : report.targetUser;
                              const isTargetBanned = targetUserObj?.isBanned || false;
                              const uName = targetUserObj?.username || 'tài khoản này';

                              if (isTargetBanned) {
                                return (
                                  <button
                                    onClick={() => setConfirm({
                                      type: 'unban_user',
                                      reportId: report._id,
                                      title: 'Mở khóa tài khoản này?',
                                      desc: `Mở khóa và khôi phục hoạt động cho tài khoản "${uName}"`
                                    })}
                                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                                  >
                                    Mở khóa
                                  </button>
                                );
                              }

                              return (
                                <button
                                  onClick={() => setConfirm({
                                    type: 'ban_user',
                                    reportId: report._id,
                                    title: t.confirmBanTitle,
                                    desc: `Khóa vĩnh viễn tài khoản "${uName}". Người dùng này sẽ không thể đăng nhập nữa.`
                                  })}
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#f44336] hover:bg-[#e22d41] rounded-lg transition-colors"
                                >
                                  {t.banUser}
                                </button>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardTab({ stats, loading, onRefresh, onOpenTab, t }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-[14px] text-gray-500 font-medium">{t.dashboardOverview}</p>
        <button onClick={onRefresh} className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-white transition-colors">
          <RefreshCw size={14}/> {t.reloadData}
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {[
          { label: t.totalPostsCard, value: stats.totalPosts, color: 'text-gray-900', sub: `${stats.visiblePosts} ${t.currentlyVisible}` },
          { label: t.currentlyHidden, value: stats.hiddenPosts, color: 'text-red-500', sub: t.hiddenPostsDesc },
          { label: t.usersCard, value: stats.totalUsers, color: 'text-blue-600', sub: `${stats.adminUsers} ${t.admin.toLowerCase()}` },
          { label: t.user, value: stats.userUsers, color: 'text-indigo-600', sub: t.regularUsers },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{item.label}</p>
            <p className={`text-3xl font-black ${item.color}`}>{loading ? '...' : item.value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <button onClick={() => onOpenTab('posts')} className="xl:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-[#f44336]/30 hover:shadow-md transition-all text-left group">
          <FileText size={24} className="text-[#f44336] mb-3"/>
          <h3 className="text-[15px] font-black text-gray-900 mb-1 group-hover:text-[#f44336] transition-colors">{t.managePosts}</h3>
          <p className="text-[12px] text-gray-500">{t.managePostsDesc}</p>
        </button>
        <button onClick={() => onOpenTab('users')} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-[#f44336]/30 hover:shadow-md transition-all text-left group">
          <Users size={24} className="text-[#f44336] mb-3"/>
          <h3 className="text-[15px] font-black text-gray-900 mb-1 group-hover:text-[#f44336] transition-colors">{t.manageUsers}</h3>
          <p className="text-[12px] text-gray-500">{t.manageUsersDesc}</p>
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { language } = useLanguage();
  const t = copy[language] || copy.vi;
  const locale = language === 'en' ? 'en-US' : 'vi-VN';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState({ type: '', text: '' });
  const [adminProfile, setAdminProfile] = useState({ username: '', email: '', avatar: '', role: 'admin' });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalPosts: 0,
    visiblePosts: 0,
    hiddenPosts: 0,
    totalUsers: 0,
    adminUsers: 0,
    userUsers: 0,
  });

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const [profileRes, postsRes, usersRes] = await Promise.all([
        fetch(`${API}/profile`, { headers: authHeader() }),
        fetch(`${API}/posts`, { headers: authHeader() }),
        fetch(`${API}/users/search`, { headers: authHeader() }),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const user = profileData.user || profileData;
        setAdminProfile({
          username: user.username || localStorage.getItem('username') || 'Admin',
          email: user.email || localStorage.getItem('email') || '',
          avatar: user.avatar || localStorage.getItem('avatar') || '',
          role: normalizeRole(user.role || localStorage.getItem('role') || 'admin'),
        });
      }

      const postsData = await postsRes.json();
      const usersData = await usersRes.json();
      const posts = Array.isArray(postsData) ? postsData : [];
      const users = Array.isArray(usersData) ? usersData : [];
      setDashboardStats({
        totalPosts: posts.length,
        visiblePosts: posts.filter((post) => !post.isHidden).length,
        hiddenPosts: posts.filter((post) => post.isHidden).length,
        totalUsers: users.length,
        adminUsers: users.filter((user) => normalizeRole(user.role) === 'admin').length,
        userUsers: users.filter((user) => normalizeRole(user.role) !== 'admin').length,
      });
    } catch {
      showToast('error', t.cannotLoadDashboard);
    } finally {
      setDashboardLoading(false);
    }
  }, [showToast, t.cannotLoadDashboard]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'posts', icon: FileText, label: t.postsNav },
    { id: 'users', icon: Users, label: t.usersNav },
    { id: 'reports', icon: AlertTriangle, label: t.reportsNav },
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-gray-900 overflow-hidden">
      <Toast toast={toast} onClose={() => setToast({ type: '', text: '' })} />

      {/* SIDEBAR */}
      <aside className="w-[240px] bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">The Wanderer</h1>
          <p className="text-[11px] font-bold text-gray-400 mt-0.5">{t.adminPanel}</p>
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
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER */}
        <header className="h-[64px] bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0">
          <div>
            <h2 className="text-[16px] font-black text-gray-900">
              {activeTab === 'dashboard' && t.dashboard}
              {activeTab === 'posts' && t.managePosts}
              {activeTab === 'users' && t.manageUsers}
              {activeTab === 'reports' && t.manageReports}
              {activeTab === 'profile' && t.adminProfile}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-700 transition-colors relative">
              <Bell size={20} strokeWidth={2}/>
            </button>
            <button onClick={() => setActiveTab('profile')} className="text-gray-400 hover:text-gray-700 transition-colors">
              <Settings size={20} strokeWidth={2}/>
            </button>
            <AccountMenu avatar={adminProfile.avatar} username={adminProfile.username} />
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <DashboardTab
              stats={dashboardStats}
              loading={dashboardLoading}
              onRefresh={fetchDashboardData}
              onOpenTab={setActiveTab}
              t={t}
            />
          )}

          {false && activeTab === 'dashboard' && (
            <div>
              <p className="text-[14px] text-gray-500 font-medium mb-6">Tổng quan hệ thống</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                {[
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

          {activeTab === 'posts' && <PostsTab showToast={showToast} t={t} locale={locale} />}
          {activeTab === 'users' && <UsersTab showToast={showToast} t={t} />}
          {activeTab === 'reports' && <ReportsTab showToast={showToast} t={t} locale={locale} />}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={adminProfile.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80"}
                    alt={adminProfile.username || "Admin"}
                    className="w-28 h-28 rounded-full object-cover border-4 border-red-50 shadow-sm mb-4"
                  />
                  <h3 className="text-xl font-black text-gray-900">{adminProfile.username || t.profileFallback}</h3>
                  <p className="text-[12px] font-bold text-[#f44336] uppercase tracking-widest mt-1">{roleLabel[adminProfile.role] || adminProfile.role || t.profileFallback}</p>
                  <p className="text-[13px] text-gray-500 font-medium mt-2">{adminProfile.email || t.profileEmailFallback}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-[16px] font-black text-gray-900 mb-4">{t.accountInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.displayName}</p>
                    <p className="text-[14px] font-bold text-gray-900">{adminProfile.username || '-'}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.email}</p>
                    <p className="text-[14px] font-bold text-gray-900">{adminProfile.email || '-'}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.role}</p>
                    <p className="text-[14px] font-bold text-gray-900">{roleLabel[adminProfile.role] || adminProfile.role || t.profileFallback}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.accountStatus}</p>
                    <p className="text-[14px] font-bold text-green-600">{t.active}</p>
                  </div>
                </div>
                <button onClick={() => window.location.assign('/settings')} className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f44336] text-white text-[13px] font-bold hover:bg-[#e53935] transition-colors">
                  <Settings size={16} /> {t.editProfile}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}