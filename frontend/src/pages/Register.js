import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  // const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        return alert("Mật khẩu xác nhận không khớp!");
    }
    try {
      // await axios.post('http://localhost:5000/api/register', formData);
      alert("Đăng ký thành công! Hãy đăng nhập.");
      // navigate('/login');
    } catch (err) {
      alert("Lỗi đăng ký");
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Cột trái: Hình ảnh */}
      <div className="auth-side-image register-bg">
        <div className="auth-overlay">
          <div className="auth-badge">THE WANDERER</div>
          <h1 className="auth-hero-text">Join the World's Greatest Wanderlust Community</h1>
          <p className="auth-sub-text">Join 50k+ explorers sharing their journeys</p>
        </div>
      </div>

      {/* Cột phải: Form đăng ký */}
      <div className="auth-side-form">
        <div className="form-container">
          <h2 className="form-title">Create Your Account</h2>
          <p className="form-subtitle">Start your next adventure today.</p>
          
          <div className="upload-section">
            <div className="upload-circle">
              📷
            </div>
            <p className="upload-label">UPLOAD PHOTO</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <input name="username" type="text" placeholder="Username" onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} required />
            </div>
            
            <div className="form-row">
              <label className="checkbox-label">
                <input type="checkbox" required /> 
                <span>I agree to the <span className="forgot-link">Terms & Privacy</span></span>
              </label>
            </div>
            
            <button type="submit" className="btn-auth-submit">Create Account</button>
            
            <div className="auth-switch">
              Already have an account? <a href="/login" style={{color: '#cf1322', fontWeight: 800, textDecoration: 'none'}}>Log in</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;