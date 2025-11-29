import React, { useRef, useState } from 'react';
import { UserRole } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Mail, User as UserIcon, Calendar, ShieldCheck, Hash, Camera, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const ProfilePage: React.FC = () => {
  const { t } = useLanguage();
  const { user: currentUser, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl text-gray-600 mb-4">{t('loginToVote')}</h2>
        <Link to="/login" className="px-6 py-2 bg-blue-600 text-white rounded-md">{t('login')}</Link>
      </div>
    );
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-purple-100 text-purple-800 border-purple-200';
      case UserRole.MEMBER: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        // 1. Upload image
        const uploadData = new FormData();
        uploadData.append('file', file);
        const uploadRes = await client.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const avatarUrl = uploadRes.data.url;

        // 2. Update user profile
        const updateRes = await client.patch('/users/me', { avatarUrl });

        // 3. Update local state
        updateUser(updateRes.data);
      } catch (err) {
        console.error('Failed to update profile image', err);
        alert('Failed to update profile image');
      } finally {
        setUploading(false);
      }
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

        {/* Header Background */}
        <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-600 w-full relative">
          <div
            className="absolute -bottom-16 left-8 group cursor-pointer"
            onClick={triggerFileSelect}
            title={t('clickToUpload')}
          >
            <div className="relative w-32 h-32">
              <img
                src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}`}
                alt="Profile"
                className={`w-full h-full rounded-full border-4 border-white shadow-lg bg-white object-cover transition-opacity ${uploading ? 'opacity-50' : 'group-hover:opacity-90'}`}
              />

              {/* Hover Overlay */}
              <div className={`absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {uploading ? <Loader className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
              </div>

              {/* Permanent Edit Icon Badge */}
              {!uploading && (
                <div className="absolute bottom-1 right-1 bg-white text-gray-700 p-2 rounded-full shadow-md border border-gray-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Camera className="w-4 h-4" />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>
        </div>

        {/* Content */}
        <div className="pt-20 pb-8 px-8">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentUser.firstName} {currentUser.lastName}</h1>
              <p className="text-gray-500 font-medium">@{currentUser.email.split('@')[0]}</p>
            </div>
            <div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide border ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" />
              {t('accountDetails')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-4">
                <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('email')}</p>
                  <p className="font-medium text-gray-900 break-all">{currentUser.email}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-4">
                <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('role')}</p>
                  <p className="font-medium text-gray-900">{currentUser.role}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-4">
                <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('userId')}</p>
                  <p className="font-medium text-gray-900 font-mono text-sm">{currentUser.id}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-4">
                <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('memberSince')}</p>
                  <p className="font-medium text-gray-900">November 10, 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;