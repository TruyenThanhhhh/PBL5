import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, X, Plus, FolderHeart, Loader2, Check } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function SavePostButton({ postId, postImage }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [savedIn, setSavedIn] = useState([]);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  const isSaved = savedIn.length > 0;

  const openModal = async (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
    await Promise.all([fetchCollections(), fetchSavedStatus()]);
  };

  const fetchCollections = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/collections`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCollections(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchSavedStatus = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/collections/check/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSavedIn(data.savedIn || []);
      }
    } catch (err) { console.error(err); }
  };

  const handleToggleSave = async (collectionId) => {
    const token = localStorage.getItem('token');
    setLoadingId(collectionId);
    try {
      const res = await fetch(`${API_URL}/collections/${collectionId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.action === 'added') {
          setSavedIn(prev => [...prev, collectionId]);
        } else {
          setSavedIn(prev => prev.filter(id => id !== collectionId));
        }
      }
    } catch (err) { console.error(err); }
    setLoadingId(null);
  };

  const handleCreateCollection = async () => {
    if (!newName.trim()) return;
    const token = localStorage.getItem('token');
    setIsCreating(true);
    try {
      const res = await fetch(`${API_URL}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (res.ok) {
        const newCol = await res.json();
        setCollections(prev => [newCol, ...prev]);
        setNewName('');
        // Tự động lưu bài vào collection vừa tạo
        await handleToggleSave(newCol._id);
      }
    } catch (err) { console.error(err); }
    setIsCreating(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`flex items-center gap-1.5 transition-colors text-[13px] font-bold ${isSaved ? 'text-[#f44336]' : 'text-gray-500 hover:text-[#f44336]'}`}
        title="Lưu bài viết"
      >
        {isSaved ? <BookmarkCheck size={20} strokeWidth={2.5} fill="currentColor" /> : <Bookmark size={20} strokeWidth={2.5} />}
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderHeart size={18} className="text-[#f44336]" />
                <h3 className="text-[15px] font-black text-gray-900">Lưu vào bộ sưu tập</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            {/* Collections List */}
            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50 p-2">
              {collections.length === 0 && (
                <p className="text-center text-gray-400 text-[13px] py-8 font-medium">
                  Chưa có bộ sưu tập nào. Hãy tạo mới!
                </p>
              )}
              {collections.map((col) => {
                const isInThisCollection = savedIn.includes(col._id);
                return (
                  <button
                    key={col._id}
                    type="button"
                    onClick={() => handleToggleSave(col._id)}
                    disabled={loadingId === col._id}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isInThisCollection ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                  >
                    {/* Cover */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-red-100 to-orange-100 flex-shrink-0 flex items-center justify-center">
                      {col.coverImage ? (
                        <img src={col.coverImage} alt="cover" className="w-full h-full object-cover" />
                      ) : (
                        <FolderHeart size={20} className="text-[#f44336] opacity-60" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[13px] font-bold text-gray-900">{col.name}</p>
                      <p className="text-[11px] text-gray-400">{col.posts?.length || 0} bài viết</p>
                    </div>
                    <div className="flex-shrink-0">
                      {loadingId === col._id ? (
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                      ) : isInThisCollection ? (
                        <Check size={18} className="text-[#f44336]" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create New Collection */}
            <div className="px-5 py-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tên bộ sưu tập mới..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                  className="flex-1 bg-[#f4f4f5] rounded-full px-4 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={handleCreateCollection}
                  disabled={isCreating || !newName.trim()}
                  className="w-9 h-9 bg-[#f44336] text-white rounded-full flex items-center justify-center hover:bg-[#e53935] transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
