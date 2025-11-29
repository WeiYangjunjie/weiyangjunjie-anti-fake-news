
import React, { useState, useEffect } from 'react';
import { NewsItem, NewsStatus } from '../types';
import NewsCard from '../components/NewsCard';
import Pagination from '../components/Pagination';
import { Search, Filter, Loader } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import client from '../api/client';

const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, FAKE, NOT_FAKE

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const params: any = {
          page: currentPage,
          pageSize: itemsPerPage,
        };

        if (statusFilter !== 'ALL') {
          params.status = statusFilter;
        }

        if (searchQuery) {
          params.q = searchQuery;
        }

        const response = await client.get('/news', { params });
        setNewsItems(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setError('Failed to load news');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchNews();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentPage, itemsPerPage, statusFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900">{t('latestNews')}</h1>
        <p className="mt-2 text-gray-600">{t('exploreNews')}</p>
      </div>

      {/* Controls Section: Search, Filter, Items Per Page */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">

        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto items-center">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="ALL">{t('allNews')}</option>
              <option value={NewsStatus.FAKE}>{t('fakeNews')}</option>
              <option value={NewsStatus.NOT_FAKE}>{t('realNews')}</option>
              <option value={NewsStatus.UNKNOWN}>{t('unverified')}</option>
            </select>
          </div>

          {/* Items Per Page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">{t('itemsPerPage')}</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="block w-full pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
            </select>
          </div>
        </div>
      </div>

      {/* News Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-600">
          {error}
        </div>
      ) : newsItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsItems.map(news => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">{t('noNewsFound')}</p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            {t('clearFilters')}
          </button>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default HomePage;
