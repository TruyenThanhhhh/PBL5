import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, Users, FileText, CheckCircle, XCircle,
  Eye, EyeOff, Trash2, Search, Bell, Settings, Plus,
  ChevronDown, RefreshCw, Shield, User, Image as ImageIcon,
  MapPin, Star, Calendar, MoreVertical, X, AlertTriangle, Wrench,
  Sun, Moon
} from 'lucide-react';
import AccountMenu from '../components/AccountMenu';
import { useLanguage } from '../contexts/LanguageContext';

const API = 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');
const authHeader = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

// ─── Helpers ────────────────────────────────────────────────────
const normalizeRole = (role) => (String(role || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user');
const fmt = (d, locale = 'vi-VN') => d ? new Date(d).toLocaleDateString(locale) : '—';
const roleColor = (isDark, role) => {
  const norm = normalizeRole(role);
  if (isDark) {
    return norm === 'admin' 
      ? 'bg-red-950/40 text-red-400 border border-red-900/50' 
      : 'bg-gray-850/40 text-gray-400 border border-gray-700/50';
  } else {
    return norm === 'admin' 
      ? 'bg-red-50 text-red-600 border border-red-200' 
      : 'bg-gray-100 text-gray-600 border border-gray-200';
  }
};
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
    dashboardOverview: 'Giám sát hoạt động, tiến độ và báo cáo vi phạm',
    reloadData: 'Tải lại dữ liệu',
    totalPostsCard: 'Tổng bài viết',
    currentlyVisible: 'đang hiện',
    currentlyHidden: 'Đang ẩn',
    hiddenPostsDesc: 'Bài viết bị ẩn',
    usersCard: 'Người dùng',
    regularUsers: 'Người dùng thường',
    managePosts: 'Quản lý Bài viết',
    managePostsDesc: 'Xem, ẩn/hiện, xóa các bài viết trên hệ thống.',
    manageUsers: 'Quản lý Người dùng',
    manageUsersDesc: 'Xem danh sách và thay đổi trạng thái tài khoản.',
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
    pendingReportsCard: 'Báo cáo chờ duyệt',
    systemStatus: 'Trạng thái hệ thống',
    systemHealthy: 'Ổn định',
    dbConnected: 'Hệ thống online',
    recentActivityTitle: 'Hoạt động hệ thống gần đây',
    categoryDistributionTitle: 'Thể loại Điểm đến',
    quickAccessTitle: 'Truy cập nhanh chức năng',
    viewDetails: 'Xem chi tiết',
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
    dashboardOverview: 'Monitor activities, progress, and reports',
    reloadData: 'Reload data',
    totalPostsCard: 'Total posts',
    currentlyVisible: 'visible',
    currentlyHidden: 'Hidden',
    hiddenPostsDesc: 'Posts are hidden',
    usersCard: 'Users',
    regularUsers: 'Regular users',
    managePosts: 'Manage Posts',
    managePostsDesc: 'View, hide/show, and delete posts.',
    manageUsers: 'Manage Users',
    manageUsersDesc: 'View user list and toggle account bans.',
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
    pendingReportsCard: 'Pending reports',
    systemStatus: 'System Status',
    systemHealthy: 'Stable',
    dbConnected: 'System online',
    recentActivityTitle: 'Recent System Activity',
    categoryDistributionTitle: 'Destination Category',
    quickAccessTitle: 'Quick Access Actions',
    viewDetails: 'View details',
  },
};

// ─── Toast ──────────────────────────────────────────────────────
function Toast({ toast, onClose, isDarkMode }) {
  if (!toast.text) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border transition-all
      ${isDarkMode ? 'bg-[#161726] border-gray-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'}
      ${toast.type === 'error' ? 'border-red-500/50' : 'border-green-500/50'}`}>
      {toast.type === 'error'
        ? <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
        : <CheckCircle size={18} className="text-green-400 flex-shrink-0" />}
      <p className="text-[13px] font-bold max-w-xs">{toast.text}</p>
      <button onClick={onClose} className={`ml-3 cursor-pointer ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}><X size={16} /></button>
    </div>
  );
}

