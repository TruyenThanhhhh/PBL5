import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, User, Loader2 } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');

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
        setMessage({ type: 'success', text: 'Đăng nhập thành công!' });
        
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
        setMessage({ type: 'error', text: data.message || 'Sai thông tin đăng nhập!' });
      }
    } catch (error) {
      console.error("Lỗi Network:", error);
      setMessage({ type: 'error', text: 'Lỗi Mạng: Không thể kết nối Backend.' });
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
        setMessage({ type: 'success', text: 'Đăng nhập Google thành công!' });
        
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
        setMessage({ type: 'error', text: data.message || 'Đăng nhập Google thất bại tại Server.' });
      }

    } catch (error) {
      console.error("Google Login Error:", error);
      setMessage({ type: 'error', text: 'Lỗi Mạng khi kết nối Backend.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setMessage({ type: 'error', text: 'Google Đăng nhập bị hủy hoặc thất bại.' });
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex min-h-screen bg-white font-sans w-full">
        <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-[#8a7a5e] to-[#544d3c] p-12 flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span> THE WANDERER
            </span>
          </div>
          <div className="text-white pr-8">
            <h1 className="text-[2.75rem] font-bold leading-[1.1] mb-6 tracking-tight">
              Discover & Share<br />Amazing Places
            </h1>
            <p className="text-[15px] text-white/80 max-w-sm leading-relaxed font-light">
              Join a community of global travelers and find your next hidden gem before anyone else does.
            </p>
          </div>
          <div className="text-white/50 text-[11px] flex gap-4 font-medium tracking-wide">
            <span>© 2026 The Wanderer</span>
            <span className="cursor-pointer hover:text-white transition-colors">Terms</span>
            <span className="cursor-pointer hover:text-white transition-colors">Privacy</span>
          </div>
        </div>

        <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-[380px]">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-[#f44336] mb-2">Welcome Back</h2>
              <p className="text-gray-500 text-[13px] font-medium">Please enter your details to sign in</p>
            </div>

            {message.text && (
              <div className={`mb-5 p-3.5 rounded-xl text-[13px] font-bold ${message.type === 'error' ? 'bg-red-50 text-[#f44336] border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                {message.text}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 ml-1">Email or Username</label>
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
                    placeholder="e.g. wanderer@travel.com or username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 ml-1">Password</label>
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
                    Remember me
                  </label>
                </div>
                <div className="text-[12px]">
                  <a href="#" className="font-semibold text-[#f44336] hover:text-[#d32f2f]">
                    Forgot password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#f44336] hover:bg-[#e53935] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f44336] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin mr-2" size={18} /> Logging in...</>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <div className="mt-8 mb-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white px-4 text-gray-400">OR</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-full flex justify-center overflow-hidden rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  useOneTap
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="380"
                />
              </div>
              
              <div className="flex gap-3">
                <button className="w-1/2 flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
                <button className="w-1/2 flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.365 21.444c-1.346.602-2.772.822-4.148.822-4.606 0-8.217-3.668-8.217-8.266 0-4.597 3.61-8.265 8.217-8.265 1.488 0 2.943.342 4.22.954l-1.458 2.502c-.89-.413-1.836-.62-2.762-.62-3.15 0-5.717 2.597-5.717 5.764 0 3.166 2.567 5.764 5.717 5.764.926 0 1.872-.207 2.762-.62l1.458 2.502c-.024.015-.048.028-.072.043z" />
                    <path d="M12.217 0c.348 0 .695.035 1.036.104l-.568 2.846c-.152-.032-.308-.049-.468-.049-1.944 0-3.52 1.594-3.52 3.56v.382h-3v-3.56c0-3.55 2.87-6.435 6.41-6.435l.11-.001V0z" />
                  </svg>
                  Apple
                </button>
              </div>
            </div>

            <div className="mt-8 text-center space-y-4">
              <p className="text-[13px] font-medium text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#f44336] font-bold hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}