import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, User, Loader2 } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useLanguage } from '../contexts/LanguageContext';

const copy = {
  vi: {
    brandName: "THE WANDERER",
    heroTitle: "Khám phá & Chia sẻ những địa điểm tuyệt vời",
    heroSubtitle: "Tham gia cộng đồng khách du lịch toàn cầu và tìm kiếm điểm đến ít người biết trước bất kỳ ai.",
    copyright: "© 2026 The Wanderer",
    welcomeBack: "Chào mừng quay trở lại",
    signInDetails: "Vui lòng điền thông tin để đăng nhập",
    emailOrUsername: "Email hoặc Tên đăng nhập",
    emailOrUsernamePlaceholder: "Ví dụ: wanderer@travel.com hoặc username",
    password: "Mật khẩu",
    rememberMe: "Ghi nhớ đăng nhập",
    loginBtn: "Đăng nhập",
    loggingIn: "Đang đăng nhập...",
    or: "HOẶC",
    dontHaveAccount: "Chưa có tài khoản?",
    signUpLink: "Đăng ký",
    loginSuccess: "Đăng nhập thành công!",
    loginError: "Sai thông tin đăng nhập!",
    networkError: "Lỗi Mạng: Không thể kết nối Backend.",
    googleLoginSuccess: "Đăng nhập Google thành công!",
    googleLoginFail: "Đăng nhập Google thất bại tại Server.",
    googleCancel: "Google Đăng nhập bị hủy hoặc thất bại."
  },
  en: {
    brandName: "THE WANDERER",
    heroTitle: "Discover & Share Amazing Places",
    heroSubtitle: "Join a community of global travelers and find your next hidden gem before anyone else does.",
    copyright: "© 2026 The Wanderer",
    welcomeBack: "Welcome Back",
    signInDetails: "Please enter your details to sign in",
    emailOrUsername: "Email or Username",
    emailOrUsernamePlaceholder: "e.g. wanderer@travel.com or username",
    password: "Password",
    rememberMe: "Remember me",
    loginBtn: "Login",
    loggingIn: "Logging in...",
    or: "OR",
    dontHaveAccount: "Don't have an account?",
    signUpLink: "Sign up",
    loginSuccess: "Login successful!",
    loginError: "Wrong login details!",
    networkError: "Network Error: Cannot connect to Backend.",
    googleLoginSuccess: "Google login successful!",
    googleLoginFail: "Google login failed at Server.",
    googleCancel: "Google Login cancelled or failed."
  }
};

