import React, { useState, useEffect } from 'react';
import { User, UserRole, NewsItem, NewsStatus } from '../types';
import { Trash2, UserCheck, Shield, RotateCcw, EyeOff, Loader, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const AdminPage: React.FC = () => {
  const { t } = useLanguage();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'danger';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, newsRes] = await Promise.all([
        client.get('/users'),
        client.get('/news', { params: { pageSize: 100, includeDeleted: true } }) // Fetch more for admin, including hidden
      ]);
      setUsers(usersRes.data);
      setNewsItems(newsRes.data.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      navigate('/');
      return;
    }
    if (currentUser?.role === UserRole.ADMIN) {
      fetchData();
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handlePromoteUser = async (userId: string) => {
    try {
      await client.patch(`/users/${userId}/role`, { role: UserRole.MEMBER });
      // Optimistic update
      setUsers(users.map(u => u.id === userId ? { ...u, role: UserRole.MEMBER } : u));

      setModalConfig({
        isOpen: true,
        title: t('success'),
        message: 'User promoted successfully',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      alert('Failed to promote user');
    }
  };

  const confirmToggleNewsStatus = (newsId: string, currentStatus: boolean) => {
    const title = currentStatus ? t('confirmRestore') : t('confirmRemove');
    const message = currentStatus ? t('confirmRestoreMsg') : t('confirmRemoveMsg');

    setModalConfig({
      isOpen: true,
      title: title,
      message: message,
      type: currentStatus ? 'info' : 'danger',
      onConfirm: () => handleToggleNewsVisibility(newsId, !currentStatus)
    });
  };

  const handleToggleNewsVisibility = async (newsId: string, isDeleted: boolean) => {
    try {
      await client.patch(`/news/${newsId}/visibility`, { isDeleted });
      // Optimistic update
      setNewsItems(newsItems.map(n => n.id === newsId ? { ...n, isDeleted } : n));
      setModalConfig({ ...modalConfig, isOpen: false });
    } catch (err) {
      console.error(err);
      alert('Failed to update news visibility');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 min-h-[50vh]">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700">{error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        showCancel={true}
        confirmLabel={t('confirm')}
        onConfirm={modalConfig.onConfirm}
      />

      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
        <Shield className="w-8 h-8 mr-2 text-blue-600" />
        {t('adminDashboard')}
      </h1>

      {/* User Management */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden mb-12">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">{t('manageUsers')}</h2>
        </div>
        <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {users.map(user => (
            <li key={user.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <img className="h-10 w-10 rounded-full" src={user.avatarUrl || "https://ui-avatars.com/api/?name=" + user.firstName} alt="" />
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : (user.role === UserRole.MEMBER ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')}`}>
                  {user.role}
                </span>
                {user.role === UserRole.READER && (
                  <button onClick={() => handlePromoteUser(user.id)} className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center">
                    <UserCheck className="w-4 h-4 mr-1" /> {t('promoteToMember')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Content Management */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">{t('manageContent')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('topic')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('reporter')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('visible')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {newsItems.map(news => (
                <tr key={news.id} className={news.isDeleted ? "bg-red-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link to={`/news/${news.id}`} className="hover:underline hover:text-blue-600">
                      {news.topic.substring(0, 40)}{news.topic.length > 40 ? '...' : ''}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{news.reporter.firstName} {news.reporter.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${news.status === NewsStatus.FAKE ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {news.status === NewsStatus.FAKE ? t('fakeNews') : (news.status === NewsStatus.NOT_FAKE ? t('realNews') : t('unverified'))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {news.isDeleted ? (
                      <span className="flex items-center text-red-600 text-xs font-bold uppercase"><EyeOff className="w-3 h-3 mr-1" /> {t('hidden')}</span>
                    ) : (
                      <span className="flex items-center text-green-600 text-xs font-bold uppercase">{t('active')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {news.isDeleted ? (
                      <button onClick={() => confirmToggleNewsStatus(news.id, true)} className="text-green-600 hover:text-green-900 flex items-center ml-auto">
                        <RotateCcw className="w-4 h-4 mr-1" /> {t('restore')}
                      </button>
                    ) : (
                      <button onClick={() => confirmToggleNewsStatus(news.id, false)} className="text-red-600 hover:text-red-900 flex items-center ml-auto">
                        <Trash2 className="w-4 h-4 mr-1" /> {t('remove')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
