import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Loader2 } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useLanguage } from '../contexts/LanguageContext';

const copy = {
  vi: {
    brandName: "The Wanderer",
    heroTitle: "Gia nhập Cộng đồng Đam mê Xê dịch Lớn nhất Thế giới",
    heroSubtitle: "Cùng 50k+ nhà thám hiểm chia sẻ hành trình của họ.",
    createAccount: "Tạo tài khoản",
    startAdventure: "Bắt đầu chuyến phiêu lưu của bạn ngay hôm nay.",
    usernamePlaceholder: "Tên đăng nhập",
    emailPlaceholder: "Địa chỉ Email",
    passwordPlaceholder: "Mật khẩu",
    confirmPasswordPlaceholder: "Xác nhận mật khẩu",
    agreeTo: "Tôi đồng ý với ",
    terms: "Điều khoản dịch vụ",
    and: " và ",
    privacy: "Chính sách bảo mật",
    includingCookie: " bao gồm cả việc sử dụng cookie.",
    createAccountBtn: "Tạo tài khoản",
    processing: "Đang xử lý...",
    orJoinWith: "HOẶC",
    alreadyHaveAccount: "Đã có tài khoản?",
    loginLink: "Đăng nhập",
    passwordsDoNotMatch: "Mật khẩu xác nhận không khớp!",
    registerSuccess: "Đăng ký thành công! Đang chuyển hướng...",
    registerError: "Có lỗi xảy ra khi đăng ký.",
    connectionError: "Không thể kết nối đến server.",
    googleLoginSuccess: "Đăng nhập Google thành công!",
    googleLoginFail: "Đăng nhập Google thất bại tại Server.",
    googleCancel: "Google Đăng nhập bị hủy hoặc thất bại."
  },
  en: {
    brandName: "The Wanderer",
    heroTitle: "Join the World's Greatest Wanderlust Community",
    heroSubtitle: "Join 50k+ explorers sharing their journeys.",
    createAccount: "Create Your Account",
    startAdventure: "Start your next adventure today.",
    usernamePlaceholder: "Username",
    emailPlaceholder: "Email Address",
    passwordPlaceholder: "Password",
    confirmPasswordPlaceholder: "Confirm Password",
    agreeTo: "I agree to the ",
    terms: "Terms of Service",
    and: " and ",
    privacy: "Privacy Policy",
    includingCookie: " including cookie use.",
    createAccountBtn: "Create Account",
    processing: "Processing...",
    orJoinWith: "OR",
    alreadyHaveAccount: "Already have an account?",
    loginLink: "Log in",
    passwordsDoNotMatch: "Passwords do not match!",
    registerSuccess: "Register Successfully! Redirecting...",
    registerError: "An error occurred during registration.",
    connectionError: "Cannot connect to server.",
    googleLoginSuccess: "Google login successful!",
    googleLoginFail: "Google login failed at Server.",
    googleCancel: "Google Login cancelled or failed."
  }
};

