import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Camera, Plus, Loader2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // States lưu dữ liệu form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // States cho Upload ảnh
  const [avatarPreview, setAvatarPreview] = useState(null); // Để hiển thị lên UI
  const [avatarFile, setAvatarFile] = useState(null);       // Để gửi file thật lên Backend

  // Xử lý khi chọn ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Xử lý submit form đăng ký
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate cơ bản ở Frontend
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }

    setIsLoading(true);

    try {
      // TẠO FORMDATA ĐỂ GỬI LÊN BACKEND (Vì có upload file ảnh)
      // Lưu ý: Các key ('username', 'email', 'avatar') phải khớp với backend của bạn
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      if (avatarFile) {
        formData.append('avatar', avatarFile); 
      }

      // GỌI API XUỐNG BACKEND
      // TODO: Đổi 'http://localhost:5000/api/users/register' thành đường dẫn API thật của bạn
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        body: formData, 
        // Không set 'Content-Type': 'application/json' vì đang gửi FormData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Đăng ký thành công! Đang chuyển hướng...' });
        // Chuyển về trang login sau 2 giây
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Có lỗi xảy ra khi đăng ký.' });
      }
    } catch (error) {
      console.error("Lỗi call API:", error);
      setMessage({ type: 'error', text: 'Không thể kết nối đến server.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans w-full">
      {/* Cột trái - Hình nền biển */}
      <div 
        className="hidden lg:flex w-[45%] bg-cover bg-center p-12 flex-col justify-between relative"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80")' }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <span className="text-white text-xl font-extrabold tracking-tight">The Wanderer</span>
        </div>
        <div className="relative z-10 text-white pb-8">
          <h1 className="text-[3rem] font-bold leading-[1.1] mb-8 tracking-tight max-w-md">
            Join the World's<br />Greatest<br />Wanderlust<br />Community
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <img className="w-8 h-8 rounded-full border-2 border-white/20 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User 1" />
              <img className="w-8 h-8 rounded-full border-2 border-white/20 object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User 2" />
              <img className="w-8 h-8 rounded-full border-2 border-white/20 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User 3" />
            </div>
            <p className="text-[13px] text-white/90 font-medium">Join 50k+ explorers sharing their journeys.</p>
          </div>
        </div>
      </div>

      {/* Cột phải - Form Đăng ký */}
      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-[#f44336] mb-2">Create Your Account</h2>
            <p className="text-gray-500 text-[13px] font-medium">Start your next adventure today.</p>
          </div>

          {/* Hiển thị thông báo Lỗi hoặc Thành công */}
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-[13px] font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message.text}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Upload Ảnh đại diện */}
            <div className="flex flex-col items-center mb-6">
              <label className="relative cursor-pointer group">
                <div className="w-20 h-20 bg-[#f4f4f5] rounded-full flex items-center justify-center text-gray-400 overflow-hidden group-hover:bg-gray-200 transition-colors">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={26} strokeWidth={2} />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#f44336] rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                  <Plus size={14} strokeWidth={3} />
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
              <span className="text-[10px] font-bold tracking-widest text-gray-500 mt-3 uppercase">Upload Photo</span>
            </div>

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
                  className="block w-full pl-10 pr-3 py-3 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all placeholder-gray-400 font-medium"
                  placeholder="Username"
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
                  className="block w-full pl-10 pr-3 py-3 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all placeholder-gray-400 font-medium"
                  placeholder="Email Address"
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
                  className="block w-full pl-10 pr-10 py-3 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all placeholder-gray-400 font-medium"
                  placeholder="Password"
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
                  className="block w-full pl-10 pr-10 py-3 bg-[#f4f4f5] border-transparent rounded-xl text-sm focus:ring-2 focus:ring-[#f44336]/20 focus:bg-white focus:border-[#f44336] transition-all placeholder-gray-400 font-medium"
                  placeholder="Confirm Password"
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
                  I agree to the <a href="#" className="text-[#f44336] font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-[#f44336] font-bold hover:underline">Privacy Policy</a> including cookie use.
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
                  <Loader2 className="animate-spin mr-2" size={18} /> Processing...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-7 mb-5 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-white px-4 text-gray-400">OR JOIN WITH</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" className="w-1/2 flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button type="button" className="w-1/2 flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[13px] font-medium text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#f44336] font-bold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}