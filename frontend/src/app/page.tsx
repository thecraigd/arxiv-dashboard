'use client';

import { useEffect, useState } from 'react';
import DashboardMetrics from '../components/DashboardMetrics';
import CategoryChart from '../components/CategoryChart';
import KeywordCloud from '../components/KeywordCloud';
import PaperList from '../components/PaperList';
import TrendChart from '../components/TrendChart';
import KeywordTrends from '../components/KeywordTrends';
import SafetyKeywordTrends from '../components/SafetyKeywordTrends';
import { loadData } from './data';
import { Paper, CountsData, KeywordData, Metadata, SafetyTrends, MonthlyKeywords } from './types';

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [safetyPapers, setSafetyPapers] = useState<Paper[]>([]);
  const [counts, setCounts] = useState<CountsData>({ daily: {}, weekly: {}, monthly: {} });
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [historicalPapers, setHistoricalPapers] = useState<Paper[]>([]);
  const [historicalSafetyPapers, setHistoricalSafetyPapers] = useState<Paper[]>([]);
  const [monthlyKeywords, setMonthlyKeywords] = useState<MonthlyKeywords>({});
  const [safetyTrends, setSafetyTrends] = useState<SafetyTrends>({ monthly_counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering state
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedKeyword, setSelectedKeyword] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'all' | 'safety'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await loadData();
        setPapers(data.papers);
        setSafetyPapers(data.safetyPapers);
        setCounts(data.counts);
        setKeywords(data.keywords);
        setMetadata(data.metadata);
        
        // Set historical data if available
        if (data.historicalPapers) setHistoricalPapers(data.historicalPapers);
        if (data.historicalSafetyPapers) setHistoricalSafetyPapers(data.historicalSafetyPapers);
        if (data.monthlyKeywords) setMonthlyKeywords(data.monthlyKeywords);
        if (data.safetyTrends) setSafetyTrends(data.safetyTrends);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle category selection
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(prev => prev === category ? undefined : category);
    setSelectedKeyword(undefined);
  };

  // Handle keyword selection
  const handleKeywordClick = (keyword: string) => {
    setSelectedKeyword(prev => prev === keyword ? undefined : keyword);
    setSelectedCategory(undefined);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory(undefined);
    setSelectedKeyword(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-700">Loading Dashboard...</p>
          <p className="text-gray-500 mt-2">Fetching the latest arXiv data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
          <p className="text-2xl font-semibold text-red-700">Error</p>
          <p className="text-red-600 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Dashboard header with metrics */}
      {metadata && <DashboardMetrics metadata={metadata} />}
      
      {/* Filter notification */}
      {(selectedCategory || selectedKeyword) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center">
          <div>
            <p className="text-blue-800 font-medium">Filters applied:</p>
            <div className="flex gap-2 mt-2">
              {selectedCategory && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Category: {selectedCategory}
                </span>
              )}
              {selectedKeyword && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Keyword: {selectedKeyword}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={handleResetFilters}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Reset Filters
          </button>
        </div>
      )}
      
      {/* Historical Trend Section - Featured prominently */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow mb-10 border border-blue-100 animate-gradient-x">
        <div className="flex items-center mb-6">
          <div className="w-1 h-8 bg-primary-600 mr-3 rounded"></div>
          <h2 className="text-2xl font-bold text-gray-800">AI Research Historical Trends (6 Months)</h2>
        </div>
        
        <p className="text-gray-600 mb-8">
          Analyze AI research trends from arXiv over the past 6 months. Explore publication patterns, 
          track AI safety topics, and identify emerging research themes.
        </p>
        
        <div className="space-y-10">
          {/* Publication volume trends */}
          {counts.monthly && Object.keys(counts.monthly).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-card border border-gray-100">
              <TrendChart 
                countsData={counts} 
                safetyCountsData={safetyTrends}
                title="Publication Volume by Category" 
              />
            </div>
          )}
          
          {/* Safety keyword trends */}
          {metadata && metadata.safety_terms && monthlyKeywords && Object.keys(monthlyKeywords).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-card border border-gray-100">
              <SafetyKeywordTrends
                monthlyKeywords={monthlyKeywords}
                safetyTerms={metadata.safety_terms}
                title="AI Safety Related Keywords" 
                maxKeywords={8}
              />
            </div>
          )}
          
          {/* General keyword trends */}
          {monthlyKeywords && Object.keys(monthlyKeywords).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-card border border-gray-100">
              <KeywordTrends
                monthlyKeywords={monthlyKeywords}
                title="Popular Research Topics Over Time"
                maxKeywords={5}
              />
            </div>
          )}
        </div>
      </section>
      
      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CategoryChart 
          countsData={counts} 
          onCategoryClick={handleCategoryClick} 
        />
        <KeywordCloud 
          keywords={keywords} 
          onKeywordClick={handleKeywordClick} 
        />
      </div>
      
      {/* Papers section with tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 px-6 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Papers ({papers.length})
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={`py-3 px-6 text-sm font-medium ${
                activeTab === 'safety'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              AI Safety Papers ({safetyPapers.length})
            </button>
          </nav>
        </div>
      </div>
      
      {/* Render the appropriate paper list based on active tab */}
      {activeTab === 'all' ? (
        <PaperList
          papers={papers}
          title="All Recent Papers"
          selectedCategory={selectedCategory}
          selectedKeyword={selectedKeyword}
        />
      ) : (
        <PaperList
          papers={safetyPapers}
          title="AI Safety Papers"
          selectedCategory={selectedCategory}
          selectedKeyword={selectedKeyword}
        />
      )}
    </div>
  );
}