import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import GlobalChatNotification from './components/GlobalChatNotification';

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
import Friends from './pages/Friends';
import Trending from './pages/Trending';
import Saved from './pages/Saved';
import SearchResults from './pages/SearchResults';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route caseSensitive path="/" element={<Home />} />
          <Route caseSensitive path="/login" element={<Login />} />
          <Route caseSensitive path="/register" element={<Register />} />
          <Route caseSensitive path="/admin" element={<AdminPanel />} />
          <Route caseSensitive path="/dashboard" element={<Dashboard />} />
          <Route caseSensitive path="/profile" element={<Profile />} />
          <Route caseSensitive path="/upload" element={<PostUpload />} />
          <Route caseSensitive path="/post-detail" element={<PostDetail />} />
          <Route caseSensitive path="/settings" element={<Settings />} />
          <Route path="/explore" caseSensitive element={<Explore />} />
          <Route path="/community/:id" caseSensitive element={<CommunityDetail />} />
          <Route path="/community" caseSensitive element={<Community />} />
          <Route path="/friends" caseSensitive element={<Friends />} />
          <Route path="/trending" caseSensitive element={<Trending />} />
          <Route path="/saved" caseSensitive element={<Saved />} />
          <Route path="/search" caseSensitive element={<SearchResults />} />
          
          {/* Nếu gõ sai link, tự động về Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlobalChatNotification />
      </Router>
    </ThemeProvider>
  );
}