import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, RefreshCw, Loader2, ChevronRight, Crown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AccountMenu from '../components/AccountMenu';

const API = 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');
const authHeader = () => ({ Authorization: `Bearer ${token()}` });

const copy = {
  vi: {
    home: 'Trang chủ',
    explore: 'Khám phá',
    community: 'Cộng đồng',
    friends: 'Bạn bè',
    title: 'Cộng đồng của bạn',
    subtitle: 'Các nhóm bạn đã tham gia. Chọn một nhóm để vào bảng tin.',
    searchCommunities: 'Tìm trong danh sách...',
    createCommunity: 'Tạo cộng đồng',
    communityName: 'Tên cộng đồng',
    communityDesc: 'Mô tả',
    cancel: 'Hủy',
    create: 'Tạo',
    members: 'thành viên',
    posts: 'bài viết',
    ownerBadge: 'Chủ',
    emptyJoined: 'Chưa có cộng đồng nào. Hãy tạo nhóm mới.',
    loginPrompt: 'Đăng nhập để xem cộng đồng của bạn.',
    reload: 'Tải lại',
    createCommunityError: 'Không tạo được cộng đồng.',
    loadError: 'Không tải được danh sách.',
  },
  en: {
    home: 'Home',
    explore: 'Explore',
    community: 'Community',
    friends: 'Friends',
    title: 'Your communities',
    subtitle: 'Groups you belong to. Open one to see the feed.',
    searchCommunities: 'Search this list...',
    createCommunity: 'Create community',
    communityName: 'Community name',
    communityDesc: 'Description',
    cancel: 'Cancel',
    create: 'Create',
    members: 'members',
    posts: 'posts',
    ownerBadge: 'Owner',
    emptyJoined: 'No communities yet. Create a new group.',
    loginPrompt: 'Sign in to see your communities.',
    reload: 'Reload',
    createCommunityError: 'Could not create community.',
    loadError: 'Could not load list.',
  },
};

