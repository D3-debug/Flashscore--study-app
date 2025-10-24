
"use client";

import React, { useState, useEffect } from 'react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  publishDate: string;
  tags: string[];
  source: string;
}

export function LatestNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/news/latest');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }
        
        const data = await response.json();
        
        // Handle both array and object responses safely
        let newsArray: NewsItem[] = [];
        if (Array.isArray(data)) {
          newsArray = data;
        } else if (data && typeof data === 'object') {
          newsArray = data.news || data.data || [];
        }
        
        setNews(Array.isArray(newsArray) ? newsArray : []);
      } catch (err: any) {
        console.error("Failed to fetch latest news:", err);
        setError(err.message);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, [mounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <section className="p-6 bg-white rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4">📰 Latest News</h2>
        <p>Loading...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-6 bg-white rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4">📰 Latest News</h2>
        <p className="text-red-500">Error loading news: {error}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="p-6 bg-white rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4">📰 Latest News</h2>
        <p>Loading news...</p>
      </section>
    );
  }

  return (
    <section className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">📰 Latest News</h2>
      {!Array.isArray(news) || news.length === 0 ? (
        <p>No news available.</p>
      ) : (
        news.map((item) => (
          <div key={item.id} className="border-b py-3">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-gray-700">
              {expanded === item.id ? item.content : item.summary}
            </p>
            <button
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              className="text-blue-500 underline mt-2"
            >
              {expanded === item.id ? 'Show Less' : 'Read More'}
            </button>
            <p className="text-sm text-gray-500 mt-1">
              By {item.author} | {new Date(item.publishDate).toLocaleDateString()}
            </p>
          </div>
        ))
      )}
    </section>
  );
}

export default LatestNews;
