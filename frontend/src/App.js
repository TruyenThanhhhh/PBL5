import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Trang chủ hiển thị Feed bài đăng */}
        <Route path="/" element={<Home />} />
        
        {/* Trang đăng nhập */}
        <Route path="/login" element={<Login />} />
        
        {/* Trang đăng ký */}
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;