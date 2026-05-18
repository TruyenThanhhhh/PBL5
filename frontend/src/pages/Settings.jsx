import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Shield, Lock, Palette, Languages, Camera, Edit2, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import AccountMenu from '../components/AccountMenu';

const API_BASE = 'http://localhost:5000';

const copy = {
  vi: {
    navDashboard: 'Trang chủ',
    navExplore: 'Khám phá',
    navCommunity: 'Cộng đồng',
    navFriends: 'Bạn bè',
    title: 'Cài đặt',
    subtitle: 'Quản lý tài khoản và trải nghiệm của bạn',
    profile: 'Hồ sơ',
    account: 'Bảo mật tài khoản',
    privacy: 'Quyền riêng tư',
    appearance: 'Giao diện',
    language: 'Ngôn ngữ',
    profileTitle: 'Hồ sơ cá nhân',
    profileSubtitle: 'Cập nhật thông tin hiển thị công khai của bạn.',
    coverAlt: 'Ảnh bìa',
    avatarAlt: 'Ảnh đại diện',
    changeCover: 'Thay ảnh bìa',
    displayName: 'Tên hiển thị',
    bio: 'Tiểu sử',
    bioPlaceholder: 'Viết vài dòng giới thiệu về bạn',
    save: 'Lưu thay đổi',
    saving: 'Đang lưu...',
    loginRequired: 'Vui lòng đăng nhập để cập nhật hồ sơ.',
    loadError: 'Không thể tải hồ sơ.',
    saveError: 'Không thể lưu hồ sơ.',
    saveSuccess: 'Cập nhật hồ sơ thành công.',
    languageTitle: 'Ngôn ngữ hiển thị',
    languageSubtitle: 'Chọn ngôn ngữ mặc định cho toàn bộ giao diện.',
    vietnamese: 'Tiếng Việt',
    english: 'Tiếng Anh',
    languageSaved: 'Đã cập nhật ngôn ngữ hiển thị.',
    accountTitle: 'Bảo mật tài khoản',
    accountSubtitle: 'Quản lý mật khẩu và bảo vệ tài khoản của bạn.',
    currentPassword: 'Mật khẩu hiện tại',
    newPassword: 'Mật khẩu mới',
    confirmPassword: 'Xác nhận mật khẩu',
    changePassword: 'Đổi mật khẩu',
    changingPassword: 'Đang đổi...',
    passwordMismatch: 'Mật khẩu xác nhận không khớp.',
    passwordSuccess: 'Đổi mật khẩu thành công.',
    passwordError: 'Không thể đổi mật khẩu.',
    privacyTitle: 'Quyền riêng tư',
    privacySubtitle: 'Kiểm soát ai có thể xem và tương tác với bạn.',
    profileVisibility: 'Hiển thị hồ sơ',
    visibilityPublic: 'Công khai — mọi người có thể xem',
    visibilityFriends: 'Bạn bè — chỉ bạn bè xem được',
    visibilityPrivate: 'Riêng tư — chỉ mình bạn',
    allowFriendRequests: 'Cho phép nhận lời mời kết bạn',
    allowFriendRequestsDesc: 'Người khác có thể gửi lời mời kết bạn cho bạn',
    showActivity: 'Hiển thị hoạt động',
    showActivityDesc: 'Cho phép bạn bè thấy hoạt động gần đây của bạn',
    blockedUsers: 'Người dùng đã chặn',
    blockedUsersDesc: 'Những người bạn đã chặn sẽ không thể tương tác với bạn',
    noBlockedUsers: 'Bạn chưa chặn ai.',
    unblock: 'Bỏ chặn',
    privacySave: 'Lưu cài đặt',
    privacySaving: 'Đang lưu...',
    privacySuccess: 'Đã cập nhật quyền riêng tư.',
    privacyError: 'Không thể cập nhật quyền riêng tư.',
    appearanceTitle: 'Giao diện',
    appearanceSubtitle: 'Tùy chỉnh giao diện hiển thị của ứng dụng.',
    themeLight: 'Sáng',
    themeLightDesc: 'Giao diện sáng, dễ đọc ban ngày',
    themeDark: 'Tối',
    themeDarkDesc: 'Giao diện tối, thoải mái cho mắt ban đêm',
    themeSaved: 'Đã cập nhật giao diện.',
  },
  en: {
    navDashboard: 'Home',
    navExplore: 'Explore',
    navCommunity: 'Community',
    navFriends: 'Friends',
    title: 'Settings',
    subtitle: 'Manage your account and experience',
    profile: 'Profile',
    account: 'Account Security',
    privacy: 'Privacy',
    appearance: 'Appearance',
    language: 'Language',
    profileTitle: 'Profile',
    profileSubtitle: 'Update your public identity and profile details.',
    coverAlt: 'Cover image',
    avatarAlt: 'Avatar',
    changeCover: 'Change cover',
    displayName: 'Display name',
    bio: 'Bio',
    bioPlaceholder: 'Write a few lines about yourself',
    save: 'Save changes',
    saving: 'Saving...',
    loginRequired: 'Please sign in to update your profile.',
    loadError: 'Unable to load profile.',
    saveError: 'Unable to save profile.',
    saveSuccess: 'Profile updated successfully.',
    languageTitle: 'Display language',
    languageSubtitle: 'Choose the default language for the interface.',
    vietnamese: 'Vietnamese',
    english: 'English',
    languageSaved: 'Display language updated.',
    accountTitle: 'Account Security',
    accountSubtitle: 'Manage your password and account protection.',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    changePassword: 'Change password',
    changingPassword: 'Changing...',
    passwordMismatch: 'Password confirmation does not match.',
    passwordSuccess: 'Password changed successfully.',
    passwordError: 'Unable to change password.',
    privacyTitle: 'Privacy',
    privacySubtitle: 'Control who can see and interact with you.',
    profileVisibility: 'Profile visibility',
    visibilityPublic: 'Public — everyone can view',
    visibilityFriends: 'Friends — friends only',
    visibilityPrivate: 'Private — only you',
    allowFriendRequests: 'Allow friend requests',
    allowFriendRequestsDesc: 'Others can send you friend requests',
    showActivity: 'Show activity',
    showActivityDesc: 'Let friends see your recent activity',
    blockedUsers: 'Blocked users',
    blockedUsersDesc: 'Blocked users cannot interact with you',
    noBlockedUsers: 'You have not blocked anyone.',
    unblock: 'Unblock',
    privacySave: 'Save settings',
    privacySaving: 'Saving...',
    privacySuccess: 'Privacy settings updated.',
    privacyError: 'Unable to update privacy settings.',
    appearanceTitle: 'Appearance',
    appearanceSubtitle: 'Customize how the app looks.',
    themeLight: 'Light',
    themeLightDesc: 'Bright interface for daytime use',
    themeDark: 'Dark',
    themeDarkDesc: 'Dark interface, easier on the eyes at night',
    themeSaved: 'Appearance updated.',
  },
};

