
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { NewsItem, NewsStatus, Comment, UserRole } from '../types';
import { ArrowLeft, User as UserIcon, Calendar, MessageSquare, ThumbsUp, ThumbsDown, Send, Upload, Trash2, AlertTriangle, X, CheckCircle, Loader } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [news, setNews] = useState<NewsItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  // New Comment/Vote Form State
  const [voteSelection, setVoteSelection] = useState<NewsStatus | ''>('');
  const [commentText, setCommentText] = useState('');
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  // User's existing vote
  const [userVote, setUserVote] = useState<NewsStatus | null>(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'danger';
    confirmLabel?: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const fetchNewsAndComments = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch News Detail
      const newsRes = await client.get(`/news/${id}`);
      setNews(newsRes.data);
      setUserVote(newsRes.data.userVote || null);

      // Fetch Comments
      const commentsRes = await client.get(`/news/${id}/comments`, {
        params: { page: currentPage, pageSize: itemsPerPage }
      });
      setComments(commentsRes.data.data);
      setTotalPages(commentsRes.data.pagination.totalPages);

    } catch (err: any) {
      console.error(err);
      setError('Failed to load news detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsAndComments();
  }, [id, currentPage, currentUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCommentImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommentImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCommentImageFile(null);
    setCommentImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setModalConfig({
        isOpen: true,
        title: 'Authentication Required',
        message: t('loginToVote'),
        type: 'info',
        confirmLabel: t('close')
      });
      return;
    }

    if (userVote) {
      setModalConfig({
        isOpen: true,
        title: t('error'),
        message: t('alreadyVotedDesc'),
        type: 'danger',
        confirmLabel: t('close')
      });
      return;
    }

    if (!voteSelection) {
      setModalConfig({
        isOpen: true,
        title: 'Missing Selection',
        message: 'Please select whether you think this news is Fake or Real.',
        type: 'danger',
        confirmLabel: 'Understood'
      });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Submit Vote
      await client.post(`/news/${id}/vote`, { vote: voteSelection });

      // 2. Submit Comment (if text or image exists)
      if (commentText.trim() || commentImageFile) {
        let imageUrl = '';
        if (commentImageFile) {
          const uploadData = new FormData();
          uploadData.append('file', commentImageFile);
          const uploadRes = await client.post('/upload', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          imageUrl = uploadRes.data.url;
        }

        await client.post(`/news/${id}/comments`, {
          content: commentText || (voteSelection === NewsStatus.FAKE ? 'Voted Fake' : 'Voted Real'), // Ensure content is not empty if image only? Schema requires content min(1).
          imageUrl: imageUrl || undefined
        });
      }

      // Refresh data
      await fetchNewsAndComments();

      // Reset form
      setCommentText('');
      setCommentImageFile(null);
      setCommentImagePreview(null);
      setVoteSelection('');

      setModalConfig({
        isOpen: true,
        title: t('success'),
        message: 'Your vote and comment have been recorded successfully.',
        type: 'success',
        confirmLabel: t('close')
      });

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to submit vote';
      setModalConfig({
        isOpen: true,
        title: t('error'),
        message: msg,
        type: 'danger',
        confirmLabel: t('close')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteComment = (commentId: string) => {
    setModalConfig({
      isOpen: true,
      title: t('deleteComment'),
      message: 'Are you sure you want to delete this comment?',
      type: 'danger',
      showCancel: true,
      confirmLabel: t('remove'),
      onConfirm: () => handleDeleteComment(commentId)
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await client.delete(`/comments/${commentId}`);
      fetchNewsAndComments(); // Refresh
      setModalConfig({ ...modalConfig, isOpen: false });
    } catch (err) {
      console.error(err);
      alert('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 min-h-[50vh]">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold text-gray-700">{error || 'News Not Found'}</h2>
        <Link to="/" className="mt-4 text-blue-600 hover:underline">{t('returnHome')}</Link>
      </div>
    );
  }

  // Soft Delete Check
  if (news.isDeleted && currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">{t('contentRemoved')}</h2>
        <p className="text-gray-600 mt-2">{t('contentRemovedDesc')}</p>
        <Link to="/" className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{t('returnHome')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmLabel={modalConfig.confirmLabel}
        onConfirm={modalConfig.onConfirm}
        showCancel={modalConfig.showCancel}
      />

      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> {t('backToNews')}
      </Link>

      {/* Admin Notice */}
      {news.isDeleted && currentUser?.role === UserRole.ADMIN && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {t('adminViewDeleted')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <article className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
        <img
          src={news.imageUrl || `https://picsum.photos/800/400?random=${news.id}`}
          alt={news.topic}
          className="w-full h-80 object-cover"
        />
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${news.status === NewsStatus.FAKE ? 'bg-red-100 text-red-700' : (news.status === NewsStatus.NOT_FAKE ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}`}>
              {news.status === NewsStatus.FAKE ? t('fakeNews') : (news.status === NewsStatus.NOT_FAKE ? t('verifiedReal') : t('unverified'))}
            </span>
            <span className="text-gray-400 text-sm flex items-center">
              <Calendar className="w-4 h-4 mr-1" /> {new Date(news.createdAt).toLocaleString()}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{news.topic}</h1>

          <div className="flex items-center gap-2 mb-6 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg w-fit">
            <span className="font-semibold">{t('reporter')}:</span>
            <UserIcon className="w-4 h-4" />
            <span>{news.reporter.firstName} {news.reporter.lastName}</span>
          </div>

          <div className="prose prose-blue max-w-none text-gray-700">
            <p className="font-medium text-lg leading-relaxed mb-4">{news.shortDetail}</p>
            <p className="leading-relaxed whitespace-pre-line">{news.fullDetail}</p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            <div className="flex gap-8">
              <div className="text-center">
                <div className="flex items-center gap-2 text-2xl font-bold text-green-600">
                  <ThumbsUp className="w-6 h-6" /> {news.voteCounts.notFake}
                </div>
                <span className="text-xs text-gray-500 uppercase">{t('realNews')}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 text-2xl font-bold text-red-600">
                  <ThumbsDown className="w-6 h-6" /> {news.voteCounts.fake}
                </div>
                <span className="text-xs text-gray-500 uppercase">{t('fakeNews')}</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Voting Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          {t('castVote')}
        </h3>

        {currentUser ? (
          userVote ? (
            <div className="bg-blue-50 p-8 rounded-lg border border-blue-200 text-center flex flex-col items-center">
              <CheckCircle className="w-12 h-12 text-blue-600 mb-3" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('alreadyVoted')}</h3>
              <p className="text-gray-600 mb-4">{t('alreadyVotedDesc')}</p>
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full border border-blue-100 shadow-sm">
                <span className="text-sm font-semibold text-gray-600">{t('yourVote')}:</span>
                <span className={`font-bold ${userVote === NewsStatus.FAKE ? 'text-red-600' : 'text-green-600'}`}>
                  {userVote === NewsStatus.FAKE ? t('fakeNews') : t('realNews')}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitVote}>
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setVoteSelection(NewsStatus.NOT_FAKE)}
                  className={`flex-1 py-4 rounded-lg border-2 flex items-center justify-center gap-2 font-bold text-lg transition-all ${voteSelection === NewsStatus.NOT_FAKE ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200' : 'border-gray-200 hover:border-green-300 text-gray-600'}`}
                >
                  <ThumbsUp className={`w-6 h-6 ${voteSelection === NewsStatus.NOT_FAKE ? 'fill-current' : ''}`} /> {t('itsReal')}
                </button>
                <button
                  type="button"
                  onClick={() => setVoteSelection(NewsStatus.FAKE)}
                  className={`flex-1 py-4 rounded-lg border-2 flex items-center justify-center gap-2 font-bold text-lg transition-all ${voteSelection === NewsStatus.FAKE ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200' : 'border-gray-200 hover:border-red-300 text-gray-600'}`}
                >
                  <ThumbsDown className={`w-6 h-6 ${voteSelection === NewsStatus.FAKE ? 'fill-current' : ''}`} /> {t('itsFake')}
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('reasoning')}</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('reasoningPlaceholder')}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('evidenceImage')}</label>
                {!commentImagePreview ? (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">{t('clickToUpload')}</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                    <img src={commentImagePreview} alt="Evidence Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      title="Remove Image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {t('submitVote')}
              </button>
            </form>
          )
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">{t('loginToVote')}</p>
            <div className="flex justify-center gap-4">
              <Link to="/login" className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">{t('login')}</Link>
              <Link to="/register" className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50">{t('register')}</Link>
            </div>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">{t('communityDiscussion')} ({news._count.comments})</h3>

        {comments.length > 0 ? comments.map(comment => (
          <div key={comment.id} className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex gap-4">
            <img src={comment.user?.avatarUrl || "https://ui-avatars.com/api/?name=User"} className="w-10 h-10 rounded-full border border-gray-200 flex-shrink-0" alt="User" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-gray-900 block">{comment.user?.firstName} {comment.user?.lastName}</span>
                  <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Note: Comments don't have votes directly associated in the schema response for list, 
                         but we might want to show if this user voted? 
                         The current Comment type doesn't have 'vote'. 
                         If we want to show "Voted Fake", we need to fetch that or infer it.
                         For now, let's remove the "Voted: Fake/Real" badge from comment unless we have that info.
                         The backend Comment model doesn't link to Vote directly.
                     */}

                  {/* Admin Delete Comment Button */}
                  {currentUser && currentUser.role === UserRole.ADMIN && (
                    <button
                      onClick={() => confirmDeleteComment(comment.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                      title={t('deleteComment')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {comment.content && <p className="mt-2 text-gray-700 text-sm leading-relaxed">{comment.content}</p>}
              {comment.imageUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Evidence:</p>
                  <img src={comment.imageUrl} alt="Evidence" className="max-h-48 rounded border border-gray-200 object-contain" />
                </div>
              )}
            </div>
          </div>
        )) : (
          <p className="text-gray-500 italic">No comments yet.</p>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default NewsDetailPage;