export default function Community() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = copy[language] || copy.vi;

  const [joined, setJoined] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchMine = useCallback(async () => {
    if (!token()) {
      setJoined([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/communities/mine`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setJoined(Array.isArray(data.joined) ? data.joined : []);
    } catch {
      showToast(t.loadError);
      setJoined([]);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(`${API}/communities`);
      if (res.ok) {
        const data = await res.json();
        setAllCommunities(Array.isArray(data) ? data : []);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchMine();
    fetchAll();
  }, [fetchMine, fetchAll]);

  const handleJoin = async (communityId) => {
    if (!token()) return navigate('/login');
    try {
      const res = await fetch(`${API}/communities/${communityId}/join`, {
        method: 'POST',
        headers: { ...authHeader() },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Đã gửi yêu cầu tham gia');
        fetchMine();
        fetchAll();
      } else {
        showToast(data.message || 'Lỗi tham gia cộng đồng');
      }
    } catch (_) {
      showToast('Lỗi kết nối khi tham gia cộng đồng');
    }
  };

  const filteredJoined = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return joined;
    return joined.filter((c) => String(c.name || '').toLowerCase().includes(k));
  }, [joined, q]);

  const filteredAll = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return [];
    return allCommunities.filter((c) => String(c.name || '').toLowerCase().includes(k));
  }, [allCommunities, q]);

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!token()) return navigate('/login');
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/communities`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      await fetchMine();
      await fetchAll();
      if (data.community?._id) navigate(`/community/${data.community._id}`);
      else showToast(language === 'vi' ? 'Đã tạo cộng đồng' : 'Community created');
    } catch (err) {
      showToast(err?.message || t.createCommunityError);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-xl bg-gray-900 text-white text-[13px] font-bold shadow-lg">
          {toast}
        </div>
      )}

      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="w-1/4 min-w-0">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">
            The Wanderer
          </Link>
        </div>
        <nav className="flex flex-1 justify-center items-center gap-10 text-[15px] font-bold text-gray-500">
          <Link to="/dashboard" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">
            {t.home}
          </Link>
          <Link to="/explore" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">
            {t.explore}
          </Link>
          <Link to="/community" className="text-[#f44336] border-b-[3px] border-[#f44336] h-[72px] flex items-center">
            {t.community}
          </Link>
          <Link to="/friends" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">
            {t.friends}
          </Link>
        </nav>
        <div className="w-1/4 flex justify-end shrink-0 min-w-0">
          <AccountMenu />
        </div>
      </header>

      <main className="max-w-[680px] mx-auto px-6 2xl:px-8 py-10 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t.title}</h1>
          <p className="text-[13px] text-gray-500 font-medium mt-1">{t.subtitle}</p>
        </div>

        {!token() ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-[13px] font-bold text-gray-600">
            {t.loginPrompt}{' '}
            <Link to="/login" className="text-[#f44336] underline">
              Login
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t.searchCommunities}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#f4f4f5] rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchMine()}
                  className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 border border-gray-100"
                  title={t.reload}
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f44336] text-white text-[13px] font-bold hover:bg-[#e53935]"
              >
                <Plus size={16} /> {t.createCommunity}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin" size={28} />
              </div>
            ) : q.trim() === '' ? (
              filteredJoined.length === 0 ? (
                <p className="text-[13px] text-gray-500 font-medium text-center py-8">{t.emptyJoined}</p>
              ) : (
                <ul className="flex flex-col gap-3 list-none p-0 m-0">
                  {filteredJoined.map((c) => (
                    <li key={c._id}>
                      <Link
                        to={`/community/${c._id}`}
                        className="flex items-center justify-between gap-3 px-4 py-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-[#f44336]/30 hover:shadow transition-all"
                      >
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[14px] text-gray-900 truncate">{c.name}</span>
                            {c.myRole === 'owner' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                <Crown size={11} /> {t.ownerBadge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                            {(c.memberCount ?? 0)} {t.members} · {(c.postCount ?? 0)} {t.posts}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              filteredAll.length === 0 ? (
                <p className="text-[13px] text-gray-500 font-medium text-center py-8">
                  {language === 'vi' ? 'Không tìm thấy cộng đồng nào phù hợp.' : 'No matching communities found.'}
                </p>
              ) : (
                <ul className="flex flex-col gap-3 list-none p-0 m-0">
                  {filteredAll.map((c) => {
                    const myId = localStorage.getItem('userId');
                    const isOwner = String(c.createdBy?._id || c.createdBy) === myId;
                    const isMember = isOwner || (c.members || []).some(m => String(m._id || m) === myId);
                    const isPending = (c.pendingMembers || []).some(m => String(m._id || m) === myId);

                    return (
                      <li key={c._id}>
                        <div
                          className="flex items-center justify-between gap-3 px-4 py-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-[#f44336]/30 hover:shadow transition-all"
                        >
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isMember ? (
                                <Link to={`/community/${c._id}`} className="font-bold text-[14px] text-gray-900 hover:text-[#f44336] hover:underline truncate">
                                  {c.name}
                                </Link>
                              ) : (
                                <span className="font-bold text-[14px] text-gray-900 truncate">{c.name}</span>
                              )}
                              {isOwner && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  <Crown size={11} /> {t.ownerBadge}
                                </span>
                              )}
                              {isMember && !isOwner && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                                  {language === 'vi' ? 'Đã tham gia' : 'Joined'}
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {language === 'vi' ? 'Đang chờ duyệt' : 'Pending'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                              {(c.memberCount ?? 0)} {t.members} · {(c.postCount ?? 0)} {t.posts}
                            </p>
                          </div>
                          
                          {isMember ? (
                            <Link to={`/community/${c._id}`}>
                              <ChevronRight size={18} className="text-gray-400 hover:text-[#f44336] transition-colors" />
                            </Link>
                          ) : isPending ? (
                            <span className="text-[12px] font-bold text-gray-400">
                              {language === 'vi' ? 'Chờ duyệt' : 'Pending'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleJoin(c._id)}
                              className="px-4 py-1.5 rounded-lg bg-[#f44336] text-white text-[12px] font-bold hover:bg-[#e53935] transition-all"
                            >
                              {language === 'vi' ? 'Tham gia' : 'Join'}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            )}
          </>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleCreateCommunity}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-lg font-black">{t.createCommunity}</h3>
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase mb-1">{t.communityName}</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full bg-[#f4f4f5] rounded-xl px-3 py-2.5 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase mb-1">{t.communityDesc}</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="w-full bg-[#f4f4f5] rounded-xl px-3 py-2.5 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-[#f44336] hover:bg-[#e53935] disabled:opacity-60"
              >
                {creating ? <Loader2 className="animate-spin inline" size={16} /> : t.create}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
