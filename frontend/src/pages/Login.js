import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/explore');
    } catch (err) {
      setError("Đăng nhập thất bại! Vui lòng kiểm tra lại thông tin!")
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-side-image login-bg">
        <div className="auth-overlay">
          <div className="auth-badge">THE WANDERER</div>
          <h1 className="auth-hero-text">Discover & Share <br/> Amazing Places</h1>
          <p className="auth-sub-text">Join a community of global travelers and find your next hidden gem before anyone else does.</p>
          <div className="auth-copyright">© 2024 The Wanderer • Terms • Privacy</div>
        </div>
      </div>

      {/* Cột phải: Form đăng nhập */}
      <div className="auth-side-form">
        <div className="form-container">
          <h2 className="form-title">Welcome Back</h2>
          <p className="form-subtitle">Please enter your details to sign in</p>

          {/* CHỈ bao bọc các input bằng form để tránh xung đột */}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email or Username</label>
              <input 
                type="email" 
                placeholder="e.g. wanderer@travel.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            {error && <p className="error">{error}</p>}

            <div className="form-row">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <span className="forgot-link">Forgot password?</span>
            </div>

            <button type="submit" className="btn-auth-submit">Login</button>
          </form>

          {/* Các nút đăng nhập bằng MXH được đưa ra NGOÀI thẻ <form> */}
          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button type="button" className="btn-social-google">
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="G" style={{width: '20px'}} />
            Continue with Google
          </button>

          <div className="social-row">
            <button type="button" className="btn-small-social">Facebook</button>
            <button type="button" className="btn-small-social">Apple</button>
          </div>

          <div className="auth-switch">
            {/* Khi đưa vào project thật, hãy đổi thẻ <a> thành thẻ <Link to="/register"> */}
            Don't have an account? <a href="/register" style={{color: '#cf1322', fontWeight: 800, textDecoration: 'none'}}>Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;