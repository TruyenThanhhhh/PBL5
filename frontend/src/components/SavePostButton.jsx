import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';

export default function SavePostButton({ postId, initialIsSaved, onToggleSave }) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (isLoading) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Vui lòng đăng nhập để lưu bài viết!");
        return;
    }
    
    setIsLoading(true);
    
    // Cập nhật giao diện trước (Optimistic update) cho mượt
    setIsSaved(!isSaved);

    try {
      const res = await fetch(`http://localhost:5000/api/users/save-post/${postId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.isSaved); // Cập nhật lại từ dữ liệu chuẩn của DB
        if (onToggleSave) onToggleSave(postId, data.isSaved);
      } else {
        // Nếu lỗi thì quay lại trạng thái cũ
        setIsSaved(isSaved);
      }
    } catch (error) {
      setIsSaved(isSaved);
      console.error("Lỗi khi lưu bài viết:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      type="button" 
      onClick={handleSave} 
      disabled={isLoading}
      className={`flex items-center gap-1.5 transition-colors text-[13px] font-bold ${isSaved ? 'text-[#f44336]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'} disabled:opacity-50`}
    >
      <Bookmark size={20} strokeWidth={isSaved ? 3 : 2.5} fill={isSaved ? '#f44336' : 'none'} />
    </button>
  );
}