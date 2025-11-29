
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertCircle, X, Upload } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import client from '../api/client';
import Modal from '../components/Modal';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
  });

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const validateField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) error = t('required');
        break;
      case 'email':
        if (!value.trim()) error = t('required');
        else if (!/\S+@\S+\.\S+/.test(value)) error = t('invalidEmail');
        break;
      case 'password':
        if (!value) error = t('required');
        else if (value.length < 6) error = t('passwordShort');
        break;
      case 'confirmPassword':
        if (value !== formData.password) error = t('passwordMismatch');
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time validation
    setErrors({ ...errors, [name]: validateField(name, value), general: '' });

    if (name === 'password' && formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: value !== formData.confirmPassword ? t('passwordMismatch') : '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
      general: ''
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = '';
      if (profileImageFile) {
        const uploadData = new FormData();
        uploadData.append('file', profileImageFile);
        const uploadRes = await client.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        avatarUrl = uploadRes.data.url;
      }

      await client.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        avatarUrl: avatarUrl || undefined
      });

      setModalOpen(true);
    } catch (err: any) {
      setErrors(prev => ({ ...prev, general: err.response?.data?.error || 'Registration failed' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); navigate('/login'); }}
        title={t('success')}
        message={t('authSuccess')}
        type="success"
        confirmLabel={t('login')}
        onConfirm={() => navigate('/login')}
      />

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">{t('createAccount')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('joinCommunity')}</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          {errors.general && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center mb-4">
              <AlertCircle className="w-4 h-4 mr-2" />
              {errors.general}
            </div>
          )}

          <div className="flex flex-col items-center justify-center mb-6">
            <div
              className="relative group cursor-pointer"
              onClick={triggerFileSelect}
              title={t('uploadProfile')}
            >
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-400 group-hover:border-blue-500 transition-colors">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Profile Preview" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-gray-400 group-hover:text-blue-500" />
                )}
              </div>

              <div className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-sm hover:bg-blue-700 transition-colors">
                <Camera className="h-4 w-4" />
              </div>

              {profileImagePreview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileImageFile(null);
                    setProfileImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 z-10"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={triggerFileSelect}
              className="mt-3 flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <Upload className="w-4 h-4 mr-1" />
              {t('clickToUpload')}
            </button>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('firstName')}</label>
              <input
                name="firstName"
                type="text"
                className={`mt-1 block w-full border ${errors.firstName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                onChange={handleChange}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('lastName')}</label>
              <input
                name="lastName"
                type="text"
                className={`mt-1 block w-full border ${errors.lastName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                onChange={handleChange}
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('email')}</label>
            <input
              name="email"
              type="email"
              className={`mt-1 block w-full border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              onChange={handleChange}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('password')}</label>
            <input
              name="password"
              type="password"
              className={`mt-1 block w-full border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              onChange={handleChange}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('confirmPassword')}</label>
            <input
              name="confirmPassword"
              type="password"
              className={`mt-1 block w-full border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              onChange={handleChange}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.confirmPassword}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50">
            {loading ? 'Creating Account...' : t('registerButton')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