export default function Login() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = copy[language];

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  
  // Kháng nghị tài khoản bị khóa
  const [banInfo, setBanInfo] = useState(null); 
  const [appealReason, setAppealReason] = useState('');
  const [appealStatus, setAppealStatus] = useState('idle'); 
  const [appealMsg, setAppealMsg] = useState('');

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealReason.trim()) return;

    setAppealStatus('submitting');
    setAppealMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/users/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: banInfo.email,
          appealReason: appealReason.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAppealStatus('success');
        setAppealMsg(data.message);
      } else {
        setAppealStatus('error');
        setAppealMsg(data.message || 'Lỗi hệ thống khi gửi kháng nghị.');
      }
    } catch (err) {
      setAppealStatus('error');
      setAppealMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
  };

  // Lấy Client ID từ biến môi trường
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: t.loginSuccess });
        
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
        if (response.status === 403 && data.isBanned) {
          setBanInfo({ email: data.email || identifier, message: data.message });
        } else {
          setMessage({ type: 'error', text: data.message || t.loginError });
        }
      }
    } catch (error) {
      console.error("Lỗi Network:", error);
      setMessage({ type: 'error', text: t.networkError });
    } finally {
      setIsLoading(false);
    }
  };

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
        if (res.status === 403 && data.isBanned) {
          setBanInfo({ email: data.email, message: data.message });
        } else {
          setMessage({ type: 'error', text: data.message || t.googleLoginFail });
        }
      }

    } catch (error) {
      console.error("Google Login Error:", error);
      setMessage({ type: 'error', text: t.networkError });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setMessage({ type: 'error', text: t.googleCancel });
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {banInfo ? (
        <div className="flex min-h-screen bg-slate-50 font-sans items-center justify-center p-4 w-full">
          <div className="w-full max-w-[500px] bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 relative">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Lock size={32} className="text-[#f44336]" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Tài khoản của bạn đã bị khóa</h2>
              <p className="text-gray-500 text-[13px] font-medium leading-relaxed px-4">
                {banInfo.message || "Tài khoản của bạn tạm thời đã bị đình chỉ do vi phạm các tiêu chuẩn cộng đồng của chúng tôi."}
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-4 mb-6 border border-gray-100 text-[13px] text-gray-700 font-medium">
              <p className="font-bold text-gray-900 mb-1 text-[11px] text-gray-400 uppercase tracking-wider">Tài khoản</p>
              <p className="font-bold text-slate-800 break-all">{banInfo.email}</p>
            </div>

            {appealStatus === 'success' ? (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center mb-6">
                <h3 className="text-green-800 font-bold text-[14px] mb-2">Đã gửi kháng nghị thành công</h3>
                <p className="text-green-700 text-[12px] leading-relaxed">
                  {appealMsg || "Yêu cầu kháng nghị của bạn đã được tiếp nhận. Chúng tôi sẽ tiến hành xem xét và thông báo qua email của bạn trong thời gian sớm nhất."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleAppealSubmit} className="space-y-4 mb-6">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Đơn kháng nghị / Lý do muốn khôi phục
                  </label>
                  <textarea
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    required
                    placeholder="Hãy giải thích rõ lý do hoặc cung cấp thêm thông tin giúp ban quản trị xem xét khôi phục tài khoản cho bạn..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 focus:border-[#f44336] resize-none h-36 transition-all"
                  />
                </div>

                {appealStatus === 'error' && (
                  <p className="text-red-500 text-[12px] font-bold ml-1 mb-2">
                    {appealMsg || "Lỗi khi gửi kháng nghị. Vui lòng thử lại sau."}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={appealStatus === 'submitting'}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-[#f44336] hover:bg-[#e53935] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f44336] transition-all disabled:opacity-75"
                >
                  {appealStatus === 'submitting' ? (
                    <><Loader2 className="animate-spin mr-2" size={18} /> Đang gửi...</>
                  ) : (
                    "Gửi đơn kháng nghị"
                  )}
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setBanInfo(null);
                  setAppealReason('');
                  setAppealStatus('idle');
                  setAppealMsg('');
                }}
                className="text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
              >
                Quay lại Đăng nhập
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen bg-white font-sans w-full">
        <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-[#8a7a5e] to-[#544d3c] p-12 flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span> {t.brandName}
            </span>
          </div>
          <div className="text-white pr-8">
            <h1 className="text-[2.75rem] font-bold leading-[1.1] mb-6 tracking-tight">
              {t.heroTitle}
            </h1>
            <p className="text-[15px] text-white/80 max-w-sm leading-relaxed font-light">
              {t.heroSubtitle}
            </p>
          </div>
          <div className="text-white/50 text-[11px] flex gap-4 font-medium tracking-wide">
            <span>{t.copyright}</span>
            <span className="cursor-pointer hover:text-white transition-colors">{t.terms}</span>
            <span className="cursor-pointer hover:text-white transition-colors">{t.privacy}</span>
          </div>
        </div>

        <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-[380px]">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-[#f44336] mb-2">{t.welcomeBack}</h2>
              <p className="text-gray-500 text-[13px] font-medium">{t.signInDetails}</p>
            </div>

            {message.text && (
              <div className={`mb-5 p-3.5 rounded-xl text-[13px] font-bold ${message.type === 'error' ? 'bg-red-50 text-[#f44336] border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                {message.text}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 ml-1">{t.emailOrUsername}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User size={16} strokeWidth={2.5} />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3.5 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all placeholder-gray-400 font-medium"
                    placeholder={t.emailOrUsernamePlaceholder}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 ml-1">{t.password}</label>
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
                    placeholder="••••••••"
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

              <div className="flex items-center justify-between pt-1 pb-4">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#f44336] focus:ring-[#f44336] border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-[12px] text-gray-600 font-medium cursor-pointer">
                    {t.rememberMe}
                  </label>
                </div>
                <div className="text-[12px]">
                  <a href="#" className="font-semibold text-[#f44336] hover:text-[#d32f2f]">
                    {t.forgotPassword}
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#f44336] hover:bg-[#e53935] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f44336] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin mr-2" size={18} /> {t.loggingIn}</>
                ) : (
                  t.loginBtn
                )}
              </button>
            </form>

            <div className="mt-8 mb-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white px-4 text-gray-400">{t.or}</span>
              </div>
            </div>

            <div className="w-full flex justify-center">
              {/* Đã sửa text="continue_with" thành text="signin_with" để hiển thị "Đăng nhập bằng Google" */}
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                useOneTap
                theme="outline"
                size="large"
                text="signin_with" 
                shape="rectangular"
                width="380"
              />
            </div>

            <div className="mt-8 text-center space-y-4">
              <p className="text-[13px] font-medium text-gray-600">
                {t.dontHaveAccount}{' '}
                <Link to="/register" className="text-[#f44336] font-bold hover:underline">
                  {t.signUpLink}
                </Link>
              </p>
            </div>
          </div>
        </div>
        </div>
      )}
    </GoogleOAuthProvider>
  );
}