export default function Settings() {
  const { language, setLanguage } = useLanguage();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const t = copy[language] || copy.vi;
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({ displayName: '', bio: '', avatar: '', cover: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [languageMessage, setLanguageMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    allowFriendRequests: true,
    showActivity: true,
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [privacyMessage, setPrivacyMessage] = useState('');
  const [appearanceMessage, setAppearanceMessage] = useState('');

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();

        const data = await res.json();
        if (cancelled) return;
        const user = data.user || data;
        setProfileData({
          displayName: user.displayName || user.username || '',
          bio: user.bio || '',
          avatar: user.avatar || '',
          cover: user.cover || '',
        });
        setAvatarPreview(user.avatar || '');
        setCoverPreview(user.cover || '');
        setPrivacySettings({
          profileVisibility: user.profileVisibility || 'public',
          allowFriendRequests: user.allowFriendRequests !== false,
          showActivity: user.showActivity !== false,
        });
        const rawBlocked = user.blockedUsers || [];
        setBlockedUsers(
          rawBlocked.map((u) =>
            typeof u === 'object' && u !== null
              ? {
                  _id: u._id,
                  username: u.username,
                  displayName: u.displayName || u.username,
                  avatar: u.avatar,
                }
              : null
          ).filter(Boolean)
        );
        setProfileMessage('');
      } catch {
        if (!cancelled) setProfileMessage((copy[language] || copy.vi).loadError);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    if (activeTab !== 'privacy') return;
    let cancelled = false;

    const refreshBlocked = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const user = data.user || data;
        const rawBlocked = user.blockedUsers || [];
        setBlockedUsers(
          rawBlocked.map((u) =>
            typeof u === 'object' && u !== null
              ? {
                  _id: u._id,
                  username: u.username,
                  displayName: u.displayName || u.username,
                  avatar: u.avatar,
                }
              : null
          ).filter(Boolean)
        );
      } catch {
        if (!cancelled) setBlockedUsers([]);
      }
    };

    refreshBlocked();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const menuItems = useMemo(
    () => [
      { id: 'profile', label: t.profile, icon: User },
      { id: 'account', label: t.account, icon: Shield },
      { id: 'privacy', label: t.privacy, icon: Lock },
      { id: 'appearance', label: t.appearance, icon: Palette },
      { id: 'language', label: t.language, icon: Languages },
    ],
    [t]
  );

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setProfileMessage(t.loginRequired);
        return;
      }

      let res;
      if (!avatarFile && !coverFile) {
        res = await fetch(`${API_BASE}/api/users/profile`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displayName: profileData.displayName,
            bio: profileData.bio,
          }),
        });
        if (!res.ok) {
          const formData = new FormData();
          formData.append('displayName', profileData.displayName);
          formData.append('bio', profileData.bio);
          res = await fetch(`${API_BASE}/api/users/update-profile`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
        }
      } else {
        const formData = new FormData();
        formData.append('displayName', profileData.displayName);
        formData.append('bio', profileData.bio);
        if (avatarFile) formData.append('avatar', avatarFile);
        if (coverFile) formData.append('cover', coverFile);
        res = await fetch(`${API_BASE}/api/users/update-profile`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || t.saveError);
      }

      const user = result.user || {};
      setProfileData((prev) => ({ ...prev, ...user }));
      setAvatarPreview(user.avatar || avatarPreview);
      setCoverPreview(user.cover || coverPreview);
      setProfileMessage(t.saveSuccess);

      if (user.displayName) localStorage.setItem('displayName', user.displayName);
      if (user.avatar) localStorage.setItem('avatar', user.avatar);
    } catch (error) {
      setProfileMessage(error.message || t.saveError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordMessage(t.passwordMismatch);
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPasswordMessage(t.loginRequired);
        return;
      }

      const res = await fetch(`${API_BASE}/api/users/change-password`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || t.passwordError);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage(t.passwordSuccess);
    } catch (error) {
      setPasswordMessage(error.message || t.passwordError);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePrivacy = async () => {
    setIsSavingPrivacy(true);
    setPrivacyMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPrivacyMessage(t.loginRequired);
        return;
      }

      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: profileData.displayName,
          bio: profileData.bio,
          ...privacySettings,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || t.privacyError);
      if (result.user) {
        setProfileData((prev) => ({
          ...prev,
          displayName: result.user.displayName ?? prev.displayName,
          bio: result.user.bio ?? prev.bio,
        }));
        setPrivacySettings({
          profileVisibility: result.user.profileVisibility || 'public',
          allowFriendRequests: result.user.allowFriendRequests !== false,
          showActivity: result.user.showActivity !== false,
        });
      }
      setPrivacyMessage(t.privacySuccess);
    } catch (error) {
      setPrivacyMessage(error.message || t.privacyError);
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/unblock/${userId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) return;
      setBlockedUsers((prev) => prev.filter((u) => String(u._id) !== String(userId)));
    } catch {
      /* ignore */
    }
  };

  const handleThemeChange = (dark) => {
    setIsDarkMode(dark);
    setAppearanceMessage(t.themeSaved);
  };

  const pageBg = isDarkMode ? 'bg-[#0f172a] text-gray-100' : 'bg-[#f8f9fa] text-gray-900';
  const headerBar = isDarkMode
    ? 'bg-[#1e293b]/90 backdrop-blur-md border-gray-700'
    : 'bg-white border-gray-100';
  const navMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const heading = isDarkMode ? 'text-white' : 'text-gray-900';
  const subheading = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const cardClass = isDarkMode
    ? 'bg-[#1e293b] rounded-2xl shadow-sm border border-gray-700 p-6'
    : 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6';
  const inputClass = isDarkMode
    ? 'w-full bg-gray-800 border-transparent rounded-lg px-4 py-3 text-[13px] font-medium text-gray-100 focus:ring-2 focus:ring-[#f44336]/20 focus:bg-gray-900'
    : 'w-full bg-[#f4f4f5] border-transparent rounded-lg px-4 py-3 text-[13px] font-bold text-gray-800 focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white';
  const inputClassMedium = isDarkMode
    ? 'w-full bg-gray-800 border-transparent rounded-lg px-4 py-3 text-[13px] font-medium text-gray-100 focus:ring-2 focus:ring-[#f44336]/20 focus:bg-gray-900'
    : 'w-full bg-[#f4f4f5] border-transparent rounded-lg px-4 py-3 text-[13px] font-medium text-gray-700 focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white';
  const labelClass = `block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
  const sidebarBtnInactive = isDarkMode
    ? 'hover:bg-[#1e293b] hover:shadow-sm text-gray-300'
    : 'hover:bg-white hover:shadow-sm text-gray-600';
  const sidebarBtnActive = isDarkMode ? 'bg-[#1e293b] text-[#f44336] shadow-sm border border-gray-700' : 'bg-white text-[#f44336] shadow-sm';

  return (
    <div className={`min-h-screen font-sans pb-12 transition-colors duration-300 ${pageBg}`}>
      <header className={`h-[72px] flex items-center justify-between px-6 sticky top-0 z-50 border-b shadow-sm ${headerBar}`}>
        <div className="w-1/4 min-w-0">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">
            The Wanderer
          </Link>
        </div>

        <nav className={`hidden md:flex flex-1 justify-center items-center gap-10 text-[15px] font-bold ${navMuted}`}>
          <Link to="/dashboard" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">
            {t.navDashboard}
          </Link>
          <Link to="/explore" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">
            {t.navExplore}
          </Link>
          <Link to="/community" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">
            {t.navCommunity}
          </Link>
          <Link to="/friends" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">
            {t.navFriends}
          </Link>
        </nav>

        <div className="w-1/4 flex justify-end shrink-0 min-w-0">
          <AccountMenu avatar={avatarPreview || profileData.avatar} username={profileData.displayName} />
        </div>
      </header>

      <main className="max-w-[1320px] mx-auto px-6 2xl:px-8 pt-10 flex gap-8 items-start">
        <aside className="w-[240px] flex-shrink-0 sticky top-[88px]">
          <div className="mb-6">
            <h1 className={`text-2xl font-black ${heading}`}>{t.title}</h1>
            <p className={`text-[12px] font-medium ${subheading}`}>{t.subtitle}</p>
          </div>

          <nav className={`space-y-1 text-[13px] font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {menuItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  activeTab === id ? sidebarBtnActive : sidebarBtnInactive
                }`}
              >
                <Icon size={18} strokeWidth={2.5} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-black ${heading}`}>{t.profileTitle}</h2>
                <p className={`text-[13px] font-medium ${subheading}`}>{t.profileSubtitle}</p>
              </div>

              <div className={`relative rounded-2xl shadow-sm p-6 ${cardClass}`}>
                <div className="relative mb-16 overflow-hidden rounded-xl">
                  <img
                    src={coverPreview || 'https://images.unsplash.com/photo-1502602898657-3e90760b628e?auto=format&fit=crop&w=1000&q=80'}
                    alt={t.coverAlt}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-end justify-end p-4">
                    <label className={`text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                      isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}>
                      <Camera size={14} /> {t.changeCover}
                      <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="absolute -mt-14 ml-6 z-10">
                  <div className="relative">
                    <img
                      src={avatarPreview || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt={t.avatarAlt}
                      className={`w-28 h-28 rounded-full border-4 object-cover shadow-sm ${
                        isDarkMode ? 'border-[#1e293b] bg-gray-800' : 'border-white bg-white'
                      }`}
                    />
                    <label className={`absolute bottom-0 right-0 bg-[#f44336] text-white p-2 rounded-full border-2 hover:bg-[#d32f2f] cursor-pointer ${
                      isDarkMode ? 'border-[#1e293b]' : 'border-white'
                    }`}>
                      <Edit2 size={14} strokeWidth={3} />
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="pt-16 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className={labelClass}>{t.displayName}</label>
                      <input
                        type="text"
                        value={profileData.displayName}
                        onChange={(event) => setProfileData((prev) => ({ ...prev, displayName: event.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t.bio}</label>
                      <input
                        type="text"
                        value={profileData.bio}
                        onChange={(event) => setProfileData((prev) => ({ ...prev, bio: event.target.value }))}
                        placeholder={t.bioPlaceholder}
                        className={inputClassMedium}
                      />
                    </div>
                  </div>

                  {profileMessage && (
                    <p className={`mb-4 text-sm font-bold ${profileMessage === t.saveSuccess ? 'text-green-600' : 'text-red-600'}`}>
                      {profileMessage}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="bg-[#f44336] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#e53935] shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
                    >
                      {isSavingProfile ? t.saving : t.save}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-black ${heading}`}>{t.accountTitle}</h2>
                <p className={`text-[13px] font-medium ${subheading}`}>{t.accountSubtitle}</p>
              </div>

              <div className={cardClass}>
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className={labelClass}>{t.currentPassword}</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`${inputClassMedium} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((v) => !v)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showCurrentPassword ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t.newPassword}</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`${inputClassMedium} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showNewPassword ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t.confirmPassword}</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`${inputClassMedium} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showConfirmPassword ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>
                </div>

                {passwordMessage && (
                  <p
                    className={`mt-4 text-sm font-bold ${
                      passwordMessage === t.passwordSuccess ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {passwordMessage}
                  </p>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="bg-[#f44336] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#e53935] shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
                  >
                    {isChangingPassword ? t.changingPassword : t.changePassword}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-black ${heading}`}>{t.privacyTitle}</h2>
                <p className={`text-[13px] font-medium ${subheading}`}>{t.privacySubtitle}</p>
              </div>

              <div className={`${cardClass} space-y-6`}>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t.profileVisibility}
                  </p>
                  <div className="space-y-2">
                    {[
                      { value: 'public', label: t.visibilityPublic },
                      { value: 'friends', label: t.visibilityFriends },
                      { value: 'private', label: t.visibilityPrivate },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer text-[13px] font-bold ${
                          privacySettings.profileVisibility === opt.value
                            ? 'border-[#f44336] bg-red-50 dark:bg-red-950/30'
                            : isDarkMode
                              ? 'border-gray-600 hover:border-gray-500'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className={heading}>{opt.label}</span>
                        <input
                          type="radio"
                          name="profileVisibility"
                          checked={privacySettings.profileVisibility === opt.value}
                          onChange={() => setPrivacySettings((p) => ({ ...p, profileVisibility: opt.value }))}
                          className="w-4 h-4 accent-[#f44336]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {[
                  {
                    key: 'allowFriendRequests',
                    title: t.allowFriendRequests,
                    desc: t.allowFriendRequestsDesc,
                  },
                  {
                    key: 'showActivity',
                    title: t.showActivity,
                    desc: t.showActivityDesc,
                  },
                ].map((row) => (
                  <div
                    key={row.key}
                    className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-4 ${
                      isDarkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-bold ${heading}`}>{row.title}</p>
                      <p className={`text-xs font-medium mt-0.5 ${subheading}`}>{row.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={privacySettings[row.key]}
                      onClick={() => setPrivacySettings((p) => ({ ...p, [row.key]: !p[row.key] }))}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                        privacySettings[row.key] ? 'bg-[#f44336]' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                          privacySettings[row.key] ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                ))}

                <div className={`pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t.blockedUsers}
                  </p>
                  <p className={`text-xs font-medium mb-4 ${subheading}`}>{t.blockedUsersDesc}</p>
                  {blockedUsers.length === 0 ? (
                    <p className={`text-sm font-medium ${subheading}`}>{t.noBlockedUsers}</p>
                  ) : (
                    <ul className="space-y-2">
                      {blockedUsers.map((u) => (
                        <li
                          key={u._id}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                            isDarkMode ? 'bg-gray-800/80' : 'bg-[#f4f4f5]'
                          }`}
                        >
                          <span className={`text-[13px] font-bold truncate ${heading}`}>
                            {u.displayName || u.username}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUnblock(u._id)}
                            className="text-[12px] font-bold text-[#f44336] shrink-0 ml-2 hover:underline"
                          >
                            {t.unblock}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {privacyMessage && (
                  <p
                    className={`text-sm font-bold ${
                      privacyMessage === t.privacySuccess ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {privacyMessage}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSavePrivacy}
                    disabled={isSavingPrivacy}
                    className="bg-[#f44336] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#e53935] shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
                  >
                    {isSavingPrivacy ? t.privacySaving : t.privacySave}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-black ${heading}`}>{t.appearanceTitle}</h2>
                <p className={`text-[13px] font-medium ${subheading}`}>{t.appearanceSubtitle}</p>
              </div>

              <div className={`${cardClass} space-y-4`}>
                {[
                  { dark: false, label: t.themeLight, desc: t.themeLightDesc, icon: Sun },
                  { dark: true, label: t.themeDark, desc: t.themeDarkDesc, icon: Moon },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const selected = isDarkMode === opt.dark;
                  return (
                    <label
                      key={opt.dark ? 'dark' : 'light'}
                      className={`flex items-center justify-between rounded-xl border px-4 py-4 cursor-pointer transition-colors ${
                        selected
                          ? 'border-[#f44336] bg-red-50 dark:bg-red-950/30'
                          : isDarkMode
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 ${selected ? 'text-[#f44336]' : subheading}`}>
                          <Icon size={22} strokeWidth={2.25} />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold ${heading}`}>{opt.label}</p>
                          <p className={`text-xs font-medium ${subheading}`}>{opt.desc}</p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="theme"
                        checked={selected}
                        onChange={() => handleThemeChange(opt.dark)}
                        className="w-4 h-4 accent-[#f44336] shrink-0"
                      />
                    </label>
                  );
                })}
                {appearanceMessage && <p className="text-sm font-bold text-green-600">{appearanceMessage}</p>}
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-black ${heading}`}>{t.languageTitle}</h2>
                <p className={`text-[13px] font-medium ${subheading}`}>{t.languageSubtitle}</p>
              </div>

              <div className={`${cardClass} space-y-4`}>
                {[
                  { value: 'vi', label: t.vietnamese },
                  { value: 'en', label: t.english },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center justify-between rounded-xl border px-4 py-4 cursor-pointer transition-colors ${
                      language === option.value
                        ? 'border-[#f44336] bg-red-50 dark:bg-red-950/30 dark:border-[#f44336]'
                        : isDarkMode
                          ? 'border-gray-600 hover:border-gray-500'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-bold ${heading}`}>{option.label}</p>
                    </div>
                    <input
                      type="radio"
                      name="language"
                      value={option.value}
                      checked={language === option.value}
                      onChange={() => {
                        setLanguage(option.value);
                        setLanguageMessage(copy[option.value].languageSaved);
                      }}
                      className="w-4 h-4 accent-[#f44336]"
                    />
                  </label>
                ))}

                {languageMessage && <p className="text-sm font-bold text-green-600">{languageMessage}</p>}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}