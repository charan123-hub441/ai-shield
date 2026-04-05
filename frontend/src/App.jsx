import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import Analyzer from './pages/Analyzer';
import Chat from './pages/Chat';
import Call from './pages/Call';
import Moderation from './pages/Moderation';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Reels from './pages/Reels';
import Settings from './pages/Settings';
import Search from './pages/Search';
import FollowRequests from './pages/FollowRequests';

function AppLayout({ theme, toggleTheme }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/feed"       element={<Feed />} />
          <Route path="/reels"      element={<Reels />} />
          <Route path="/search"     element={<Search />} />
          <Route path="/analyzer"   element={<Analyzer />} />
          <Route path="/chat"       element={<Chat />} />
          <Route path="/call"       element={<Call />} />
          <Route path="/moderation" element={<Moderation />} />
          <Route path="/reports"    element={<Reports />} />
          <Route path="/profile"    element={<Profile />} />
          <Route path="/requests"   element={<FollowRequests />} />
          <Route path="/user/:userId" element={<PublicProfile />} />
          <Route path="/settings"   element={<Settings />} />
          <Route path="*"           element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ai_shield_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ai_shield_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout theme={theme} toggleTheme={toggleTheme} />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
