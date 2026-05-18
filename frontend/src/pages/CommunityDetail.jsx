import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { 
  Bell, MessageSquare,
  MapPin, Image as ImageIcon, Send, ShieldAlert,
  Heart, Share2, MoreHorizontal, CheckCircle, X, CornerDownRight, Loader2,
  ArrowLeft, UserMinus
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import SavePostButton from '../components/SavePostButton';
import { RealMapPicker, RealMapViewer, loadLeafletAssets } from '../components/LeafletTravelMaps';
import { useLanguage } from '../contexts/LanguageContext';
import AccountMenu from '../components/AccountMenu';

const copy = {
  vi: {
    home: 'Trang chủ',
    explore: 'Khám phá',
    community: 'Cộng đồng',
    friends: 'Bạn bè',
    createPost: 'Tạo bài viết mới',
    createPostHint: 'Chia sẻ ảnh, ghim bản đồ, kể lại trải nghiệm của bạn.',
    travelFeed: 'Bảng tin du lịch',
    sharePlaceholder: 'Chia sẻ địa điểm bạn vừa khám phá...',
    systemPlaceholder: 'Phát thông báo hệ thống...',
    mapPickerHint: 'Nhấn vào bản đồ để lấy tọa độ chính xác',
    pinnedLocation: 'Đã ghim vị trí',
    pinLocation: 'Ghim vị trí',
    uploadImage: 'Tải ảnh lên',
    posting: 'Đang tải...',
    submitPost: 'Đăng bài',
    hotPlaces: 'Địa điểm đang hot',
    beach: 'Biển',
    culture: 'Văn hóa',
    quickSuggestions: 'Gợi ý nhanh',
    quickTrip: 'Lịch trình Đà Nẵng 2N1Đ',
    quickFood: 'Ăn gì ở Huế?',
    quickCheckin: 'Check-in Hội An buổi tối',
    travelTip: 'Mẹo du lịch',
    chatTitle: 'AI tư vấn địa điểm',
    baySao: 'Bãi Sao, Phú Quốc',
    savedBaySao: 'Đã lưu vào danh sách xem sau: Bãi Sao',
    phoCo: 'Phố cổ Hội An',
    savedPhoCo: 'Đã thêm Phố cổ Hội An vào Gợi ý',
    chatTrip: 'Gợi ý lịch trình Đà Nẵng 2 ngày 1 đêm',
    chatFood: 'Gợi ý món ăn ngon ở Huế',
    chatCheckin: 'Điểm check-in đẹp ở Hội An buổi tối',
    noComment: 'Chưa có bình luận nào. Hãy là người đầu tiên!',
    loadingMap: 'Đang tải bản đồ...',
    pinnedSpot: 'Vị trí được ghim',
    viewMap: '📍 Xem Map',
    closeMap: 'Đóng Bản đồ',
    postSuccess: 'Đăng bài viết thành công!',
    adminNotice: 'Thông báo từ Ban Quản Trị',
    copyLink: 'Copy link bài viết',
    deletePost: 'Xóa bài viết',
    hidePost: 'Ẩn bài viết',
    showPost: 'Hiện bài viết',
    confirmDeleteComment: 'Xác nhận xóa bình luận',
    deleteCommentText: 'Bạn có chắc chắn xóa bình luận này? Hành động này không thể hoàn tác.',
    cancel: 'Hủy',
    delete: 'Xóa',
    commentPlaceholder: 'Viết bình luận...',
    reply: 'Phản hồi',
    edit: 'Sửa',
    save: 'Lưu',
    like: 'Thích',
    comment: 'Bình luận',
    loginRequired: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để đăng bài.',
    notLoggedIn: 'Vui lòng đăng nhập để thả tim bài viết.',
    cannotLike: 'Không thể thả tim bài viết',
    noContent: 'Vui lòng nhập nội dung, ảnh hoặc ghim vị trí!',
    emptyComment: 'Nội dung bình luận không được để trống.',
    loginRequiredComment: 'Vui lòng đăng nhập để sửa bình luận.',
    cannotUpdateComment: 'Không thể cập nhật bình luận',
    updateSuccess: 'Đã cập nhật bình luận',
    invalidFile: 'Tệp không hợp lệ!',
    fileTooLarge: 'Ảnh quá 5MB!',
    maxImages: 'Chỉ tối đa 5 ảnh!',
    errorComment: 'Lỗi gửi bình luận',
    publishingSystemNotice: 'THÔNG BÁO TỪ HỆ THỐNG',
    unpublished: 'Hệ thống giả lập',
    systemSimulation: 'Do chưa kết nối được Backend, đây là bài viết mô phỏng.',
    locationUndetermined: 'Chưa xác định',
    likeSuccess: 'Không thể thả tim bài viết',
    leafletError: 'Leaflet load timeout',
    networkError: 'Lỗi mạng!',
    serverError: 'Lỗi server khi đăng bài',
    systemError: 'Lỗi hệ thống',
    notFound: 'Không tìm thấy profile hiện tại',
    backToList: 'Danh sách cộng đồng',
    communityFeed: 'Bảng tin nhóm',
    shareToProfile: 'Đồng thời hiển thị trên trang cá nhân',
    pendingBanner: 'Bạn đã xin tham gia. Chờ chủ cộng đồng duyệt để đăng bài và xem bài.',
    moderation: 'Quản lý thành viên',
    pendingRequests: 'Chờ duyệt',
    approve: 'Duyệt',
    reject: 'Từ chối',
    members: 'Thành viên',
    kick: 'Mời ra',
    shareProfileBtn: 'Chia sẻ lên hồ sơ',
    onProfile: 'Đã lên hồ sơ',
    postsBlocked: 'Chưa thể xem bài — chờ được duyệt.',
  },
  en: {
    home: 'Home',
    explore: 'Explore',
    community: 'Community',
    friends: 'Friends',
    createPost: 'Create new post',
    createPostHint: 'Share photos, pin the map, and tell your travel story.',
    travelFeed: 'Travel Feed',
    sharePlaceholder: 'Share the place you just discovered...',
    systemPlaceholder: 'Post a system announcement...',
    mapPickerHint: 'Click on the map to get exact coordinates',
    pinnedLocation: 'Location pinned',
    pinLocation: 'Pin location',
    uploadImage: 'Upload image',
    posting: 'Posting...',
    submitPost: 'Post',
    hotPlaces: 'Hot destinations',
    beach: 'Beach',
    culture: 'Culture',
    quickSuggestions: 'Quick suggestions',
    quickTrip: 'Da Nang 2D1N itinerary',
    quickFood: 'What to eat in Hue?',
    quickCheckin: 'Hoi An night check-in spots',
    travelTip: 'Travel Tip',
    chatTitle: 'AI destination assistant',
    baySao: 'Bai Sao Beach, Phu Quoc',
    savedBaySao: 'Saved to watchlist: Bai Sao',
    phoCo: 'Hoi An Old Town',
    savedPhoCo: 'Added Hoi An Old Town to suggestions',
    chatTrip: 'Suggest Da Nang 2-day 1-night itinerary',
    chatFood: 'What are good food options in Hue?',
    chatCheckin: 'Beautiful check-in spots in Hoi An at night',
    noComment: 'No comments yet. Be the first!',
    loadingMap: 'Loading map...',
    pinnedSpot: 'Pinned location',
    viewMap: '📍 View Map',
    closeMap: 'Close Map',
    postSuccess: 'Post published successfully!',
    adminNotice: 'Admin Notice',
    copyLink: 'Copy post link',
    deletePost: 'Delete post',
    hidePost: 'Hide post',
    showPost: 'Show post',
    confirmDeleteComment: 'Confirm delete comment',
    deleteCommentText: 'Are you sure you want to delete this comment? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    commentPlaceholder: 'Write a comment...',
    reply: 'Reply',
    edit: 'Edit',
    save: 'Save',
    like: 'Like',
    comment: 'Comment',
    loginRequired: 'Please sign in to post.',
    notLoggedIn: 'Please sign in to like this post.',
    cannotLike: 'Cannot like post',
    noContent: 'Please add content, image or pin location!',
    emptyComment: 'Comment cannot be empty.',
    loginRequiredComment: 'Please sign in to edit comment.',
    cannotUpdateComment: 'Cannot update comment',
    updateSuccess: 'Comment updated',
    invalidFile: 'Invalid file!',
    fileTooLarge: 'Image exceeds 5MB!',
    maxImages: 'Maximum 5 images!',
    errorComment: 'Error sending comment',
    publishingSystemNotice: 'SYSTEM NOTICE',
    unpublished: 'System simulation',
    systemSimulation: 'Backend not connected. This is a simulated post.',
    locationUndetermined: 'Location undetermined',
    likeSuccess: 'Cannot like post',
    leafletError: 'Leaflet load timeout',
    networkError: 'Network error!',
    serverError: 'Server error posting',
    systemError: 'System error',
    notFound: 'Could not load current profile',
    backToList: 'All communities',
    communityFeed: 'Group feed',
    shareToProfile: 'Also show on my profile',
    pendingBanner: 'Your join request is pending. Wait for the owner to approve.',
    moderation: 'Member management',
    pendingRequests: 'Pending',
    approve: 'Approve',
    reject: 'Reject',
    members: 'Members',
    kick: 'Remove',
    shareProfileBtn: 'Share to profile',
    onProfile: 'On profile',
    postsBlocked: 'Posts unavailable until approved.',
  },
};

const API_BASE = 'http://localhost:5000/api';

function CommunityDetailPage() {
  const navigate = useNavigate();
  const { id: routeCommunityId } = useParams();
  const { language } = useLanguage();
  const t = copy[language] || copy.vi;
  const [posts, setPosts] = useState([]);
  const [community, setCommunity] = useState(null);
  const [sharingPostId, setSharingPostId] = useState(null);
  const [shareProfile, setShareProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState({ userId: '', username: 'Khách', role: 'user', avatar: '' });
  
  const [newPost, setNewPost] = useState({ title: '', description: '', category: 'General' });
  const [pickedCoords, setPickedCoords] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [expandedMap, setExpandedMap] = useState({});
  const [notification, setNotification] = useState({ type: '', text: '' });

  const [expandedComments, setExpandedComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [isFetchingComments, setIsFetchingComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState({ parentId: null, childUsername: null });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [likingPosts, setLikingPosts] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, postId: null, commentId: null });
  const [openPostMenuId, setOpenPostMenuId] = useState(null);

  const fetchPosts = async () => {
    if (!routeCommunityId) return;
    const tok = localStorage.getItem('token');
    if (!tok) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${routeCommunityId}/posts`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) {
        setPosts([]);
        return;
      }
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    }
  };

  const fetchCommunity = async () => {
    if (!routeCommunityId) return;
    const tok = localStorage.getItem('token');
    if (!tok) {
      navigate('/community', { replace: true });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/communities/${routeCommunityId}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.status === 401 || res.status === 403) {
        navigate('/community', { replace: true });
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCommunity(data);
    } catch {
      navigate('/community', { replace: true });
    }
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      const userRole = localStorage.getItem('role') || 'user';
      const userId = localStorage.getItem('userId') || '';
      let username = localStorage.getItem('displayName') || localStorage.getItem('username') || 'Khách Xem Trước';
      let avatar = localStorage.getItem('avatar') || '';
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const res = await fetch(`${API_BASE}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const user = data.user || data;
            username = user.displayName || user.username || username;
            avatar = user.avatar || avatar;
            localStorage.setItem('displayName', username);
            if (avatar) localStorage.setItem('avatar', avatar);
          }
        } catch (error) {
          console.warn('Không thể tải profile hiện tại:', error);
        }
      }

      setCurrentUser({ userId, username, role: String(userRole).toLowerCase(), avatar });
    };

    loadCurrentUser();
    loadLeafletAssets().catch(() => {});
  }, []);

  useEffect(() => {
    if (!routeCommunityId) return;
    fetchCommunity();
  }, [routeCommunityId]);

  useEffect(() => {
    if (!community) return;
    if (community.isMember && !community.isPending) {
      fetchPosts();
    } else {
      setPosts([]);
    }
  }, [community, routeCommunityId]);

  const showToast = (type, text) => {
    setNotification({ type, text: String(text) });
    setTimeout(() => setNotification({ type: '', text: '' }), 5000);
  };

  const toggleComments = async (postId) => {
    const isExpanded = expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsData[postId]) {
      setIsFetchingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setCommentsData(prev => ({ ...prev, [postId]: Array.isArray(data.comments) ? data.comments : [] }));
          const commentCount = Array.isArray(data.comments) ? data.comments.length : 0;
          setPosts(prev => prev.map((post) => post._id === postId ? { ...post, totalReviews: commentCount } : post));
        } else {
          setCommentsData(prev => ({ ...prev, [postId]: [] }));
        }
      } catch (error) {
        setCommentsData(prev => ({ ...prev, [postId]: [] }));
      } finally {
        setIsFetchingComments(prev => ({ ...prev, [postId]: false }));
      }
    }
  };

  const refreshComments = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
      if (!res.ok) throw new Error('Không thể tải bình luận');
      const data = await res.json();
      const newComments = Array.isArray(data.comments) ? data.comments : [];
      setCommentsData(prev => ({ ...prev, [postId]: newComments }));
      setPosts(prev => prev.map((post) => post._id === postId ? { ...post, totalReviews: newComments.length } : post));
    } catch (error) {
      setCommentsData(prev => ({ ...prev, [postId]: [] }));
    }
  };

  const handlePostComment = async (postId, parentId = null) => {
    const token = localStorage.getItem('token');
    let text = parentId ? replyInputs[parentId] : commentInputs[postId];
    if (!text || !text.trim()) return;

    if (parentId && replyingTo.parentId === parentId && replyingTo.childUsername) {
      text = `@${replyingTo.childUsername} ${text}`;
    }

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: text, parentComment: parentId || null })
      });

      if (res.ok) {
        if (parentId) {
          setReplyInputs(prev => ({ ...prev, [parentId]: '' }));
          setReplyingTo({ parentId: null, childUsername: null });
        } else {
          setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        }
        await refreshComments(postId);
      } else {
        throw new Error('Lỗi gửi bình luận');
      }
    } catch (error) {
      showToast('error', error.message || 'Lỗi mạng!');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng đăng nhập để xóa bình luận.');

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể xóa bình luận');
      }

      showToast('success', 'Đã xóa bình luận');
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingCommentContent('');
      }
      await refreshComments(postId);
    } catch (error) {
      showToast('error', error.message || 'Lỗi khi xóa bình luận');
    }
  };

  const showDeleteConfirm = (postId, commentId) => {
    setDeleteConfirm({ open: true, postId, commentId });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ open: false, postId: null, commentId: null });
  };

  const confirmDeleteComment = async () => {
    const { postId, commentId } = deleteConfirm;
    if (!postId || !commentId) {
      cancelDelete();
      return;
    }
    await handleDeleteComment(postId, commentId);
    cancelDelete();
  };


  const startEditComment = (commentId, content) => {
    setEditingCommentId(commentId);
    setEditingCommentContent(content || '');
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const saveEditComment = async (postId, commentId) => {
    if (!editingCommentContent || !editingCommentContent.trim()) {
      return showToast('error', 'Nội dung bình luận không được để trống.');
    }
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng đăng nhập để sửa bình luận.');

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editingCommentContent })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể cập nhật bình luận');
      }

      showToast('success', 'Đã cập nhật bình luận');
      cancelEditComment();
      await refreshComments(postId);
    } catch (error) {
      showToast('error', error.message || 'Lỗi khi cập nhật bình luận');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) { showToast('error', `Tệp không hợp lệ!`); continue; }
      if (file.size > 5 * 1024 * 1024) { showToast('error', `Ảnh quá 5MB!`); continue; }
      validFiles.push(file);
    }
    if (validFiles.length + selectedFiles.length > 5) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return showToast('error', "Chỉ tối đa 5 ảnh!");
    }
    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    setPreviewUrls([...previewUrls, ...validFiles.map(file => URL.createObjectURL(file))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickPost = async () => {
    if (!newPost.description?.trim() && selectedFiles.length === 0 && !pickedCoords) {
      return showToast('error', "Vui lòng nhập nội dung, ảnh hoặc ghim vị trí!");
    }
    setIsPosting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập để đăng bài.');
      }
      const finalLocation = pickedCoords ? `[${pickedCoords.lat.toFixed(4)}, ${pickedCoords.lng.toFixed(4)}]` : "Chưa xác định";
      let finalDescription = newPost.description ? String(newPost.description) : "";
      if (finalDescription.trim() === "") finalDescription = "\u200B"; 
      const postFormData = new FormData();
      postFormData.append('title', currentUser.role === 'admin' ? 'THÔNG BÁO TỪ HỆ THỐNG' : (newPost.title || currentUser.username));
      postFormData.append('description', finalDescription);
      postFormData.append('location', finalLocation);
      postFormData.append('category', currentUser.role === 'admin' ? 'System' : newPost.category);
      postFormData.append('lat', String(pickedCoords?.lat ?? ''));
      postFormData.append('lng', String(pickedCoords?.lng ?? ''));
      postFormData.append('communityId', routeCommunityId);
      postFormData.append('publishedToProfile', shareProfile ? 'true' : 'false');
      selectedFiles.forEach((file) => postFormData.append('images', file));

      const res = await fetch(`${API_BASE}/posts/create-with-media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: postFormData
      });
      if (res.ok) {
        setNewPost({ title: '', description: '', category: 'General' });
        setPickedCoords(null); setShowMapPicker(false); setSelectedFiles([]); setPreviewUrls([]);
        setShareProfile(false);
        fetchPosts(); showToast('success', t.postSuccess);
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Lỗi server khi đăng bài');
      }
    } catch (error) { 
      showToast('error', error.message || 'Lỗi hệ thống'); 
    } finally { 
      setIsPosting(false); 
    }
  };

  const handleLikePost = async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('error', 'Vui lòng đăng nhập để thả tim bài viết.');
      return;
    }

    setLikingPosts((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`${API_BASE}/posts/like/${postId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể thả tim bài viết');
      }

      const data = await res.json();
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id !== postId) return post;
          const existingLikes = Array.isArray(post.likes) ? [...post.likes] : [];
          const userLiked = existingLikes.some((userId) => userId?.toString() === currentUser.userId);

          if (data.liked) {
            const updatedLikes = userLiked ? existingLikes : [...existingLikes, currentUser.userId];
            return { ...post, likes: updatedLikes };
          }

          const updatedLikes = existingLikes.filter((userId) => userId?.toString() !== currentUser.userId);
          return { ...post, likes: updatedLikes };
        })
      );
    } catch (error) {
      showToast('error', error.message || 'Đã xảy ra lỗi khi thả tim');
    } finally {
      setLikingPosts((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const getPostImageUrl = (img) => {
    if (typeof img === 'string') return img;
    if (img && typeof img === 'object') return img.url || img.path || '';
    return '';
  };

  const handleCopyPostLink = async (postId) => {
    const url = `${window.location.origin}/post-detail?postId=${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('success', 'Đã copy link bài viết.');
    } catch (error) {
      showToast('error', 'Không thể copy link.');
    }
  };

  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng đăng nhập.');
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể xóa bài viết');
      }
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showToast('success', 'Đã xóa bài viết.');
    } catch (error) {
      showToast('error', error.message || 'Lỗi khi xóa bài viết.');
    } finally {
      setOpenPostMenuId(null);
    }
  };

  const handleToggleVisibility = async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng đăng nhập.');
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/toggle-visibility`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể thay đổi trạng thái bài viết');
      }
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, isHidden: data.isHidden } : p)));
      showToast('success', data.message || 'Đã cập nhật trạng thái bài viết.');
    } catch (error) {
      showToast('error', error.message || 'Lỗi hệ thống.');
    } finally {
      setOpenPostMenuId(null);
    }
  };

  const handlePublishToProfile = async (postId) => {
    const tok = localStorage.getItem('token');
    if (!tok) return showToast('error', t.loginRequired);
    setSharingPostId(postId);
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/publish-profile`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) throw new Error();
      showToast('success', language === 'vi' ? 'Đã chia sẻ lên hồ sơ' : 'Shared to profile');
      fetchPosts();
    } catch {
      showToast('error', language === 'vi' ? 'Không chia sẻ được' : 'Could not share');
    } finally {
      setSharingPostId(null);
    }
  };

  const refreshCommunity = async () => {
    const tok = localStorage.getItem('token');
    if (!tok || !routeCommunityId) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${routeCommunityId}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCommunity(data);
      }
    } catch {}
  };

  const approveMember = async (userId) => {
    const tok = localStorage.getItem('token');
    if (!tok) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${routeCommunityId}/pending/${userId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) throw new Error();
      showToast('success', language === 'vi' ? 'Đã duyệt thành viên' : 'Member approved');
      await refreshCommunity();
      fetchPosts();
    } catch {
      showToast('error', language === 'vi' ? 'Không duyệt được' : 'Approve failed');
    }
  };

  const rejectMember = async (userId) => {
    const tok = localStorage.getItem('token');
    if (!tok) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${routeCommunityId}/pending/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) throw new Error();
      showToast('success', language === 'vi' ? 'Đã từ chối' : 'Rejected');
      await refreshCommunity();
    } catch {
      showToast('error', language === 'vi' ? 'Lỗi' : 'Error');
    }
  };

  const kickMember = async (userId) => {
    const tok = localStorage.getItem('token');
    if (!tok) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${routeCommunityId}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) throw new Error();
      showToast('success', language === 'vi' ? 'Đã mời thành viên ra' : 'Member removed');
      await refreshCommunity();
      fetchPosts();
    } catch {
      showToast('error', language === 'vi' ? 'Không thực hiện được' : 'Could not remove');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans relative">
      {notification.text && (
        <div className={`fixed bottom-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 border-l-4 ${notification.type === 'error' ? 'bg-white border-[#f44336] text-gray-800' : 'bg-white border-green-500 text-gray-800'}`}>
          {notification.type === 'error' ? <ShieldAlert size={24} className="text-[#f44336]" /> : <CheckCircle size={24} className="text-green-500" />}
          <p className="text-[14px] font-bold max-w-[300px] leading-tight">{notification.text}</p>
          <button onClick={() => setNotification({ type: '', text: '' })} className="ml-4 text-gray-400 hover:text-gray-900"><X size={18} /></button>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Xác nhận xóa bình luận</h3>
            <p className="text-sm text-gray-700 mb-5">Bạn có chắc chắn xóa bình luận này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={cancelDelete} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">Hủy</button>
              <button type="button" onClick={confirmDeleteComment} className="px-4 py-2 rounded-lg bg-[#f44336] text-white hover:bg-[#e22d41]">Xóa</button>
            </div>
          </div>
        </div>
      )}

      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="w-1/4">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">The Wanderer</Link>
        </div>
        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500">
          <Link to="/dashboard" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.home}</Link>
          <Link to="/explore" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.explore}</Link>
          <Link to="/community" className="text-[#f44336] border-b-[3px] border-[#f44336] h-[72px] flex items-center">{t.community}</Link>
          <Link to="/friends" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">{t.friends}</Link>
        </nav>
        <div className="w-1/4 flex items-center justify-end gap-2 md:gap-3 shrink-0 min-w-0">
          <span className="inline-flex items-center">
            <NotificationBell />
          </span>
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900" title="Tin nhắn">
            <MessageSquare size={22} strokeWidth={2} />
          </button>
          <AccountMenu avatar={currentUser.avatar} username={currentUser.username} />
        </div>
      </header>

      <main className="max-w-[680px] mx-auto pt-8 px-6 2xl:px-8 pb-16">
        <div className="flex flex-col gap-10">
          <Link to="/community" className="inline-flex items-center gap-2 text-[13px] font-bold text-gray-600 hover:text-[#f44336] w-fit">
            <ArrowLeft size={18} /> {t.backToList}
          </Link>

          {community && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h1 className="text-xl font-black text-gray-900">{community.name}</h1>
              {community.description ? (
                <p className="text-[13px] text-gray-600 font-medium mt-2 whitespace-pre-wrap">{community.description}</p>
              ) : null}
              <p className="text-[11px] text-gray-400 font-bold mt-3 uppercase tracking-wider">
                {community.memberCount ?? 0} {t.members.toLowerCase()} · {community.postCount ?? 0}{' '}
                {language === 'vi' ? 'bài viết' : 'posts'}
              </p>
            </div>
          )}

          {community?.isPending && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-[13px] font-bold text-amber-900">
              {t.pendingBanner}
            </div>
          )}

          {community?.isOwner && Array.isArray(community.pendingMembers) && community.pendingMembers.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-[13px] font-black text-gray-900 mb-4">{t.pendingRequests}</h3>
              <div className="flex flex-col gap-3">
                {community.pendingMembers.map((u) => (
                  <div key={u._id} className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-[13px] font-bold text-gray-900">{u.username || u.displayName}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => approveMember(u._id)}
                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-[12px] font-bold hover:bg-green-700"
                      >
                        {t.approve}
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectMember(u._id)}
                        className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-800 text-[12px] font-bold hover:bg-gray-300"
                      >
                        {t.reject}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {community?.isOwner && Array.isArray(community.members) && community.members.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-[13px] font-black text-gray-900 mb-4">{t.members}</h3>
              <div className="flex flex-col gap-2">
                {community.members.map((u) => {
                  const uid = String(u._id || u);
                  const isCreator = uid === String(community.createdBy?._id || community.createdBy);
                  return (
                    <div key={uid} className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-[13px] font-bold text-gray-900">
                        {u.username || u.displayName}
                        {isCreator ? (
                          <span className="ml-2 text-[10px] uppercase text-amber-700 font-black">Owner</span>
                        ) : null}
                      </span>
                      {!isCreator && (
                        <button
                          type="button"
                          onClick={() => kickMember(uid)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-bold hover:bg-black"
                        >
                          <UserMinus size={14} /> {t.kick}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {community && community.isMember && !community.isPending && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <p className="text-[13px] font-black text-gray-900">{t.createPost}</p>
                <p className="text-[11px] font-semibold text-gray-500">{t.createPostHint}</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-50 text-[#f44336]">
                {t.communityFeed}
              </span>
            </div>
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                <img src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <textarea 
                placeholder={currentUser.role === 'admin' ? t.systemPlaceholder : t.sharePlaceholder}
                className="w-full bg-[#f4f4f5] rounded-xl p-3.5 text-[14px] font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all"
                rows="3"
                value={newPost.description}
                onChange={e => setNewPost({...newPost, description: e.target.value})}
              ></textarea>
            </div>

            {previewUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3 pl-12">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-gray-900/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            
            {showMapPicker && (
              <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 animate-in fade-in duration-300 ml-12">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[12px] font-bold text-gray-500">📍 {t.mapPickerHint}</p>
                  {pickedCoords && <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">[{pickedCoords.lat.toFixed(4)}, {pickedCoords.lng.toFixed(4)}]</span>}
                </div>
                <div className="h-[250px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0 shadow-inner">
                  <RealMapPicker setPickedCoords={setPickedCoords} />
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-[13px] font-bold text-gray-700 cursor-pointer mb-3 ml-12">
              <input
                type="checkbox"
                checked={shareProfile}
                onChange={(e) => setShareProfile(e.target.checked)}
                className="rounded border-gray-300 accent-[#f44336]"
              />
              {t.shareToProfile}
            </label>

            <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowMapPicker(!showMapPicker)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-colors select-none ${pickedCoords || showMapPicker ? 'bg-red-50 text-[#f44336]' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <MapPin size={16} strokeWidth={2.5} /> {pickedCoords ? t.pinnedLocation : t.pinLocation}
                </button>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors select-none cursor-pointer">
                  <ImageIcon size={16} strokeWidth={2.5} /> {t.uploadImage}
                </button>
              </div>
              <button type="button" onClick={handleQuickPost} disabled={isPosting} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-bold text-white transition-all shadow-md ${currentUser.role === 'admin' ? 'bg-gray-900 hover:bg-black' : 'bg-[#f44336] shadow-red-500/20 hover:bg-[#e53935]'} disabled:opacity-50`}>
                {isPosting ? <span>{t.posting}</span> : <span className="flex items-center gap-1.5"><Send size={16} /> {t.submitPost}</span>}
              </button>
            </div>
          </div>
          )}

          <div className="flex flex-col gap-14">
            {Array.isArray(posts) && posts.map((post) => {
              const isAdmin = post.createdBy?.role === 'admin';
              const isOwner = Boolean(currentUser.userId) && String(post.createdBy?._id || '') === String(currentUser.userId);
              const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;
              const commentCount = Number(post.totalReviews) > 0 ? post.totalReviews : null;
              
              return (
                <div key={post._id || Math.random().toString()} className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${isAdmin ? 'border-red-200' : 'border-gray-100'}`}>
                  {isAdmin && (
                    <div className="bg-red-50 px-5 py-2.5 flex items-center gap-2 border-b border-red-100">
                      <ShieldAlert size={16} className="text-[#f44336]" />
                      <span className="text-[11px] font-black text-[#f44336] uppercase tracking-widest">{t.adminNotice}</span>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer hover:ring-2 hover:ring-red-200 transition-all ${isAdmin ? 'border-[#f44336]' : 'border-transparent'}`}
                          onClick={() => {
                            if (post.createdBy && post.createdBy._id !== currentUser.userId) {
                              window.dispatchEvent(new CustomEvent('openChat', { detail: { targetUserId: post.createdBy._id } }));
                            }
                          }}
                        >
                          <img src={post.createdBy?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 
                            className="text-[14px] font-bold text-gray-900 flex items-center gap-1.5 cursor-pointer hover:underline"
                            onClick={() => {
                              if (post.createdBy && post.createdBy._id !== currentUser.userId) {
                                window.dispatchEvent(new CustomEvent('openChat', { detail: { targetUserId: post.createdBy._id } }));
                              }
                            }}
                          >
                            {post.createdBy?.username || "Ẩn danh"} 
                            {isAdmin && <CheckCircle size={14} className="text-[#f44336]" />}
                          </h3>
                          <p className="text-[11px] font-medium text-gray-400">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : ''}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenPostMenuId((prev) => (prev === post._id ? null : post._id))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreHorizontal size={20} />
                        </button>
                        {openPostMenuId === post._id && (
                          <div className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleCopyPostLink(post._id)}
                              className="w-full text-left px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50 rounded-lg"
                            >
                              Copy link bài viết
                            </button>
                            {(isOwner || currentUser.role === 'admin') && (
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post._id)}
                                className="w-full text-left px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                Xóa bài viết
                              </button>
                            )}
                            {currentUser.role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility(post._id)}
                                className="w-full text-left px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50 rounded-lg"
                              >
                                {post.isHidden ? 'Hiện bài viết' : 'Ẩn bài viết'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {post.description && typeof post.description === 'string' && post.description !== '\u200B' && (
                      <p className="text-[14px] text-gray-800 font-medium leading-relaxed mb-4 whitespace-pre-wrap">{post.description}</p>
                    )}

                    {post.lat != null && post.lng != null && (
                      <div className="mb-4">
                        <button type="button" onClick={() => setExpandedMap(prev => ({ ...prev, [post._id]: !prev[post._id] }))} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-bold transition-all border ${expandedMap[post._id] ? 'bg-[#f44336] text-white border-[#f44336] shadow-md shadow-red-500/20' : 'bg-red-50 text-[#f44336] border-transparent hover:bg-red-100'}`}>
                          <MapPin size={16} /> 
                          {typeof post.location === 'string' && post.location !== t.locationUndetermined ? post.location : t.pinnedSpot}
                          <span className={`text-[10px] px-2 py-0.5 rounded-md ml-2 transition-colors ${expandedMap[post._id] ? 'bg-black/20 text-white' : 'bg-white text-[#f44336] shadow-sm'}`}>
                            {expandedMap[post._id] ? t.closeMap : t.viewMap}
                          </span>
                        </button>
                        {expandedMap[post._id] && (
                          <div className="mt-3 h-[250px] w-full border border-gray-200 rounded-xl overflow-hidden relative z-0 animate-in slide-in-from-top-2 duration-200">
                            <RealMapViewer lat={post.lat} lng={post.lng} role={post.createdBy?.role} location={post.location} />
                          </div>
                        )}
                      </div>
                    )}

                    {Array.isArray(post.images) && post.images.length > 0 && (() => {
                      const normalizedImages = post.images.map((img) => getPostImageUrl(img)).filter(Boolean);
                      if (normalizedImages.length === 0) return null;
                      return (
                        <div className="mb-4 space-y-2">
                          <img
                            src={normalizedImages[0]}
                            alt="media-main"
                            className="w-full rounded-2xl object-cover border border-gray-100 max-h-[420px]"
                          />
                          {normalizedImages.length > 1 && (
                            <div className="grid grid-cols-2 gap-2">
                              {normalizedImages.slice(1).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`media-${idx + 1}`}
                                  className="w-full h-[150px] rounded-xl object-cover border border-gray-100"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
                      {(() => {
                        const likedByCurrentUser = Array.isArray(post.likes) && post.likes.some((userId) => userId?.toString() === currentUser.userId);
                        return (
                          <button
                            type="button"
                            onClick={() => handleLikePost(post._id)}
                            disabled={likingPosts[post._id]}
                            className={`flex items-center gap-1.5 ${likedByCurrentUser ? 'text-[#f44336]' : 'text-gray-500 hover:text-[#f44336]'} transition-colors text-[13px] font-bold disabled:opacity-50`}
                          >
                            <Heart size={20} strokeWidth={2.5} fill={likedByCurrentUser ? '#f44336' : 'none'} /> {likeCount > 0 ? likeCount : 'Thích'}
                          </button>
                        );
                      })()}
                      <button type="button" onClick={() => toggleComments(post._id)} className="flex items-center gap-1.5 text-gray-500 hover:text-[#f44336] transition-colors text-[13px] font-bold">
                        <MessageSquare size={20} strokeWidth={2.5} /> {commentCount ? commentCount : 'Bình luận'}
                      </button>
                      <SavePostButton postId={post._id} postImage={post.images?.[0]} />
                      {post.community && isOwner && post.publishedToProfile === false && (
                        <button
                          type="button"
                          onClick={() => handlePublishToProfile(post._id)}
                          disabled={sharingPostId === post._id}
                          className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                        >
                          {sharingPostId === post._id ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                          {t.shareProfileBtn}
                        </button>
                      )}
                      {post.community && post.publishedToProfile && (
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">{t.onProfile}</span>
                      )}
                      <button type="button" onClick={() => handleCopyPostLink(post._id)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-bold ml-auto">
                        <Share2 size={20} strokeWidth={2.5} />
                      </button>
                    </div>

                    {expandedComments[post._id] && (
                      <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in duration-300">
                        <div className="flex gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                            <img src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 relative">
                            <input 
                              type="text" 
                              placeholder="Viết bình luận..." 
                              className="w-full bg-[#f4f4f5] rounded-full py-2 pl-4 pr-10 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all"
                              value={commentInputs[post._id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({...prev, [post._id]: e.target.value}))}
                              onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post._id)}
                            />
                            <button onClick={() => handlePostComment(post._id)} disabled={isSubmittingComment} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f44336] p-1.5 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50">
                              <Send size={16} />
                            </button>
                          </div>
                        </div>

                        {isFetchingComments[post._id] ? (
                          <div className="flex justify-center py-4"><Loader2 size={24} className="animate-spin text-[#f44336]" /></div>
                        ) : (
                          <div className="space-y-5">
                            {Array.isArray(commentsData[post._id]) && commentsData[post._id].map(comment => {
                              const isCommentAuthor = comment.author?._id?.toString() === currentUser.userId;
                              return (
                                <div key={comment._id || Math.random().toString()} className="text-[13px]">
                                  <div className="flex gap-3 group">
                                    <img src={comment.author?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"} alt="avt" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100" />
                                    <div className="flex-1">
                                      {editingCommentId === comment._id ? (
                                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
                                          <textarea
                                            value={editingCommentContent}
                                            onChange={(e) => setEditingCommentContent(e.target.value)}
                                            className="w-full min-h-[70px] resize-none p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f44336]/40 outline-none text-[13px]"
                                            rows={3}
                                          />
                                          <div className="mt-2 flex justify-between items-center">
                                            <button onClick={cancelEditComment} className="text-gray-600 hover:text-gray-900 text-[12px] font-semibold">Hủy</button>
                                            <button onClick={() => saveEditComment(post._id, comment._id)} className="bg-[#f44336] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-[#e22d41]">Lưu</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-[#f4f4f5] px-4 py-2.5 rounded-2xl rounded-tl-none inline-block">
                                          <p className="font-bold text-gray-900 mb-0.5 text-[12px]">{comment.author?.username}</p>
                                          <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                      )}

                                      <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-bold text-gray-500">
                                        <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                                        <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => setReplyingTo({ parentId: comment._id, childUsername: null })}>Phản hồi</button>
                                        {isCommentAuthor && (
                                          <>
                                            <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => startEditComment(comment._id, comment.content)}>Sửa</button>
                                            <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => showDeleteConfirm(post._id, comment._id)}>Xóa</button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                                  <div className="mt-3 ml-[44px] space-y-4 border-l-2 border-gray-100 pl-4 relative">
                                    {comment.replies.map((reply) => (
                                      <div key={reply._id || Math.random().toString()} className="flex gap-2">
                                        <img src={reply.author?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"} alt="avt" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                        <div className="flex-1">
                                          <div className="bg-white border border-gray-100 shadow-sm px-3 py-2 rounded-2xl rounded-tl-none inline-block">
                                            <p className="font-bold text-gray-900 mb-0.5 text-[12px]">{reply.author?.username}</p>
                                            {editingCommentId === reply._id ? (
                                              <div>
                                                <textarea
                                                  value={editingCommentContent}
                                                  onChange={(e) => setEditingCommentContent(e.target.value)}
                                                  className="w-full min-h-[70px] resize-none p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f44336]/40 outline-none text-[13px]"
                                                  rows={3}
                                                />
                                                <div className="mt-2 flex justify-between items-center">
                                                  <button onClick={cancelEditComment} className="text-gray-600 hover:text-gray-900 text-[12px] font-semibold">Hủy</button>
                                                  <button onClick={() => saveEditComment(post._id, reply._id)} className="bg-[#f44336] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-[#e22d41]">Lưu</button>
                                                </div>
                                              </div>
                                            ) : typeof reply.content === 'string' && reply.content.startsWith('@') ? (
                                              <p className="text-gray-800 whitespace-pre-wrap">
                                                <span className="text-[#00897b] font-bold mr-1">{reply.content.split(' ')[0]}</span>
                                                <span>{reply.content.substring(reply.content.indexOf(' ') + 1)}</span>
                                              </p>
                                            ) : (
                                              <p className="text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-bold text-gray-500">
                                            <span>{reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                                            <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => setReplyingTo({ parentId: comment._id, childUsername: reply.author?.username })}>Phản hồi</button>
                                            {reply.author?._id?.toString() === currentUser.userId && (
                                              <>
                                                <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => startEditComment(reply._id, reply.content)}>Sửa</button>
                                                <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => showDeleteConfirm(post._id, reply._id)}>Xóa</button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {replyingTo.parentId === comment._id && (
                                  <div className="mt-3 ml-[44px] flex gap-2 animate-in slide-in-from-top-1 fade-in">
                                    <CornerDownRight size={16} className="text-gray-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1 relative">
                                      <input 
                                        type="text" autoFocus placeholder={replyingTo.childUsername ? `Đang phản hồi @${replyingTo.childUsername}...` : `Phản hồi ${comment.author?.username}...`}
                                        className="w-full bg-white border border-[#f44336]/30 shadow-sm rounded-full py-2 pl-4 pr-10 text-[12px] font-medium focus:outline-none focus:border-[#f44336] transition-all"
                                        value={replyInputs[comment._id] || ''}
                                        onChange={(e) => setReplyInputs(prev => ({...prev, [comment._id]: e.target.value}))}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post._id, comment._id)}
                                      />
                                      <button type="button" onClick={() => handlePostComment(post._id, comment._id)} disabled={isSubmittingComment} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f44336] p-1.5 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50">
                                        <Send size={14} />
                                      </button>
                                    </div>
                                    <button type="button" onClick={() => setReplyingTo({ parentId: null, childUsername: null })} className="text-gray-400 hover:text-gray-900 mt-2"><X size={16}/></button>
                                  </div>
                                )}
                              </div>
                            )})}
                            {(!commentsData[post._id] || commentsData[post._id].length === 0) && (
                              <div className="text-center py-6 text-gray-400 text-[13px] font-bold">{t.noComment}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}

export default function CommunityDetail() {
  return <CommunityDetailPage />;
}