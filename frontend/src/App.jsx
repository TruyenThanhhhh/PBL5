import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import PostUpload from './pages/PostUpload';
import PostDetail from './pages/PostDetail';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Explore from './pages/Explore';
import Community from './pages/Community';
import CommunityDetail from './pages/CommunityDetail';
import GlobalChat from './components/GlobalChat';
import { LanguageProvider } from './contexts/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route caseSensitive path="/" element={<Home />} />
          <Route caseSensitive path="/login" element={<Login />} />
          <Route caseSensitive path="/register" element={<Register />} />
          <Route caseSensitive path="/dashboard" element={<Dashboard />} />
          <Route caseSensitive path="/profile" element={<Profile />} />
          <Route caseSensitive path="/upload" element={<PostUpload />} />
          <Route caseSensitive path="/post-detail" element={<PostDetail />} />
          <Route caseSensitive path="/settings" element={<Settings />} />
          <Route caseSensitive path="/admin" element={<AdminPanel />} />
          <Route caseSensitive path="/explore" element={<Explore />} />
          <Route caseSensitive path="/community" element={<Community />} />
          <Route caseSensitive path="/community/:id" element={<CommunityDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlobalChat />
      </Router>
    </LanguageProvider>
  );
}