// ─── Confirm Modal ───────────────────────────────────────────────
function ConfirmModal({ confirm, onCancel, onOk, t, isDarkMode }) {
  if (!confirm) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4">
      <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-sm border
        ${isDarkMode ? 'bg-[#131526] border-[#2c3052] text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <h3 className="text-[15px] font-black">{confirm.title}</h3>
        </div>
        <p className={`text-[13px] font-medium mb-6 pl-[52px] ${isDarkMode ? 'text-gray-400' : 'text-gray-650'}`}>{confirm.desc}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-colors cursor-pointer
            ${isDarkMode ? 'text-gray-300 bg-[#22253f] hover:bg-[#2c3052]' : 'text-gray-650 bg-gray-100 hover:bg-gray-200'}`}>{t.cancel}</button>
          <button onClick={onOk} className="px-4 py-2 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer">{t.confirm}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB: QUẢN LÝ BÀI VIẾT
// ════════════════════════════════════════════════════════════════
function PostsTab({ showToast, t, locale, isDarkMode }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | hidden | visible
  const [confirm, setConfirm] = useState(null);
  const [openMenu, setOpenMenu] = useState(null); // null or { id, title, isHidden, rect }

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
  }, [t.cannotLoadPosts, showToast]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (!openMenu) return;
    const handleScroll = () => setOpenMenu(null);
    window.addEventListener('scroll', handleScroll, { capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [openMenu]);

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
      <ConfirmModal confirm={confirm} onCancel={() => setConfirm(null)} onOk={() => handleDelete(confirm.id)} t={t} isDarkMode={isDarkMode} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: t.totalPosts, value: stats.total, color: isDarkMode ? 'text-white' : 'text-gray-900' },
          { label: t.visiblePosts, value: stats.visible, color: 'text-green-500' },
          { label: t.hiddenPosts, value: stats.hidden, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 border shadow-sm
            ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={`rounded-2xl border shadow-sm mb-4 p-4 flex flex-wrap gap-3 items-center justify-between
        ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
        <div className="flex gap-2 items-center flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.searchPosts}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-[13px] font-medium border focus:outline-none focus:ring-2 focus:ring-red-500/30
                ${isDarkMode ? 'bg-[#1a1b30] text-white border-[#2d2f54] placeholder-gray-500' : 'bg-gray-50 text-gray-900 border-gray-250 placeholder-gray-400'}`}
            />
          </div>
          <select
            value={filter} onChange={e => setFilter(e.target.value)}
            className={`border rounded-xl px-3 py-2 text-[13px] font-bold focus:outline-none cursor-pointer
              ${isDarkMode ? 'bg-[#1a1b30] text-white border-[#2d2f54]' : 'bg-gray-50 text-gray-700 border-gray-250'}`}
          >
            <option value="all">{t.all}</option>
            <option value="visible">{t.visible}</option>
            <option value="hidden">{t.hidden}</option>
          </select>
        </div>
        <button onClick={fetchPosts} className={`flex items-center gap-2 text-[13px] font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer
          ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#1a1b30]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
          <RefreshCw size={14} /> {t.reload}
        </button>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden
        ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-[#f44336] border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-[13px] font-medium">{t.noPostsFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-[#22253f] bg-[#0e0f1e] text-gray-450' : 'border-gray-150 bg-gray-50 text-gray-500'}`}>
                  <th className="text-left px-5 py-3 font-black text-[11px] uppercase tracking-wider">{t.post}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider hidden md:table-cell">{t.location}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider hidden lg:table-cell">{t.author}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider hidden lg:table-cell">{t.date}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider">{t.status}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider hidden md:table-cell">❤️</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(post => (
                  <tr key={post._id} className={`border-b transition-colors
                    ${isDarkMode ? 'border-[#1b1c31] hover:bg-[#1a1c32] text-gray-300' : 'border-gray-100 hover:bg-gray-50 text-gray-650'}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {post.images?.[0] ? (
                          <img src={post.images[0]} alt="" className={`w-10 h-10 rounded-lg object-cover flex-shrink-0 border ${isDarkMode ? 'border-[#22253f]' : 'border-gray-200'}`} />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border
                            ${isDarkMode ? 'bg-[#1a1b30] border-[#2d2f54] text-gray-500' : 'bg-gray-100 border-gray-250 text-gray-400'}`}>
                            <ImageIcon size={16} className="text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className={`font-bold leading-tight line-clamp-1 max-w-[160px] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{post.title}</p>
                          <p className="text-[11px] text-gray-500 font-medium capitalize">{post.category || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-gray-400">
                        <MapPin size={12} className="text-[#f44336]" />
                        <span className="truncate max-w-[120px]">{post.location || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0
                          ${isDarkMode ? 'bg-[#1d1f38] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                          {post.createdBy?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium">{post.createdBy?.username || t.anonymous}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-gray-450">{fmt(post.createdAt, locale)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border
                        ${post.isHidden 
                          ? (isDarkMode ? 'bg-red-950/40 text-red-400 border-red-900/30' : 'bg-red-50 text-red-600 border-red-100')
                          : (isDarkMode ? 'bg-green-950/40 text-green-400 border-green-900/30' : 'bg-green-50 text-green-600 border-green-100')}`}>
                        {post.isHidden ? <><EyeOff size={11}/> {t.hide}</> : <><Eye size={11}/> {t.show}</>}
                      </span>
                    </td>
                    <td className="hidden md:table-cell font-bold">{post.likes?.length || 0}</td>
                    <td className="px-4 py-3.5">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenu?.id === post._id) {
                              setOpenMenu(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setOpenMenu({
                                id: post._id,
                                title: post.title,
                                isHidden: post.isHidden,
                                rect: {
                                  top: rect.bottom,
                                  left: rect.right
                                }
                              });
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors cursor-pointer
                            ${isDarkMode ? 'text-gray-500 hover:text-white hover:bg-[#1a1b30]' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-55'}`}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openMenu && createPortal(
        <>
          <div className="fixed inset-0 z-[190] bg-transparent" onClick={() => setOpenMenu(null)} />
          <div 
            className={`fixed z-[200] w-44 border rounded-xl shadow-2xl p-1
              ${isDarkMode ? 'bg-[#18192a] border-[#2d2f54] text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}
            style={{
              top: `${openMenu.rect.top + 4}px`,
              left: `${openMenu.rect.left - 176}px`,
            }}
          >
            <button
              onClick={() => handleToggleVisibility(openMenu.id, openMenu.isHidden)}
              className={`w-full text-left px-3 py-2 text-[12px] font-bold rounded-lg flex items-center gap-2 cursor-pointer
                ${isDarkMode ? 'hover:bg-[#22243d]' : 'hover:bg-gray-50'}`}
            >
              {openMenu.isHidden ? <><Eye size={14}/> {t.showPost}</> : <><EyeOff size={14}/> {t.hidePost}</>}
            </button>
            <button
              onClick={() => {
                setOpenMenu(null);
                setConfirm({ id: openMenu.id, title: t.deletePostTitle, desc: `"${openMenu.title}" ${t.permanentDelete}` });
              }}
              className={`w-full text-left px-3 py-2 text-[12px] font-bold rounded-lg flex items-center gap-2 cursor-pointer
                ${isDarkMode ? 'text-red-400 hover:bg-red-950/20' : 'text-red-600 hover:bg-red-50'}`}
            >
              <Trash2 size={14}/> {t.deletePost}
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB: QUẢN LÝ NGƯỜI DÙNG
// ════════════════════════════════════════════════════════════════
function UsersTab({ users: parentUsers, posts: parentPosts, loading, fetchDashboardData, showToast, t, isDarkMode }) {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const postCountByUser = useMemo(() => {
    const counts = {};
    if (Array.isArray(parentPosts)) {
      parentPosts.forEach((post) => {
        const userId = post.createdBy?._id;
        if (userId) counts[userId] = (counts[userId] || 0) + 1;
      });
    }
    return counts;
  }, [parentPosts]);

  const users = useMemo(() => {
    return Array.isArray(parentUsers)
      ? parentUsers.map((user) => ({
          ...user,
          role: normalizeRole(user.role),
          postCount: postCountByUser[user._id] || user.postCount || 0,
        }))
      : [];
  }, [parentUsers, postCountByUser]);

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
      await fetchDashboardData();
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
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: t.totalUsers, value: stats.total, color: isDarkMode ? 'text-white' : 'text-gray-900' },
          { label: t.admin, value: stats.admin, color: 'text-red-500' },
          { label: t.user, value: stats.user, color: 'text-gray-500' },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl p-4 border shadow-sm
            ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
            <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border shadow-sm mb-4 p-4 flex flex-wrap gap-3 items-center justify-between
        ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
        <div className="flex gap-2 items-center flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-550" size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.searchUsers}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-[13px] font-medium border focus:outline-none focus:ring-2 focus:ring-red-500/30
                ${isDarkMode ? 'bg-[#1a1b30] text-white border-[#2d2f54] placeholder-gray-550' : 'bg-gray-55 text-gray-900 border-gray-250 placeholder-gray-400'}`}
            />
          </div>
          <select
            value={filterRole}
            onChange={(event) => setFilterRole(event.target.value)}
            className={`border rounded-xl px-3 py-2 text-[13px] font-bold focus:outline-none cursor-pointer
              ${isDarkMode ? 'bg-[#1a1b30] text-white border-[#2d2f54]' : 'bg-gray-50 text-gray-700 border-gray-250'}`}
          >
            <option value="all">{t.allRoles}</option>
            <option value="admin">{t.admin}</option>
            <option value="user">{t.user}</option>
          </select>
        </div>
        <button onClick={fetchDashboardData} className={`flex items-center gap-2 text-[13px] font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer
          ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#1a1b30]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
          <RefreshCw size={14}/> {t.reload}
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden
        ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-[#f44336] border-t-transparent rounded-full"/>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <User size={32} className="mx-auto mb-2 opacity-30"/>
            <p className="text-[13px] font-medium">{t.noUsersFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            <table className="w-full text-[13px]">
              <thead className={`sticky top-0 z-10 shadow-[0_1px_0_0_#22253f] ${isDarkMode ? 'bg-[#0e0f1e] text-gray-450' : 'bg-gray-50 text-gray-500'}`}>
                <tr className="border-b">
                  <th className="text-left px-5 py-3 font-black text-[11px] uppercase tracking-wider">{t.users}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider hidden md:table-cell">{t.role}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider hidden lg:table-cell">{t.post}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider">{t.accountStatus}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className={`border-b transition-colors
                    ${isDarkMode ? 'border-[#1b1c31] hover:bg-[#1a1c32] text-gray-300' : 'border-gray-100 hover:bg-gray-55 text-gray-650'}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover border flex-shrink-0" />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black flex-shrink-0 border
                            ${isDarkMode ? 'bg-[#1a1b30] border-[#2d2f54] text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                            {user.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.username}</p>
                          <p className="text-[11px] text-gray-500">{user.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-black ${roleColor(isDarkMode, user.role)}`}>
                        {roleLabel[normalizeRole(user.role)] || 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold hidden lg:table-cell">
                      {user.postCount || 0} {t.postsCountSuffix}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-black border
                        ${user.isBanned 
                          ? (isDarkMode ? 'bg-red-950/40 text-red-400 border-red-900/30' : 'bg-red-50 text-red-600 border-red-100')
                          : (isDarkMode ? 'bg-green-950/40 text-green-400 border-green-900/30' : 'bg-green-50 text-green-600 border-green-100')}`}>
                        {user.isBanned ? t.bannedStatus : t.activeStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {user._id === localStorage.getItem('userId') ? (
                        <span className={`inline-block px-3 py-1.5 text-[12px] font-bold border rounded-lg cursor-not-allowed
                          ${isDarkMode ? 'text-gray-500 bg-[#161726] border-[#22253f]' : 'text-gray-400 bg-gray-50 border-gray-200'}`}>
                          Chính bạn
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleBan(user._id)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors cursor-pointer
                            ${user.isBanned 
                              ? 'bg-green-950/40 text-green-400 hover:bg-green-900/30 border-green-900/40' 
                              : 'bg-red-950/40 text-red-400 hover:bg-red-900/30 border-red-900/40'}`}
                        >
                          {user.isBanned ? t.unbanUser : t.banUser}
                        </button>
                      )}
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
function ReportsTab({ reports, loading, fetchReports, fetchDashboardData, showToast, t, locale, isDarkMode }) {
  const [confirm, setConfirm] = useState(null); // { type: 'dismiss'|'ban_user'|'delete_post', reportId: string, title: string, desc: string }
  const [processing, setProcessing] = useState(false);

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
      if (fetchDashboardData) fetchDashboardData();
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
        <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4">
          <div className={`border rounded-2xl shadow-2xl p-6 w-full max-w-sm
            ${isDarkMode ? 'bg-[#131526] border-[#2c3052] text-white' : 'bg-white border-gray-250 text-gray-900'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-950/40 border border-amber-900/50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <h3 className="text-[15px] font-black">{confirm.title}</h3>
            </div>
            <p className="text-[13px] text-gray-400 font-medium mb-6 pl-[52px]">{confirm.desc}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirm(null)} 
                disabled={processing}
                className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-colors cursor-pointer
                  ${isDarkMode ? 'text-gray-300 bg-[#22253f] hover:bg-[#2c3052]' : 'text-gray-650 bg-gray-100 hover:bg-gray-200'}`}
              >
                {t.cancel}
              </button>
              <button 
                onClick={() => handleAction(confirm.reportId, confirm.type)} 
                disabled={processing}
                className="px-4 py-2 text-[13px] font-bold text-white bg-red-600 hover:bg-red-750 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
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
          { label: 'Tổng số báo cáo', value: reports.length, color: isDarkMode ? 'text-white' : 'text-gray-900' },
          { label: 'Chưa xử lý', value: pendingReports.length, color: 'text-red-400 font-black' },
          { label: 'Đã xử lý / Bỏ qua', value: resolvedReports.length, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 border shadow-sm
            ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-[15px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.manageReports}</h3>
        <button onClick={fetchReports} className={`flex items-center gap-2 text-[13px] font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer
          ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#1a1b30]' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'}`}>
          <RefreshCw size={14} /> {t.reload}
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden
        ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-[#f44336] border-t-transparent rounded-full" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-[13px] font-medium">{t.noReportsFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-[#22253f] bg-[#0e0f1e] text-gray-450' : 'border-gray-150 bg-gray-50 text-gray-500'}`}>
                  <th className="text-left px-5 py-3 font-black text-[11px] uppercase tracking-wider">{t.reporter}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider">{t.target}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider">{t.reason}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider">{t.status}</th>
                  <th className="text-left px-4 py-3 font-black text-[11px] uppercase tracking-wider">{t.action}</th>
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
                    <tr key={report._id} className={`border-b transition-colors
                      ${isDarkMode ? 'border-[#1b1c31] hover:bg-[#1a1c32] text-gray-300' : 'border-gray-100 hover:bg-gray-50 text-gray-650'}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border
                            ${isDarkMode ? 'bg-[#1a1b30] border-[#22253f]' : 'bg-gray-100 border-gray-200'}`}>
                            {report.reporter?.avatar ? (
                              <img src={report.reporter.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-gray-400 bg-blue-900/20 text-blue-400">
                                {report.reporter?.username?.[0]?.toUpperCase() || 'AI'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{report.reporter?.username || 'Hệ thống AI'}</p>
                            <p className="text-[10px] text-gray-500">{report.reporter?.email || 'Tự động quét'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase mb-1 border
                            ${report.targetType === 'post' 
                              ? (isDarkMode ? 'bg-blue-955/40 text-blue-400 border-blue-900/30' : 'bg-blue-50 text-blue-600 border-blue-100')
                              : report.targetType === 'message' || report.targetType === 'comment'
                              ? (isDarkMode ? 'bg-orange-955/40 text-orange-400 border-orange-900/30' : 'bg-orange-50 text-orange-600 border-orange-100')
                              : (isDarkMode ? 'bg-purple-955/40 text-purple-400 border-purple-900/30' : 'bg-purple-50 text-purple-600 border-purple-100')}`}>
                            {report.targetType === 'post' ? t.targetPost : report.targetType === 'message' ? 'Tin nhắn' : report.targetType === 'comment' ? 'Bình luận' : t.targetUser}
                          </span>
                          <p className={`font-bold line-clamp-1 max-w-[200px] ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{targetName}</p>
                          {targetSub && <p className="text-[10px] text-gray-500">{targetSub}</p>}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-850'}`}>{report.reason}</p>
                          {report.details && (
                            <p className="text-[11px] text-gray-400 line-clamp-2 max-w-[200px]" title={report.details}>
                              {report.details}
                            </p>
                          )}
                          <p className="text-[9px] text-gray-505 mt-1">
                            {new Date(report.createdAt).toLocaleString(locale)}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border
                          ${report.status === 'pending' 
                            ? (isDarkMode ? 'bg-amber-955/40 text-amber-400 border-amber-900/30' : 'bg-amber-50 text-amber-600 border-amber-200') : 
                            report.status === 'dismissed' 
                            ? (isDarkMode ? 'bg-gray-800 text-gray-400 border-gray-700/30' : 'bg-gray-100 text-gray-500 border-gray-200') 
                            : (isDarkMode ? 'bg-green-955/40 text-green-400 border-green-900/30' : 'bg-green-50 text-green-600 border-green-200')}`}>
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
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer
                                ${isDarkMode ? 'text-gray-300 bg-[#22253f] hover:bg-[#2c3052]' : 'text-gray-650 bg-gray-100 hover:bg-gray-200'}`}
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
                                className={`px-2.5 py-1 text-[11px] font-bold border rounded-lg transition-colors cursor-pointer
                                  ${isDarkMode ? 'text-red-400 bg-red-950/20 hover:bg-red-900/30 border-red-900/30' : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-150'}`}
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
                                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors cursor-pointer"
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
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-red-600 hover:bg-red-750 rounded-lg transition-colors cursor-pointer"
                                >
                                  {t.banUser}
                                </button>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-bold">—</span>
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

// ════════════════════════════════════════════════════════════════
// TAB: DASHBOARD (ADMIN DASHBOARD / LEADERSHIP MONITORING)
// ════════════════════════════════════════════════════════════════
function DashboardTab({ 
  stats, loading, onRefresh, onOpenTab, t, 
  pendingReportsCount, categoryCounts, recentActivities, language,
  reports, handleActionInDashboard, posts, isDarkMode, showToast
}) {
  const totalPosts = stats.totalPosts || 0;

  // Extract counts for location-based horizontal bars (Top 4 cities in Vietnam)
  const getCityCounts = () => {
    const locations = {};
    posts.forEach(p => {
      let city = 'Khác';
      const locStr = p.location || '';
      if (locStr.includes('Hà Nội')) city = 'Hà Nội';
      else if (locStr.includes('Đà Nẵng')) city = 'Đà Nẵng';
      else if (locStr.includes('Hồ Chí Minh') || locStr.includes('Sài Gòn')) city = 'TP. Hồ Chí Minh';
      else if (locStr.includes('Sa Pa') || locStr.includes('Lào Cai')) city = 'Sa Pa';
      else if (locStr.includes('Nha Trang') || locStr.includes('Khánh Hòa')) city = 'Nha Trang';
      else if (locStr.includes('Đà Lạt') || locStr.includes('Lâm Đồng')) city = 'Đà Lạt';
      else if (locStr.includes('Vịnh Hạ Long') || locStr.includes('Quảng Ninh')) city = 'Hạ Long';
      else if (locStr.includes('Hội An')) city = 'Hội An';
      
      locations[city] = (locations[city] || 0) + 1;
    });
    return Object.entries(locations).sort((a, b) => b[1] - a[1]).slice(0, 4);
  };

  const cityData = getCityCounts();
  const maxCityCount = cityData.length > 0 ? Math.max(...cityData.map(c => c[1])) : 1;

  // Category counts max value for vertical scaling
  const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);

  // AI Trend predictions
  const trendingDestinations = posts
    .map(p => {
      // Simple custom score based on interaction
      const score = (p.likes?.length || 0) * 12 + (p.totalReviews || 0) * 8 + (p.averageRating || 0) * 15;
      const roundedScore = Math.min(100, Math.round(score));
      let riskLabel = 'TIỀM NĂNG';
      let riskClass = isDarkMode 
        ? 'bg-blue-955/40 text-blue-400 border border-blue-900/50' 
        : 'bg-blue-50 text-blue-600 border border-blue-200';
      if (roundedScore > 85) {
        riskLabel = language === 'en' ? 'HIGH TRENDING' : 'XU HƯỚNG RẤT CAO';
        riskClass = isDarkMode 
          ? 'bg-red-955/40 text-red-400 border border-red-900/50' 
          : 'bg-red-50 text-red-650 border border-red-200';
      } else if (roundedScore > 65) {
        riskLabel = language === 'en' ? 'HOT DESTINATION' : 'ĐIỂM ĐẾN HOT';
        riskClass = isDarkMode 
          ? 'bg-amber-955/40 text-amber-400 border border-amber-900/50' 
          : 'bg-amber-50 text-amber-600 border border-amber-200';
      }
      return {
        id: p._id,
        title: p.title,
        category: p.category || 'Du lịch',
        location: p.location || 'Việt Nam',
        hotness: roundedScore,
        label: riskLabel,
        labelClass: riskClass,
        code: `TRD-${p._id?.toString().slice(-5).toUpperCase()}`
      };
    })
    .sort((a, b) => b.hotness - a.hotness)
    .slice(0, 9); // Grid of 9 elements

  // Pending approval list
  const pendingReportsList = reports.filter(r => r.status === 'pending').slice(0, 3);

  // Hidden percent for doughnut conic gradient
  const hiddenPercent = totalPosts > 0 ? Math.round((stats.hiddenPosts / totalPosts) * 100) : 0;
  const visiblePercent = 100 - hiddenPercent;

  return (
    <div className="space-y-6">
      {/* HEADER STRIP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Lãnh Đạo / Admin</h1>
          <p className="text-[13px] text-gray-500 font-medium">{t.dashboardOverview}</p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => onOpenTab('dashboard')} className="px-4 py-2 text-[12px] font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg cursor-pointer">
            Tổng hợp
          </button>
          <button onClick={() => showToast('success', language === 'en' ? 'Exporting to Excel...' : 'Đang xuất file Excel...')} className={`px-4 py-2 text-[12px] font-bold rounded-xl transition-colors cursor-pointer border
            ${isDarkMode ? 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30 hover:bg-[#10b981]/25' : 'text-[#10b981] bg-[#10b981]/5 border-[#10b981]/20 hover:bg-[#10b981]/15'}`}>
            Xuất Excel
          </button>
          <button onClick={() => showToast('success', language === 'en' ? 'Exporting to PDF...' : 'Đang xuất file PDF...')} className={`px-4 py-2 text-[12px] font-bold rounded-xl transition-colors cursor-pointer border
            ${isDarkMode ? 'text-red-400 bg-red-950/30 border-red-900/30 hover:bg-red-950/50' : 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'}`}>
            Xuất PDF
          </button>
          <button onClick={onRefresh} className={`p-2.5 rounded-xl border transition-colors cursor-pointer
            ${isDarkMode ? 'text-gray-400 hover:text-white bg-[#131526] border-[#22253f] hover:bg-[#1d1f38]' : 'text-gray-500 hover:text-gray-900 bg-white border-gray-200 hover:bg-gray-50'}`}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* METRIC CARDS - 4 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { 
            label: 'Tổng bài viết quản lý', 
            value: stats.totalPosts, 
            icon: FileText,
            color: isDarkMode ? 'text-white' : 'text-gray-900',
            accent: isDarkMode ? 'border-blue-900/50 bg-[#131526] hover:border-blue-500/30' : 'border-gray-200 bg-white hover:border-blue-400 shadow-sm',
            iconColor: 'text-blue-400 bg-blue-955/40 border border-blue-900/30'
          },
          { 
            label: 'Bài viết hiển thị (Tốt)', 
            value: stats.visiblePosts, 
            icon: CheckCircle,
            color: 'text-[#10b981]',
            accent: isDarkMode ? 'border-green-900/50 bg-[#131526] hover:border-green-500/30' : 'border-gray-200 bg-white hover:border-green-400 shadow-sm',
            iconColor: 'text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/30'
          },
          { 
            label: 'Tài khoản bị khóa', 
            value: stats.totalUsers - stats.userUsers,
            icon: Wrench,
            color: 'text-purple-400',
            accent: isDarkMode ? 'border-purple-900/50 bg-[#131526] hover:border-purple-500/30' : 'border-gray-200 bg-white hover:border-purple-400 shadow-sm',
            iconColor: 'text-purple-400 bg-purple-955/40 border border-purple-900/30'
          },
          { 
            label: 'Báo cáo chưa xử lý', 
            value: pendingReportsCount, 
            icon: AlertTriangle,
            color: 'text-[#f59e0b]',
            accent: isDarkMode ? 'border-amber-900/50 bg-[#131526] hover:border-amber-500/30 cursor-pointer' : 'border-gray-200 bg-white hover:border-amber-400 shadow-sm cursor-pointer',
            iconColor: 'text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30',
            onClick: () => onOpenTab('reports')
          },
        ].map((item, idx) => {
          const Tag = item.onClick ? 'button' : 'div';
          return (
            <Tag 
              key={idx}
              onClick={item.onClick}
              className={`rounded-2xl p-5 border text-left flex items-center justify-between transition-all group
                ${item.accent}`}
            >
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">{item.label}</p>
                <p className={`text-3xl font-black tracking-tight ${item.color}`}>{loading ? '...' : item.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.iconColor} group-hover:scale-110 transition-transform`}>
                <item.icon size={22} strokeWidth={2.5} />
              </div>
            </Tag>
          );
        })}
      </div>

      {/* CHỜ PHÊ DUYỆT MỚI (Pending Reports Approval Strip) */}
      <div className={`border rounded-2xl p-5 shadow-sm
        ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className={`text-[14px] font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>⚡ Chờ Phê Duyệt Mới</h2>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-955 text-amber-400 border border-amber-900/30">
            {pendingReportsCount} yêu cầu
          </span>
        </div>

        {pendingReportsList.length === 0 ? (
          <p className="text-[12px] text-gray-500 py-4 text-center">Không có báo cáo vi phạm nào cần xử lý.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            {pendingReportsList.map((rep) => {
              const isPost = rep.targetType === 'post';
              const targetObj = isPost ? rep.targetPost : rep.targetUser;
              let titleText = isPost ? (targetObj?.title || 'Bài đăng vi phạm') : rep.targetType === 'message' ? `Tin nhắn của ${targetObj?.username}` : rep.targetType === 'comment' ? `Bình luận của ${targetObj?.username}` : (targetObj?.username || 'Tài khoản vi phạm');
              let subText = isPost ? `Mã: POST-${rep.targetPost?._id.slice(-5).toUpperCase()} | Tác giả: ${targetObj?.createdBy?.username || t.anonymous}` 
                                   : `Mã: ${rep.targetType.toUpperCase()}-${(rep.targetUser?._id || rep._id).slice(-5).toUpperCase()} | Email: ${targetObj?.email || '—'}`;
              return (
                <div key={rep._id} className={`border rounded-xl p-4 min-w-[280px] md:min-w-[340px] flex-shrink-0 flex flex-col justify-between hover:border-amber-500/30 transition-colors
                  ${isDarkMode ? 'bg-[#181b30] border-[#2a2d4e]' : 'bg-gray-50 border-gray-200'}`}>
                  <div>
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-red-955/40 border border-red-900/30 flex items-center justify-center flex-shrink-0 text-red-400 mt-0.5">
                        <AlertTriangle size={12} />
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-[13px] font-black leading-snug line-clamp-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={titleText}>{titleText}</h4>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{subText}</p>
                      </div>
                    </div>
                    <div className={`rounded-lg p-2.5 mb-4 border
                      ${isDarkMode ? 'bg-[#121324] border-[#22253f]' : 'bg-white border-gray-150'}`}>
                      <p className="text-[11px] font-bold text-gray-400 line-clamp-2 leading-relaxed">
                        <strong className="text-amber-500">Lý do:</strong> {rep.reason} {rep.details ? `— ${rep.details}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleActionInDashboard(rep._id, 'dismiss')}
                      className="flex-1 py-1.5 text-[11px] font-bold text-green-400 bg-green-955/20 hover:bg-green-950/45 border border-green-900/50 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCircle size={12} /> Duyệt
                    </button>
                    <button 
                      onClick={() => handleActionInDashboard(rep._id, isPost ? 'delete_post' : 'ban_user')}
                      className="flex-1 py-1.5 text-[11px] font-bold text-red-400 bg-red-955/20 hover:bg-red-950/45 border border-red-900/50 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <XCircle size={12} /> Từ chối
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROW 1 LEFT: DOUGHNUT CHART */}
        <div className={`border rounded-2xl p-6 flex flex-col justify-between min-h-[300px] shadow-sm
          ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
          <h3 className={`text-[14px] font-black uppercase tracking-wider mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bài đăng theo Tình trạng</h3>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* SVG/Conic Doughnut */}
            <div 
              className={`relative w-36 h-36 rounded-full flex items-center justify-center shadow-lg border
                ${isDarkMode ? 'border-[#2b2e4f]/35' : 'border-gray-250/50'}`}
              style={{
                background: totalPosts > 0
                  ? `conic-gradient(#ef4444 0% ${hiddenPercent}%, #10b981 ${hiddenPercent}% 100%)`
                  : '#1d1f38'
              }}
            >
              <div className={`absolute w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-inner
                ${isDarkMode ? 'bg-[#131526]' : 'bg-white'}`}>
                <span className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalPosts}</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{t.post}</span>
              </div>
            </div>

            {/* Legend info */}
            <div className="space-y-4 w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                <div>
                  <p className={`text-[12px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-950'}`}>Bài viết bị ẩn</p>
                  <p className="text-[11px] text-gray-500 font-bold">{stats.hiddenPosts} bài viết ({hiddenPercent}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                <div>
                  <p className={`text-[12px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-955'}`}>Bài viết hoạt động</p>
                  <p className="text-[11px] text-gray-500 font-bold">{stats.visiblePosts} bài viết ({visiblePercent}%)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 1 RIGHT: VERTICAL BAR CHART */}
        <div className={`border rounded-2xl p-6 min-h-[300px] flex flex-col justify-between shadow-sm
          ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
          <h3 className={`text-[14px] font-black uppercase tracking-wider mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.categoryDistributionTitle}</h3>
          {totalPosts === 0 ? (
            <p className="text-[12px] text-gray-500 text-center py-12">Không có dữ liệu phân mục</p>
          ) : (
            <div className={`flex items-end justify-around h-44 border-b pb-2 px-2
              ${isDarkMode ? 'border-[#22253f]' : 'border-gray-150'}`}>
              {Object.entries(categoryCounts).slice(0, 6).map(([cat, count], idx) => {
                const heightPercent = maxCategoryCount > 0 ? Math.round((count / maxCategoryCount) * 100) : 0;
                // Array of bar gradients for premium aesthetic
                const gradients = [
                  'bg-gradient-to-t from-blue-700 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
                  'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
                  'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
                  'bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
                  'bg-gradient-to-t from-purple-600 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
                  'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
                ];
                return (
                  <div key={cat} className="flex flex-col items-center flex-1 group relative">
                    <span className={`text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 px-1.5 py-0.5 rounded border z-10
                      ${isDarkMode ? 'bg-[#1a1c32] text-gray-300 border-[#2d2f54]' : 'bg-white text-gray-700 border-gray-200 shadow'}`}>
                      {count}
                    </span>
                    <div 
                      className={`w-6 sm:w-8 rounded-t-md transition-all duration-700 ${gradients[idx % gradients.length]}`} 
                      style={{ height: `${Math.max(8, heightPercent * 1.3)}px` }}
                    />
                    <p className="text-[9px] font-bold text-gray-500 truncate max-w-[50px] sm:max-w-[70px] mt-2 group-hover:text-red-500 transition-colors" title={cat}>
                      {cat}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ROW 2 LEFT: HORIZONTAL BAR CHART */}
        <div className={`border rounded-2xl p-6 min-h-[300px] flex flex-col justify-between shadow-sm
          ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
          <h3 className={`text-[14px] font-black uppercase tracking-wider mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bài viết theo Khu vực (Tỉnh thành)</h3>
          {cityData.length === 0 ? (
            <p className="text-[12px] text-gray-500 text-center py-12">Không có dữ liệu địa điểm</p>
          ) : (
            <div className="space-y-4 py-2 flex-1 flex flex-col justify-center">
              {cityData.map(([city, count]) => {
                const widthPercent = maxCityCount > 0 ? Math.round((count / maxCityCount) * 100) : 0;
                return (
                  <div key={city} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-750'}`}>{city}</span>
                      <span className="text-gray-500">{count} bài viết</span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden border
                      ${isDarkMode ? 'bg-[#181a2e] border-[#22253f]' : 'bg-gray-100 border-gray-200'}`}>
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]" 
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ROW 2 RIGHT: ACCOUNTS NEEDING ATTENTION */}
        <div className={`border rounded-2xl p-6 min-h-[300px] flex flex-col justify-between shadow-sm
          ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-[14px] font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cần Ưu Tiên Xử Lý / Giao Việc</h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-955 text-red-400 border border-red-900/30">
              {pendingReportsCount} điểm nóng
            </span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {pendingReportsList.map((rep, idx) => {
              const isPost = rep.targetType === 'post';
              const targetObj = isPost ? rep.targetPost : rep.targetUser;
              let name = isPost ? (targetObj?.title || 'Bài viết bị tố cáo') : rep.targetType === 'message' ? `Tin nhắn của ${targetObj?.username}` : rep.targetType === 'comment' ? `Bình luận của ${targetObj?.username}` : (targetObj?.username || 'Người dùng bị tố cáo');
              let sub = isPost ? `Mã: REP-${rep._id.slice(-5).toUpperCase()}` : `Mã: ${rep.targetType.toUpperCase()}-${rep._id.slice(-5).toUpperCase()}`;

              return (
                <div key={rep._id} className={`flex items-center justify-between p-3 rounded-xl border
                  ${isDarkMode ? 'bg-[#181b30] border-[#2a2d4e]' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="min-w-0">
                    <p className={`text-[12px] font-black truncate max-w-[150px] sm:max-w-[200px] ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={name}>{name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
                  </div>
                  <button 
                    onClick={() => onOpenTab('reports')}
                    className="px-3 py-1.5 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-md shadow-purple-900/20"
                  >
                    Giao việc
                  </button>
                </div>
              );
            })}
            {pendingReportsList.length === 0 && (
              <p className="text-[12px] text-gray-500 text-center py-8">Chưa có sự cố nghiêm trọng nào cần giải quyết gấp.</p>
            )}
          </div>
        </div>
      </div>

      {/* DỰ BÁO NHU CẦU BẢO TRÌ HẠ TẦNG (AI & Wear Analytics / Destination Trends Analytics) */}
      <div className={`border rounded-2xl p-6 shadow-sm
        ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className={`text-[14px] font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>📈 Dự Báo Điểm Đến Xu Hướng (AI Travel Analytics & Trend Prediction)</h2>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-955 text-amber-400 border border-amber-900/30">
              {trendingDestinations.length} điểm tiềm năng cao
            </span>
          </div>
        </div>

        {trendingDestinations.length === 0 ? (
          <p className="text-[12px] text-gray-500 py-8 text-center">Đang phân tích xu hướng thị trường...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {trendingDestinations.map((dest) => (
              <div key={dest.id} className={`border rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-950/10
                ${isDarkMode ? 'bg-[#181b30] border-[#252845]' : 'bg-gray-50 border-gray-205'}`}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider ${dest.labelClass}`}>
                      {dest.label}
                    </span>
                    <span className="text-[10px] font-black text-blue-400">
                      Độ hot: {dest.hotness}%
                    </span>
                  </div>
                  <h4 className={`text-[13px] font-black leading-snug line-clamp-1 mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={dest.title}>{dest.title}</h4>
                  <p className="text-[10px] text-gray-500">Mã: {dest.code} | {dest.category}</p>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-gray-405">
                    <MapPin size={11} className="text-[#f44336]" />
                    <span className="text-[10px] font-bold truncate max-w-[200px]">{dest.location}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden border
                    ${isDarkMode ? 'bg-[#111221] border-[#20223a]' : 'bg-gray-150 border-gray-250'}`}>
                    <div 
                      className="bg-gradient-to-r from-red-500 to-rose-400 h-full rounded-full shadow-[0_0_6px_#ef4444]" 
                      style={{ width: `${dest.hotness}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ADMIN PANEL MAIN
// ════════════════════════════════════════════════════════════════
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

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);

  // Theme state: defaults to dark theme (true)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('adminTheme');
    return saved !== null ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('adminTheme', next ? 'dark' : 'light');
      return next;
    });
  };

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await fetch(`${API}/reports`, { headers: authHeader() });
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch {
      showToast('error', t.cannotLoadReports || 'Lỗi tải danh sách báo cáo');
    } finally {
      setReportsLoading(false);
    }
  }, [showToast, t.cannotLoadReports]);

  const fetchDashboardData = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const [profileRes, postsRes, usersRes] = await Promise.all([
        fetch(`${API}/profile`, { headers: authHeader() }),
        fetch(`${API}/posts`, { headers: authHeader() }),
        fetch(`${API}/users/search?includeSelf=true`, { headers: authHeader() }),
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
      const postsList = Array.isArray(postsData) ? postsData : [];
      const usersList = Array.isArray(usersData) ? usersData : [];
      
      setPosts(postsList);
      setUsers(usersList);

      setDashboardStats({
        totalPosts: postsList.length,
        visiblePosts: postsList.filter((post) => !post.isHidden).length,
        hiddenPosts: postsList.filter((post) => post.isHidden).length,
        totalUsers: usersList.length,
        adminUsers: usersList.filter((user) => normalizeRole(user.role) === 'admin').length,
        userUsers: usersList.filter((user) => normalizeRole(user.role) !== 'admin').length,
      });
    } catch {
      showToast('error', t.cannotLoadDashboard);
    } finally {
      setDashboardLoading(false);
    }
  }, [showToast, t.cannotLoadDashboard]);

  useEffect(() => {
    fetchDashboardData();
    fetchReports();
  }, [fetchDashboardData, fetchReports]);

  // Handle report action inside the Dashboard Carousel directly
  const handleActionInDashboard = async (reportId, action) => {
    try {
      const res = await fetch(`${API}/reports/${reportId}/action`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      showToast('success', data.message || t.reportProcessed);
      // Refresh reports lists and main stats
      fetchReports();
      fetchDashboardData();
    } catch {
      showToast('error', 'Có lỗi xảy ra khi xử lý báo cáo.');
    }
  };

  const getCategoryDistribution = () => {
    const counts = {};
    posts.forEach(p => {
      const cat = p.category || (language === 'en' ? 'Uncategorized' : 'Chưa phân loại');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  };

  const getRecentActivities = () => {
    const activities = [];
    
    // Add users
    users.slice(0, 4).forEach(u => {
      activities.push({
        id: `user_${u._id}`,
        type: 'user',
        title: language === 'en' ? `New user registered: ${u.username}` : `Người dùng mới đăng ký: ${u.username}`,
        detail: u.email || '—',
        createdAt: new Date(u.createdAt || Date.now()),
      });
    });

    // Add posts
    posts.slice(0, 4).forEach(p => {
      activities.push({
        id: `post_${p._id}`,
        type: 'post',
        title: language === 'en' ? `New travel guide: ${p.title}` : `Bài viết mới: ${p.title}`,
        detail: `${language === 'en' ? 'By' : 'Tác giả'}: ${p.createdBy?.username || t.anonymous} | ${p.location || ''}`,
        createdAt: new Date(p.createdAt || Date.now()),
      });
    });

    // Add reports
    reports.slice(0, 4).forEach(r => {
      const targetName = r.targetType === 'post' 
        ? (r.targetPost?.title || 'Bài viết')
        : (r.targetUser?.username || 'Người dùng');
      activities.push({
        id: `report_${r._id}`,
        type: 'report',
        title: language === 'en' 
          ? `Reported ${r.targetType}: ${targetName}`
          : `Báo cáo ${r.targetType === 'post' ? 'bài viết' : 'người dùng'}: ${targetName}`,
        detail: `${language === 'en' ? 'Reason' : 'Lý do'}: ${r.reason} (${r.status === 'pending' ? (language === 'en' ? 'Pending' : 'Chờ duyệt') : (language === 'en' ? 'Resolved' : 'Đã xử lý')})`,
        createdAt: new Date(r.createdAt || Date.now()),
        status: r.status,
      });
    });

    return activities.sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  };

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'posts', icon: FileText, label: t.postsNav },
    { id: 'users', icon: Users, label: t.usersNav },
    { id: 'reports', icon: AlertTriangle, label: t.reportsNav, badge: pendingReportsCount },
  ];

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-300
      ${isDarkMode ? 'bg-[#0c0d19] text-gray-100' : 'bg-[#f8f9fa] text-gray-900'}`}>
      <Toast toast={toast} onClose={() => setToast({ type: '', text: '' })} isDarkMode={isDarkMode} />

      {/* STYLE INJECTION FOR PREMIUM SCROLLBARS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#0f101d' : '#f0f0f5'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#2b2e4f' : '#c0c0d5'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f44336;
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className={`w-[240px] border-r flex flex-col flex-shrink-0 transition-colors duration-300
        ${isDarkMode ? 'bg-[#0e0f1e] border-[#1b1c31]' : 'bg-white border-gray-250'}`}>
        <div className={`p-6 border-b ${isDarkMode ? 'border-[#1b1c31]' : 'border-gray-200'}`}>
          <h1 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>The Wanderer</h1>
          <p className="text-[11px] font-bold text-gray-500 mt-0.5">{t.adminPanel}</p>
        </div>

        <nav className="p-4 flex-1 space-y-1">
          {navItems.map(({ id, icon: Icon, label, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all cursor-pointer
                ${activeTab === id 
                  ? (isDarkMode ? 'bg-red-955/20 text-[#f44336]' : 'bg-red-50 text-[#f44336]') 
                  : (isDarkMode ? 'text-gray-400 hover:bg-[#131526] hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950')}`}
            >
              <span className="flex items-center gap-3"><Icon size={18} strokeWidth={2.5}/>{label}</span>
              {badge > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(244,67,54,0.4)]
                  ${activeTab === id ? 'bg-[#f44336] text-white' : 'bg-amber-950 text-amber-400 border border-amber-900/30'}`}>
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
        <header className={`h-[64px] border-b flex items-center justify-between px-8 flex-shrink-0 transition-colors duration-300
          ${isDarkMode ? 'bg-[#0e0f1e] border-[#1b1c31]' : 'bg-white border-gray-200'}`}>
          <div>
            <h2 className={`text-[16px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {activeTab === 'dashboard' && t.dashboard}
              {activeTab === 'posts' && t.managePosts}
              {activeTab === 'users' && t.manageUsers}
              {activeTab === 'reports' && t.manageReports}
              {activeTab === 'profile' && t.adminProfile}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* DARK / LIGHT THEME TOGGLER BUTTON */}
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-xl transition-all border cursor-pointer
                ${isDarkMode 
                  ? 'text-yellow-400 border-[#22253f] bg-[#131526] hover:bg-[#1d1f38]' 
                  : 'text-purple-600 border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
            </button>

            <button className="text-gray-405 hover:text-[#f44336] transition-colors relative cursor-pointer">
              <Bell size={20} strokeWidth={2}/>
            </button>
            <button onClick={() => setActiveTab('profile')} className="text-gray-405 hover:text-[#f44336] transition-colors cursor-pointer">
              <Settings size={20} strokeWidth={2}/>
            </button>
            <AccountMenu avatar={adminProfile.avatar} username={adminProfile.username} />
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <DashboardTab
              stats={dashboardStats}
              loading={dashboardLoading || reportsLoading}
              onRefresh={async () => {
                await Promise.all([fetchDashboardData(), fetchReports()]);
              }}
              onOpenTab={setActiveTab}
              t={t}
              pendingReportsCount={pendingReportsCount}
              categoryCounts={getCategoryDistribution()}
              recentActivities={getRecentActivities()}
              language={language}
              reports={reports}
              posts={posts}
              handleActionInDashboard={handleActionInDashboard}
              isDarkMode={isDarkMode}
              showToast={showToast}
            />
          )}

          {activeTab === 'posts' && <PostsTab showToast={showToast} t={t} locale={locale} isDarkMode={isDarkMode} />}
          {activeTab === 'users' && (
            <UsersTab 
              users={users} 
              posts={posts} 
              loading={dashboardLoading} 
              fetchDashboardData={fetchDashboardData} 
              showToast={showToast} 
              t={t} 
              isDarkMode={isDarkMode} 
            />
          )}
          {activeTab === 'reports' && (
            <ReportsTab 
              reports={reports} 
              loading={reportsLoading} 
              fetchReports={fetchReports} 
              fetchDashboardData={fetchDashboardData}
              showToast={showToast} 
              t={t} 
              locale={locale} 
              isDarkMode={isDarkMode}
            />
          )}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
              <div className={`rounded-2xl border shadow-sm p-6
                ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
                <div className="flex flex-col items-center text-center">
                  <img
                    src={adminProfile.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80"}
                    alt={adminProfile.username || "Admin"}
                    className="w-28 h-28 rounded-full object-cover border-4 border-red-955/40 shadow-sm mb-4"
                  />
                  <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{adminProfile.username || t.profileFallback}</h3>
                  <p className="text-[12px] font-bold text-[#f44336] uppercase tracking-widest mt-1">{roleLabel[adminProfile.role] || adminProfile.role || t.profileFallback}</p>
                  <p className="text-[13px] text-gray-500 font-medium mt-2">{adminProfile.email || t.profileEmailFallback}</p>
                </div>
              </div>

              <div className={`rounded-2xl border shadow-sm p-6
                ${isDarkMode ? 'bg-[#131526] border-[#22253f]' : 'bg-white border-gray-150'}`}>
                <h3 className={`text-[16px] font-black mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.accountInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`rounded-xl border p-4
                    ${isDarkMode ? 'bg-[#18192a] border-[#22253f]' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1">{t.displayName}</p>
                    <p className={`text-14px font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{adminProfile.username || '-'}</p>
                  </div>
                  <div className={`rounded-xl border p-4
                    ${isDarkMode ? 'bg-[#18192a] border-[#22253f]' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1">{t.email}</p>
                    <p className={`text-14px font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{adminProfile.email || '-'}</p>
                  </div>
                  <div className={`rounded-xl border p-4
                    ${isDarkMode ? 'bg-[#18192a] border-[#22253f]' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1">{t.role}</p>
                    <p className={`text-14px font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{roleLabel[adminProfile.role] || adminProfile.role || t.profileFallback}</p>
                  </div>
                  <div className={`rounded-xl border p-4
                    ${isDarkMode ? 'bg-[#18192a] border-[#22253f]' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-[11px] font-black text-gray-555 uppercase tracking-widest mb-1">{t.accountStatus}</p>
                    <p className="text-[14px] font-bold text-green-500">{t.active}</p>
                  </div>
                </div>
                <button onClick={() => window.location.assign('/settings')} className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f44336] text-white text-[13px] font-bold hover:bg-[#e53935] transition-colors cursor-pointer">
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