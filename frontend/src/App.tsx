import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserRole } from './types';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import NewsDetailPage from './pages/NewsDetailPage';
import SubmitNewsPage from './pages/SubmitNewsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import { LanguageProvider } from './contexts/LanguageContext';
import { useAuth } from './context/AuthContext';

const AppRoutes: React.FC = () => {
  const { user: currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/news/:id"
            element={<NewsDetailPage />}
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          {/* Protected Routes */}
          <Route
            path="/submit"
            element={
              currentUser && (currentUser.role === UserRole.MEMBER || currentUser.role === UserRole.ADMIN)
                ? <SubmitNewsPage />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin"
            element={
              currentUser && currentUser.role === UserRole.ADMIN
                ? <AdminPage />
                : <Navigate to="/" replace />
            }
          />
        </Routes>
      </div>
      <footer className="bg-white border-t border-gray-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; 2025 Social Anti-Fake News System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppRoutes />
    </LanguageProvider>
  );
};

export default App;