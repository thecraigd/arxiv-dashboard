'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { KeywordData, MonthlyKeywords } from '../app/types';

// Register the Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SafetyKeywordTrendsProps {
  monthlyKeywords: MonthlyKeywords;
  safetyTerms: string[];
  title?: string;
  maxKeywords?: number;
}

export default function SafetyKeywordTrends({ 
  monthlyKeywords, 
  safetyTerms,
  title = 'AI Safety Keyword Trends',
  maxKeywords = 10
}: SafetyKeywordTrendsProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [availableSafetyKeywords, setAvailableSafetyKeywords] = useState<string[]>([]);

  useEffect(() => {
    if (!monthlyKeywords || Object.keys(monthlyKeywords).length === 0 || !safetyTerms || safetyTerms.length === 0) {
      return;
    }

    // Convert safety terms to lowercase for case-insensitive matching
    const lowerSafetyTerms = safetyTerms.map(term => term.toLowerCase());

    // Extract all keywords across all months
    const allKeywords = new Set<string>();
    Object.values(monthlyKeywords).forEach(keywords => {
      keywords.forEach(kw => allKeywords.add(kw.text.toLowerCase()));
    });
    
    // Filter to find safety-related keywords
    console.log('Filtering for safety keywords. Total keywords:', allKeywords.size);
    console.log('Safety terms to match:', lowerSafetyTerms);
    
    // Define a set of safety keywords we know should exist in the data
    const knownSafetyKeywords = [
      'alignment', 'safety', 'interpretability', 
      'adversarial attack', 'robust ai', 'ethical ai',
      'value alignment', 'ai safety', 'ai governance', 
      'outer alignment', 'inner alignment'
    ].map(k => k.toLowerCase());
    
    // First try to find by normal matching
    let safetyKeywords = Array.from(allKeywords).filter(keyword => {
      // Check if this keyword contains any safety term
      const matches = lowerSafetyTerms.some(term => keyword.includes(term));
      if (matches) {
        console.log(`Found safety keyword match via term inclusion: "${keyword}"`);
      }
      return matches;
    });
    
    // If no matches, check if any of our known safety keywords exist in allKeywords
    if (safetyKeywords.length === 0) {
      console.log('No matches via term inclusion. Trying direct known keyword check...');
      safetyKeywords = Array.from(allKeywords).filter(keyword => 
        knownSafetyKeywords.includes(keyword) || 
        knownSafetyKeywords.some(known => keyword.includes(known))
      );
      safetyKeywords.forEach(keyword => 
        console.log(`Found safety keyword via direct check: "${keyword}"`)
      );
    }
    
    // If we still have no matches, try direct check in the monthly keywords
    if (safetyKeywords.length === 0) {
      console.log('Still no matches. Checking monthly_keywords directly...');
      const directMatches = new Set<string>();
      
      Object.values(monthlyKeywords).forEach(keywords => {
        keywords.forEach(kw => {
          const lowerText = kw.text.toLowerCase();
          if (knownSafetyKeywords.some(term => lowerText.includes(term))) {
            console.log(`Direct monthly keyword match: "${kw.text}"`);
            directMatches.add(lowerText);
          }
        });
      });
      
      safetyKeywords = Array.from(directMatches);
    }
    
    console.log('Final safety keywords:', safetyKeywords.length, safetyKeywords);

    // Find the frequency of each safety keyword
    const keywordCounts: {[key: string]: number} = {};
    
    // Debug the keywords in each month
    console.log('Checking keywords by month:');
    Object.entries(monthlyKeywords).forEach(([month, keywords]) => {
      console.log(`Month ${month} has ${keywords.length} keywords`);
      
      // Check for safety keywords in this month
      const safetyInMonth = keywords.filter(kw => 
        lowerSafetyTerms.some(term => kw.text.toLowerCase().includes(term))
      );
      
      if (safetyInMonth.length > 0) {
        console.log(`Month ${month} has safety keywords:`, safetyInMonth.map(k => k.text));
      }
    });
    
    // Super robust counting logic
    Object.values(monthlyKeywords).forEach(keywords => {
      keywords.forEach(kw => {
        const lowerKeyword = kw.text.toLowerCase();
        let isSafetyKeyword = false;
        
        // Method 1: Check if it's in our filtered safetyKeywords
        if (safetyKeywords.includes(lowerKeyword)) {
          isSafetyKeyword = true;
          console.log(`Counting via method 1: "${kw.text}"`);
        } 
        // Method 2: Check if it contains any safety term
        else if (lowerSafetyTerms.some(term => lowerKeyword.includes(term))) {
          isSafetyKeyword = true;
          console.log(`Counting via method 2: "${kw.text}" contains safety term`);
        }
        // Method 3: Check if it matches any of our known safety keywords
        else if (knownSafetyKeywords.some(term => lowerKeyword.includes(term))) {
          isSafetyKeyword = true;
          console.log(`Counting via method 3: "${kw.text}" matches known safety keyword`);
        }
        
        // If it's a safety keyword by any definition, count it
        if (isSafetyKeyword) {
          keywordCounts[kw.text] = (keywordCounts[kw.text] || 0) + kw.value;
        }
      });
    });
    
    console.log('Final keyword counts:', keywordCounts);
    
    // Sort keywords by total count and take the top ones
    const topSafetyKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    
    setAvailableSafetyKeywords(topSafetyKeywords);
    
    // Initialize with the top safety keywords
    if (selectedKeywords.length === 0 && topSafetyKeywords.length > 0) {
      setSelectedKeywords(topSafetyKeywords.slice(0, Math.min(maxKeywords, topSafetyKeywords.length)));
    }
  }, [monthlyKeywords, safetyTerms, maxKeywords]);

  // Update chart when selected keywords change
  useEffect(() => {
    if (!monthlyKeywords || Object.keys(monthlyKeywords).length === 0 || selectedKeywords.length === 0) {
      return;
    }

    const months = Object.keys(monthlyKeywords).sort();
    
    // Create datasets for each selected keyword
    const datasets = selectedKeywords.map((keyword, index) => {
      // Generate a color based on the keyword index
      const hue = (index * 137) % 360; // Use golden angle for better color distribution
      
      return {
        label: keyword,
        data: months.map(month => {
          const keywordObj = monthlyKeywords[month].find(k => k.text === keyword);
          return keywordObj ? keywordObj.value : 0;
        }),
        borderColor: `hsla(${hue}, 70%, 50%, 1)`,
        backgroundColor: `hsla(${hue}, 70%, 60%, 0.2)`,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      };
    });
    
    setChartData({
      labels: months.map(monthKey => {
        // Format month labels (e.g., "2023-01" to "Jan 2023")
        const [year, monthNum] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      }),
      datasets,
    });
  }, [monthlyKeywords, selectedKeywords]);

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      } else {
        return [...prev, keyword];
      }
    });
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          padding: 20
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Keyword Frequency',
          font: {
            size: 12
          }
        },
        ticks: {
          precision: 0,
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (!chartData) {
    if (availableSafetyKeywords.length === 0) {
      console.log('No available safety keywords. Showing "Not found" message.');
      console.log('monthlyKeywords data:', monthlyKeywords);
      console.log('safetyTerms:', safetyTerms);
      
      return (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">{title}</h2>
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
            <p className="text-gray-500">No safety-related keywords found in the dataset</p>
          </div>
        </div>
      );
    }
    console.log('availableSafetyKeywords exist but chartData not yet ready:', availableSafetyKeywords);
    return (
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-gray-500">Loading keyword trend data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Safety Keywords:</h3>
        <div className="flex flex-wrap gap-2">
          {availableSafetyKeywords.slice(0, 20).map(keyword => (
            <button
              key={keyword}
              onClick={() => toggleKeyword(keyword)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedKeywords.includes(keyword)
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600">
        Click on keywords to add or remove them from the chart. Showing keywords related to AI safety topics.
      </p>
    </div>
  );
}