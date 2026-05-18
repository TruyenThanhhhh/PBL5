import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';

/**
 * Lưu / bỏ lưu bài viết (API giống Dashboard).
 * postImage — giữ prop để tương thích CommunityDetail, không bắt buộc.
 */
export default function SavePostButton({ postId, initialIsSaved = false, onToggleSave, postImage: _postImage }) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);

  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved, postId]);

  const handleSave = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/save-post/${postId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsSaved(data.isSaved);
        if (onToggleSave) onToggleSave(postId, data.isSaved);
      } else {
        console.warn('Lưu bài:', data.message || res.status);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSave}
      className={`flex items-center gap-1.5 transition-colors text-[13px] font-bold ${
        isSaved ? 'text-[#f44336]' : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      <Bookmark size={20} strokeWidth={isSaved ? 3 : 2.5} fill={isSaved ? '#f44336' : 'none'} />
    </button>
  );
}
