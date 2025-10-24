"use client";
import { useEffect, useState } from "react";

interface NewsItem {
  id: string;
  title: string;
  preview: string;
  fullContent: string;
  publishedAt: string;
}

export function LatestNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Added loading state

  useEffect(() => {
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
        // Handle both array and object responses
        const newsArray = Array.isArray(data) ? data : (data.news || data.data || []);
        setNews(newsArray);
      } catch (err: any) {
        console.error("Failed to fetch latest news:", err);
        setError(err.message);
        setNews([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (error) {
    return <section className="p-6 bg-white rounded-xl shadow"><h2 className="text-2xl font-bold mb-4">📰 Latest News</h2><p className="text-red-500">Error loading news: {error}</p></section>;
  }

  if (loading) {
    return <section className="p-6 bg-white rounded-xl shadow"><h2 className="text-2xl font-bold mb-4">📰 Latest News</h2><p>Loading news...</p></section>;
  }

  return (
    <section className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">📰 Latest News</h2>
      {news.length === 0 ? (
        <p>No news available.</p>
      ) : (
        Array.isArray(news) && news.map((item) => (
          <div key={item.id} className="border-b py-3">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-gray-700">
              {expanded === item.id ? item.fullContent : item.preview}
            </p>
            <button
              onClick={() =>
                setExpanded(expanded === item.id ? null : item.id)
              }
              className="text-blue-600 text-sm"
            >
              {expanded === item.id ? "Show Less" : "Read More"}
            </button>
          </div>
        ))
      )}
      <a
        href="/reader"
        className="block mt-4 text-center text-blue-700 font-medium"
      >
        📚 Read Older Stories
      </a>
    </section>
  );
}