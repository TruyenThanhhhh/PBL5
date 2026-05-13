import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Camera, Plus, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const copy = {
  vi: {
    heroTitle: 'Tham gia cộng đồng xê dịch lớn nhất',
    heroText: 'Cùng hơn 50.000 người khám phá và chia sẻ hành trình của mình.',
    title: 'Tạo tài khoản',
    subtitle: 'Bắt đầu chuyến đi tiếp theo của bạn ngay hôm nay.',
    photo: 'Tải ảnh lên',
    username: 'Tên người dùng',
    email: 'Địa chỉ email',
    password: 'Mật khẩu',
    confirmPassword: 'Xác nhận mật khẩu',
    agreePrefix: 'Tôi đồng ý với',
    terms: 'Điều khoản dịch vụ',
    privacy: 'Chính sách riêng tư',
    submit: 'Tạo tài khoản',
    submitting: 'Đang xử lý...',
    or: 'HOẶC THAM GIA BẰNG',
    already: 'Đã có tài khoản?',
    login: 'Đăng nhập',
    passwordMismatch: 'Mật khẩu xác nhận không khớp!',
    success: 'Đăng ký thành công! Chào mừng bạn!',
    error: 'Có lỗi xảy ra khi đăng ký.',
    network: 'Không thể kết nối đến máy chủ.',
  },
  en: {
    heroTitle: 'Join the world’s greatest wanderlust community',
    heroText: 'Join 50,000+ explorers sharing their journeys.',
    title: 'Create Your Account',
    subtitle: 'Start your next adventure today.',
    photo: 'Upload photo',
    username: 'Username',
    email: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    agreePrefix: 'I agree to the',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    submit: 'Create Account',
    submitting: 'Processing...',
    or: 'OR JOIN WITH',
    already: 'Already have an account?',
    login: 'Log in',
    passwordMismatch: 'Password confirmation does not match!',
    success: 'Registration successful! Welcome!',
    error: 'Something went wrong during registration.',
    network: 'Unable to connect to the server.',
  },
};

export default function Register() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = copy[language];
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: t.passwordMismatch });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      if (avatarFile) formData.append('avatar', avatarFile);

      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: t.success });
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage({ type: 'error', text: data.message || t.error });
      }
    } catch {
      setMessage({ type: 'error', text: t.network });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans w-full">
      <div className="hidden lg:flex w-[45%] bg-cover bg-center p-12 flex-col justify-between relative" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80")' }}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <span className="text-white text-xl font-extrabold tracking-tight">The Wanderer</span>
        </div>
        <div className="relative z-10 text-white pb-8">
          <h1 className="text-[3rem] font-bold leading-[1.1] mb-8 tracking-tight max-w-md">{t.heroTitle}</h1>
          <p className="text-[13px] text-white/90 font-medium">{t.heroText}</p>
        </div>
      </div>

      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-[#f44336] mb-2">{t.title}</h2>
            <p className="text-gray-500 text-[13px] font-medium">{t.subtitle}</p>
          </div>

          {message.text && <div className={`mb-4 p-3 rounded-lg text-[13px] font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{message.text}</div>}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="flex flex-col items-center mb-6">
              <label className="relative cursor-pointer group">
                <div className="w-20 h-20 bg-[#f4f4f5] rounded-full flex items-center justify-center text-gray-400 overflow-hidden group-hover:bg-gray-200 transition-colors">
                  {avatarPreview ? <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" /> : <Camera size={26} strokeWidth={2} />}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#f44336] rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                  <Plus size={14} strokeWidth={3} />
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
              <span className="text-[10px] font-bold tracking-widest text-gray-500 mt-3 uppercase">{t.photo}</span>
            </div>

            {[
              [User, 'text', username, setUsername, t.username],
              [Mail, 'email', email, setEmail, t.email],
            ].map(([Icon, type, value, setter, placeholder]) => (
              <div key={placeholder} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400"><Icon size={16} strokeWidth={2.5} /></div>
                <input type={type} required value={value} onChange={(e) => setter(e.target.value)} className="block w-full pl-10 pr-3 py-3 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white transition-all placeholder-gray-400 font-medium" placeholder={placeholder} />
              </div>
            ))}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400"><Lock size={16} strokeWidth={2.5} /></div>
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-10 py-3 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white transition-all placeholder-gray-400 font-medium" placeholder={t.password} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400"><Lock size={16} strokeWidth={2.5} /></div>
              <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full pl-10 pr-3 py-3 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white transition-all placeholder-gray-400 font-medium" placeholder={t.confirmPassword} />
            </div>

            <div className="flex items-start pt-2 pb-3">
              <input id="terms" type="checkbox" required className="h-4 w-4 text-[#f44336] focus:ring-[#f44336] border-gray-300 rounded cursor-pointer mt-0.5" />
              <label htmlFor="terms" className="ml-2 text-[11px] text-gray-500 font-medium leading-tight cursor-pointer">
                {t.agreePrefix} <a href="#" className="text-[#f44336] font-bold hover:underline">{t.terms}</a> {language === 'vi' ? 'và' : 'and'} <a href="#" className="text-[#f44336] font-bold hover:underline">{t.privacy}</a>.
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-[#f44336] hover:bg-[#e53935] transition-all disabled:opacity-70">
              {isLoading ? <><Loader2 className="animate-spin mr-2" size={18} /> {t.submitting}</> : t.submit}
            </button>
          </form>

          <div className="mt-7 mb-5 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-white px-4 text-gray-400">{t.or}</span></div>
          </div>

          <div className="flex gap-3">
            <button type="button" className="w-1/2 py-3 px-4 border border-gray-200 rounded-xl bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Google</button>
            <button type="button" className="w-1/2 py-3 px-4 border border-gray-200 rounded-xl bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Facebook</button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[13px] font-medium text-gray-600">
              {t.already}{' '}
              <Link to="/login" className="text-[#f44336] font-bold hover:underline">{t.login}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
