import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css'; // Chúng ta sẽ viết CSS riêng

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
      localStorage.setItem('token', res.data.token); // Lưu token để dùng cho các API sau
      alert("Đăng nhập thành công!");
      navigate('/'); // Chuyển về trang chủ
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi đăng nhập");
    }
  };

  return (
    <div className="auth-container">
      {/* Bên trái: Hình ảnh và Slogan */}
      <div className="auth-left login-bg">
        <div className="overlay">
          <div className="brand">THE WANDERER</div>
          <h1>Discover & Share Amazing Places</h1>
          <p>Join a community of global travelers and find your next hidden gem before anyone else does.</p>
        </div>
      </div>

      {/* Bên phải: Form */}
      <div className="auth-right">
        <div className="auth-form">
          <h2>Welcome Back</h2>
          <p className="subtitle">Please enter your details to sign in</p>
          
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email or Username</label>
              <input 
                type="email" 
                placeholder="e.g. wanderer@travel.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <div className="form-options">
              <label><input type="checkbox" /> Remember me</label>
              <a href="#">Forgot password?</a>
            </div>

            <button type="submit" className="btn-primary">Login</button>
            
            <div className="divider"><span>OR</span></div>
            
            <button type="button" className="btn-google">Continue with Google</button>
            
            <p className="footer-text">
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;