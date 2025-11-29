
import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const SubmitNewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [topic, setTopic] = useState('');
  const [shortDetail, setShortDetail] = useState('');
  const [fullDetail, setFullDetail] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError(t('loginToVote')); // Reuse message or add new one
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = '';
      if (coverImageFile) {
        const uploadData = new FormData();
        uploadData.append('file', coverImageFile);
        const uploadRes = await client.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      await client.post('/news', {
        topic,
        shortDetail,
        fullDetail,
        imageUrl: imageUrl || undefined
      });

      setModalOpen(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit news');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold text-gray-700">Authentication Required</h2>
        <p className="text-gray-600 mt-2">Please login to submit news.</p>
        <button onClick={() => navigate('/login')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          {t('login')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={t('submissionSuccess')}
        message={t('submissionSuccessMsg')}
        type="success"
        confirmLabel={t('returnHome')}
        onConfirm={handleCloseModal}
      />

      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('submitStoryTitle')}</h1>
        <p className="text-gray-600 mt-1">{t('submitStoryDesc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsTopic')}</label>
          <input
            type="text"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Aliens land in Times Square"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('shortSummary')}</label>
          <input
            type="text"
            required
            maxLength={150}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="A brief overview of the event (150 chars max)"
            value={shortDetail}
            onChange={(e) => setShortDetail(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">{shortDetail.length}/150</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fullDetails')}</label>
          <textarea
            required
            rows={8}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Provide all the details, context, and sources..."
            value={fullDetail}
            onChange={(e) => setFullDetail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('coverImage')}</label>
          {!coverImagePreview ? (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="cover-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>{t('clickToUpload')}</span>
                    <input
                      id="cover-upload"
                      name="cover-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          ) : (
            <div className="relative mt-2 w-full h-64 rounded-md overflow-hidden border border-gray-300">
              <img src={coverImagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="pt-4">
          <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><FileText className="w-5 h-5 mr-2" /> {t('publishNews')}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitNewsPage;