export default function Register() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = copy[language];

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // States lưu dữ liệu form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Lấy Client ID từ biến môi trường
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  // Xử lý submit form đăng ký truyền thống
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate cơ bản ở Frontend
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: t.passwordsDoNotMatch });
      return;
    }

    setIsLoading(true);

    try {
      // GỌI API XUỐNG BACKEND (Chuyển sang dùng JSON thay vì FormData vì không có file ảnh)
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: t.registerSuccess });
        // Chuyển về trang login sau 2 giây
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || t.registerError });
      }
    } catch (error) {
      console.error("Lỗi call API:", error);
      setMessage({ type: 'error', text: t.connectionError });
    } finally {
      setIsLoading(false);
    }
  };

  // Logic Đăng ký / Đăng nhập bằng Google
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const googleToken = credentialResponse.credential;
      
      const res = await fetch('http://localhost:5000/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t.googleLoginSuccess });
        
        const userRole = data.role ? data.role.toLowerCase() : 'viewer';

        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', userRole);
        localStorage.setItem('roleRequestStatus', data.roleRequestStatus || 'none');
        if (data.avatar) localStorage.setItem('avatar', data.avatar);

        setTimeout(() => {
          if (userRole === 'admin') navigate('/admin');
          else navigate('/dashboard');
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.message || t.googleLoginFail });
      }

    } catch (error) {
      console.error("Google Login Error:", error);
      setMessage({ type: 'error', text: t.connectionError });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setMessage({ type: 'error', text: t.googleCancel });
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex min-h-screen bg-white font-sans w-full">
        {/* Cột trái - Hình nền biển */}
        <div 
          className="hidden lg:flex w-[45%] bg-cover bg-center p-12 flex-col justify-between relative"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80")' }}
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <span className="text-white text-xl font-extrabold tracking-tight">{t.brandName}</span>
          </div>
          <div className="relative z-10 text-white pb-8">
            <h1 className="text-[3rem] font-bold leading-[1.1] mb-8 tracking-tight max-w-md">
              {t.heroTitle}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-white/20 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User 1" />
                <img className="w-8 h-8 rounded-full border-2 border-white/20 object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User 2" />
                <img className="w-8 h-8 rounded-full border-2 border-white/20 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User 3" />
              </div>
              <p className="text-[13px] text-white/90 font-medium">{t.heroSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Cột phải - Form Đăng ký */}
        <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-[380px]">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-[#f44336] mb-2">{t.createAccount}</h2>
              <p className="text-gray-500 text-[13px] font-medium">{t.startAdventure}</p>
            </div>

            {/* Hiển thị thông báo Lỗi hoặc Thành công */}
            {message.text && (
              <div className={`mb-4 p-3 rounded-xl text-[13px] font-bold ${message.type === 'error' ? 'bg-red-50 text-[#f44336] border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                {message.text}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleRegister}>
              {/* Các Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User size={16} strokeWidth={2.5} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3.5 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all placeholder-gray-400 font-medium"
                    placeholder={t.usernamePlaceholder}
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} strokeWidth={2.5} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3.5 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all placeholder-gray-400 font-medium"
                    placeholder={t.emailPlaceholder}
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} strokeWidth={2.5} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3.5 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all placeholder-gray-400 font-medium"
                    placeholder={t.passwordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} strokeWidth={2.5} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3.5 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all placeholder-gray-400 font-medium"
                    placeholder={t.confirmPasswordPlaceholder}
                  />
                </div>
              </div>

              <div className="flex items-start pt-2 pb-3">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-[#f44336] focus:ring-[#f44336] border-gray-300 rounded cursor-pointer mt-0.5"
                  />
                </div>
                <div className="ml-2 text-[11px] text-gray-500 font-medium leading-tight">
                  <label htmlFor="terms" className="cursor-pointer">
                    {t.agreeTo}
                    <a href="#" className="text-[#f44336] font-bold hover:underline">{t.terms}</a>
                    {t.and}
                    <a href="#" className="text-[#f44336] font-bold hover:underline">{t.privacy}</a>
                    {t.includingCookie}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#f44336] hover:bg-[#e53935] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f44336] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} /> {t.processing}
                  </>
                ) : (
                  t.createAccountBtn
                )}
              </button>
            </form>

            <div className="mt-8 mb-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white px-4 text-gray-400">{t.orJoinWith}</span>
              </div>
            </div>

            {/* Nút đăng ký bằng Google */}
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                useOneTap
                theme="outline"
                size="large"
                text="signup_with" 
                shape="rectangular"
                width="380"
              />
            </div>

            <div className="mt-8 text-center">
              <p className="text-[13px] font-medium text-gray-600">
                {t.alreadyHaveAccount}{' '}
                <Link to="/login" className="text-[#f44336] font-bold hover:underline">
                  {t.loginLink}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}