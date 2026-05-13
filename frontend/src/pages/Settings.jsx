import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Lock, Palette, Languages, Camera, Edit2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AccountMenu from '../components/AccountMenu';

const copy = {
  vi: {
    navDashboard: 'Bảng tin',
    navExplore: 'Khám phá',
    navCommunity: 'Cộng đồng',
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
    placeholderTitle: 'Tính năng đang được hoàn thiện',
    placeholderText: 'Khu vực này sẽ được cập nhật trong bước tiếp theo.',
  },
  en: {
    navDashboard: 'Dashboard',
    navExplore: 'Explore',
    navCommunity: 'Community',
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
    placeholderTitle: 'This section is still in progress',
    placeholderText: 'We will complete this area in a follow-up step.',
  },
};

export default function Settings() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = copy[language];
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({ displayName: '', bio: '', avatar: '', cover: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [languageMessage, setLanguageMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();

        const data = await res.json();
        const user = data.user || data;
        setProfileData({
          displayName: user.displayName || user.username || '',
          bio: user.bio || '',
          avatar: user.avatar || '',
          cover: user.cover || '',
        });
        setAvatarPreview(user.avatar || '');
        setCoverPreview(user.cover || '');
      } catch (error) {
        setProfileMessage(t.loadError);
      }
    };

    loadProfile();
  }, [t.loadError]);

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

      const formData = new FormData();
      formData.append('displayName', profileData.displayName);
      formData.append('bio', profileData.bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (coverFile) formData.append('cover', coverFile);

      const res = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

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

  const renderPlaceholder = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-black text-gray-900 mb-2">{t.placeholderTitle}</h3>
      <p className="text-sm text-gray-500 font-medium">{t.placeholderText}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 pb-12">
      <header className="flex items-center justify-between py-3 px-6 bg-white sticky top-0 z-50 border-b border-gray-100">
        <button onClick={() => navigate('/dashboard')} className="text-[#f44336] font-extrabold text-xl tracking-tight">
          The Wanderer
        </button>

        <nav className="hidden md:flex items-center gap-8 text-[14px] font-bold text-gray-500">
          <button onClick={() => navigate('/dashboard')} className="hover:text-gray-900 transition-colors py-4">
            {t.navDashboard}
          </button>
          <button onClick={() => navigate('/explore')} className="hover:text-gray-900 transition-colors py-4">
            {t.navExplore}
          </button>
          <button onClick={() => navigate('/community')} className="hover:text-gray-900 transition-colors py-4">
            {t.navCommunity}
          </button>
        </nav>

        <AccountMenu avatar={avatarPreview || profileData.avatar} username={profileData.displayName} />
      </header>

      <main className="max-w-[1320px] mx-auto px-6 2xl:px-8 pt-10 flex gap-8 items-start">
        <aside className="w-[240px] flex-shrink-0 sticky top-[88px]">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900">{t.title}</h1>
            <p className="text-[12px] font-medium text-gray-500">{t.subtitle}</p>
          </div>

          <nav className="space-y-1 text-[13px] font-bold text-gray-600">
            {menuItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  activeTab === id ? 'bg-white text-[#f44336] shadow-sm' : 'hover:bg-white hover:shadow-sm'
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
                <h2 className="text-xl font-black text-gray-900">{t.profileTitle}</h2>
                <p className="text-[13px] text-gray-500 font-medium">{t.profileSubtitle}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="relative mb-16 overflow-hidden rounded-xl">
                  <img
                    src={coverPreview || 'https://images.unsplash.com/photo-1502602898657-3e90760b628e?auto=format&fit=crop&w=1000&q=80'}
                    alt={t.coverAlt}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-end justify-end p-4">
                    <label className="bg-white text-gray-700 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-gray-100">
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
                      className="w-28 h-28 rounded-full border-4 border-white object-cover bg-white shadow-sm"
                    />
                    <label className="absolute bottom-0 right-0 bg-[#f44336] text-white p-2 rounded-full border-2 border-white hover:bg-[#d32f2f] cursor-pointer">
                      <Edit2 size={14} strokeWidth={3} />
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="pt-16 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                        {t.displayName}
                      </label>
                      <input
                        type="text"
                        value={profileData.displayName}
                        onChange={(event) => setProfileData((prev) => ({ ...prev, displayName: event.target.value }))}
                        className="w-full bg-[#f4f4f5] border-transparent rounded-lg px-4 py-3 text-[13px] font-bold text-gray-800 focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                        {t.bio}
                      </label>
                      <input
                        type="text"
                        value={profileData.bio}
                        onChange={(event) => setProfileData((prev) => ({ ...prev, bio: event.target.value }))}
                        placeholder={t.bioPlaceholder}
                        className="w-full bg-[#f4f4f5] border-transparent rounded-lg px-4 py-3 text-[13px] font-medium text-gray-700 focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white"
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

          {activeTab === 'language' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">{t.languageTitle}</h2>
                <p className="text-[13px] text-gray-500 font-medium">{t.languageSubtitle}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                {[
                  { value: 'vi', label: t.vietnamese },
                  { value: 'en', label: t.english },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center justify-between rounded-xl border px-4 py-4 cursor-pointer transition-colors ${
                      language === option.value ? 'border-[#f44336] bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{option.label}</p>
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

          {!['profile', 'language'].includes(activeTab) && renderPlaceholder()}
        </section>
      </main>
    </div>
  );
}
