
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { LogOut, User as UserIcon, ShieldAlert, PlusCircle, Users, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { user: currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const isActive = (path: string) => location.pathname === path ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600";

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl tracking-tight text-gray-900">AntiFake<span className="text-blue-600">News</span></span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
              <Link to="/" className={isActive('/')}>{t('home')}</Link>
              {currentUser && (currentUser.role === UserRole.MEMBER || currentUser.role === UserRole.ADMIN) && (
                <Link to="/submit" className={isActive('/submit')}>{t('submitNews')}</Link>
              )}
              {currentUser && currentUser.role === UserRole.ADMIN && (
                <Link to="/admin" className={isActive('/admin')}>{t('adminPanel')}</Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
            >
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">{language === 'en' ? 'EN' : '中文'}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition-colors group">
                  <img
                    src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}`}
                    alt="Profile"
                    className="h-8 w-8 rounded-full border border-gray-300 group-hover:border-blue-400"
                  />
                  <div className="hidden md:block text-sm text-left">
                    <p className="font-medium text-gray-700 group-hover:text-blue-600">{currentUser.firstName} {currentUser.lastName}</p>
                    <p className="text-xs text-gray-500 capitalize">{currentUser.role.toLowerCase()}</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
                  title={t('logout')}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">{t('login')}</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors">{t('register')}</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile menu (simplified) */}
      <div className="sm:hidden border-t border-gray-200 bg-gray-50 flex justify-around p-2">
        <Link to="/" className="p-2 text-gray-600"><ShieldAlert className="h-6 w-6" /></Link>
        {currentUser && (currentUser.role === UserRole.MEMBER || currentUser.role === UserRole.ADMIN) && (
          <Link to="/submit" className="p-2 text-gray-600"><PlusCircle className="h-6 w-6" /></Link>
        )}
        {currentUser && currentUser.role === UserRole.ADMIN && (
          <Link to="/admin" className="p-2 text-gray-600"><Users className="h-6 w-6" /></Link>
        )}
        {currentUser ? (
          <Link to="/profile" className="p-2 text-gray-600"><UserIcon className="h-6 w-6" /></Link>
        ) : (
          <Link to="/login" className="p-2 text-gray-600"><UserIcon className="h-6 w-6" /></Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
