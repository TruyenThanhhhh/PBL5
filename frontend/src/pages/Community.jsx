import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/posts');
        if (!res.ok) throw new Error('Failed to fetch posts');
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return posts;
    return posts.filter((post) => {
      const title = String(post.title || '').toLowerCase();
      const location = String(post.location || '').toLowerCase();
      const description = String(post.description || '').toLowerCase();
      const username = String(post.createdBy?.username || '').toLowerCase();
      return title.includes(keyword) || location.includes(keyword) || description.includes(keyword) || username.includes(keyword);
    });
  }, [posts, query]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900">
      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">
          The Wanderer
        </Link>
        <nav className="flex items-center gap-8 text-[14px] font-bold text-gray-500">
          <Link to="/dashboard" className="hover:text-gray-900 transition-colors">Home</Link>
          <Link to="/explore" className="hover:text-gray-900 transition-colors">Explore</Link>
          <Link to="/community" className="text-[#f44336] border-b-2 border-[#f44336] pb-1">Community</Link>
        </nav>
        <Link to="/profile" className="text-[13px] font-bold text-gray-600 hover:text-[#f44336] transition-colors">
          Profile
        </Link>
      </header>

      <main className="max-w-[980px] mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#f44336] flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black">Community Feed</h1>
              <p className="text-[13px] text-gray-500 font-medium">Khám phá bài viết mới từ cộng đồng du lịch.</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, địa điểm, tác giả..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#f4f4f5] border-transparent rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 text-[13px] font-bold py-10">Đang tải dữ liệu cộng đồng...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 text-[13px] font-bold">
            Không có bài viết phù hợp.
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {filteredPosts.map((post) => (
              <div key={post._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-bold text-gray-900">{post.createdBy?.username || 'Ẩn danh'}</p>
                  <p className="text-[11px] text-gray-400 font-semibold">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : ''}
                  </p>
                </div>
                <h2 className="text-[16px] font-black text-gray-900 mb-1">{post.title || 'Bài viết du lịch'}</h2>
                <p className="text-[13px] text-gray-500 font-semibold mb-2">{post.location || 'Chưa cập nhật địa điểm'}</p>
                <p className="text-[14px] text-gray-700 font-medium whitespace-pre-wrap">
                  {post.description && post.description !== '\u200B' ? post.description : 'Không có mô tả.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
