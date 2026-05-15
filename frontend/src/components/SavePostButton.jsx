import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';

export default function SavePostButton({ postId, initialIsSaved, onToggleSave }) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  
  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  const handleSave = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/save-post/${postId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.isSaved);
        if(onToggleSave) onToggleSave(postId, data.isSaved);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button type="button" onClick={handleSave} className={`flex items-center gap-1.5 transition-colors text-[13px] font-bold ${isSaved ? 'text-[#f44336]' : 'text-gray-500 hover:text-gray-900'}`}>
      <Bookmark size={20} strokeWidth={isSaved ? 3 : 2.5} fill={isSaved ? '#f44336' : 'none'} />
    </button>
  );
}