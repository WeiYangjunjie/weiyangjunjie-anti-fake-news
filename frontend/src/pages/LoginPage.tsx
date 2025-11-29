
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Lock, Mail, AlertCircle, Code } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dev Access State
  const [devRole, setDevRole] = useState<'READER' | 'MEMBER' | 'ADMIN'>('READER');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await client.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    let devEmail = '';
    const devPassword = 'password123';

    switch (devRole) {
      case 'ADMIN': devEmail = 'admin@example.com'; break;
      case 'MEMBER': devEmail = 'member@example.com'; break;
      case 'READER': devEmail = 'reader@example.com'; break;
    }

    setEmail(devEmail);
    setPassword(devPassword);

    // Auto submit
    try {
      setLoading(true);
      const response = await client.post('/auth/login', { email: devEmail, password: devPassword });
      const { token, user } = response.data;
      login(token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Dev login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('signInTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">register a new account</Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : t('loginButton')}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
            <Code className="w-4 h-4 mr-1" /> {t('devAccess')}
          </h3>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-xs text-gray-500 mb-3">{t('devAccessDesc')}</p>
            <div className="flex gap-2">
              <select
                value={devRole}
                onChange={(e) => setDevRole(e.target.value as any)}
                className="block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="READER">Reader (Jane)</option>
                <option value="MEMBER">Member (John)</option>
                <option value="ADMIN">Admin (Super)</option>
              </select>
              <button
                onClick={handleDevLogin}
                disabled={loading}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium rounded-md transition-colors"
              >
                Go
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
