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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        return alert("Mật khẩu xác nhận không khớp!");
    }
    try {
      await axios.post('http://localhost:5000/api/register', formData);
      alert("Đăng ký thành công! Hãy đăng nhập.");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi đăng ký");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left register-bg">
        <div className="overlay">
          <div className="brand">THE WANDERER</div>
          <h1>Join the World's Greatest Wanderlust Community</h1>
          <div className="avatars-group" style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px'}}>
             <small>Join 50k+ explorers sharing their journeys</small>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form">
          <h2 style={{color: '#ff4d4d', fontSize: '28px', marginBottom: '10px'}}>Create Your Account</h2>
          <p className="subtitle">Start your next adventure today.</p>
          
          <div className="upload-section" style={{textAlign: 'center', margin: '20px 0'}}>
            <div className="upload-circle" style={{width: '60px', height: '60px', background: '#eee', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyCenter: 'center', cursor: 'pointer'}}>
              📷
            </div>
            <p style={{fontSize: '12px', marginTop: '5px', fontWeight: 'bold'}}>UPLOAD PHOTO</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="input-group">
              <input name="username" type="text" placeholder="Username" onChange={handleChange} required />
            </div>
            <div className="input-group">
              <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
            </div>
            <div className="input-group">
              <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
            </div>
            <div className="input-group">
              <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} required />
            </div>
            <div className="terms-check" style={{fontSize: '12px', marginBottom: '20px'}}>
              <input type="checkbox" required /> <span>I agree to the Terms & Privacy</span>
            </div>
            <button type="submit" className="btn-primary">Create Account</button>
            <p className="footer-text">Already have an account? <Link to="/login">Log in</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;