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

interface KeywordTrendsProps {
  monthlyKeywords: MonthlyKeywords;
  title?: string;
  maxKeywords?: number;
}

export default function KeywordTrends({ 
  monthlyKeywords, 
  title = 'Keyword Trends Over Time',
  maxKeywords = 5
}: KeywordTrendsProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([]);

  useEffect(() => {
    if (!monthlyKeywords || Object.keys(monthlyKeywords).length === 0) {
      return;
    }

    // Extract all unique keywords across all months
    const keywordSet = new Set<string>();
    Object.values(monthlyKeywords).forEach(keywords => {
      keywords.forEach(kw => keywordSet.add(kw.text));
    });
    
    // Find the most common keywords by summing their values across all months
    const keywordCounts: {[key: string]: number} = {};
    Object.values(monthlyKeywords).forEach(keywords => {
      keywords.forEach(kw => {
        keywordCounts[kw.text] = (keywordCounts[kw.text] || 0) + kw.value;
      });
    });
    
    // Sort keywords by total count and take the top ones
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    
    setAvailableKeywords(topKeywords);
    
    // Initialize with the top keywords
    if (selectedKeywords.length === 0) {
      setSelectedKeywords(topKeywords.slice(0, maxKeywords));
    }
  }, [monthlyKeywords, maxKeywords]);

  // Update chart when selected keywords change
  useEffect(() => {
    if (!monthlyKeywords || Object.keys(monthlyKeywords).length === 0 || selectedKeywords.length === 0) {
      return;
    }

    const months = Object.keys(monthlyKeywords).sort();
    
    // Create datasets for each selected keyword
    const datasets = selectedKeywords.map((keyword, index) => {
      // Generate a color based on the keyword index
      const hue = (index * 137) % 360; // Use golden angle to space colors
      
      return {
        label: keyword,
        data: months.map(month => {
          const keywordData = monthlyKeywords[month].find(k => k.text === keyword);
          return keywordData ? keywordData.value : 0;
        }),
        borderColor: `hsla(${hue}, 70%, 50%, 1)`,
        backgroundColor: `hsla(${hue}, 70%, 60%, 0.2)`,
        tension: 0.4,
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
          padding: 20,
          generateLabels: (chart) => {
            // Only show labels for visible datasets
            const visibleDatasets = chart.data.datasets.filter((_, i) => chart.isDatasetVisible(i));
            
            return visibleDatasets.map((dataset, i) => ({
              text: dataset.label || '',
              fillStyle: dataset.backgroundColor as string,
              strokeStyle: dataset.borderColor as string,
              lineWidth: 2,
              hidden: !chart.isDatasetVisible(i),
              index: i
            }));
          }
        },
        onClick: (e, legendItem, legend) => {
          // Toggle dataset visibility
          const index = legendItem.index !== undefined ? legendItem.index : 0;
          const chart = legend.chart;
          
          // Toggle visibility
          chart.toggleDataVisibility(index);
          chart.update();
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16
        },
        padding: {
          bottom: 10
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
          precision: 0
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
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2
      },
      point: {
        radius: 3,
        hitRadius: 10,
        hoverRadius: 5
      }
    }
  };

  if (!chartData) {
    return <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">Loading keyword trend data...</div>;
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Select keywords to display:</h3>
        <div className="flex flex-wrap gap-2">
          {availableKeywords.slice(0, 15).map(keyword => (
            <button
              key={keyword}
              onClick={() => toggleKeyword(keyword)}
              className={`px-3 py-1 text-sm rounded-full ${
                selectedKeywords.includes(keyword)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600">
        Click on keywords to add or remove them from the chart
      </p>
    </div>
  );
}