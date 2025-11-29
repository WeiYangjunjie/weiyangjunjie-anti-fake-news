
import React from 'react';
import { Link } from 'react-router-dom';
import { NewsItem, NewsStatus } from '../types';
import { Calendar, User, ThumbsDown, ThumbsUp, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface NewsCardProps {
  news: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const { t } = useLanguage();

  const getStatusBadge = (status: NewsStatus) => {
    switch (status) {
      case NewsStatus.FAKE:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" /> {t('fakeNews')}
          </span>
        );
      case NewsStatus.NOT_FAKE:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> {t('verifiedReal')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <HelpCircle className="w-3 h-3 mr-1" /> {t('unverified')}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="relative h-48 w-full bg-gray-200">
        <img
          src={news.imageUrl || `https://picsum.photos/800/400?random=${news.id}`}
          alt={news.topic}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          {getStatusBadge(news.status)}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center text-xs text-gray-500 mb-2 space-x-3">
          <span className="flex items-center">
            <User className="w-3 h-3 mr-1" /> {news.reporter.firstName} {news.reporter.lastName}
          </span>
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" /> {new Date(news.createdAt).toLocaleString()}
          </span>
        </div>

        <Link to={`/news/${news.id}`} className="block mt-1">
          <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 line-clamp-2">{news.topic}</h3>
        </Link>

        <p className="mt-3 text-sm text-gray-600 line-clamp-3 flex-1">
          {news.shortDetail}
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
          <div className="flex space-x-4">
            <span className="flex items-center text-green-600" title="Real Votes">
              <ThumbsUp className="w-4 h-4 mr-1" /> {news.voteCounts.notFake}
            </span>
            <span className="flex items-center text-red-600" title="Fake Votes">
              <ThumbsDown className="w-4 h-4 mr-1" /> {news.voteCounts.fake}
            </span>
          </div>
          <Link to={`/news/${news.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs uppercase tracking-wide">
            {t('readFullStory')} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
