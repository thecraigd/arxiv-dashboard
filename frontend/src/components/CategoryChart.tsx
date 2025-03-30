'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { CountsData } from '@/lib/types';
import { getRecentDays, getCategories } from '@/lib/data';

// Register the required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CategoryChartProps {
  countsData: CountsData;
  onCategoryClick?: (category: string) => void;
}

export default function CategoryChart({ countsData, onCategoryClick }: CategoryChartProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    if (!countsData) return;

    if (viewMode === 'daily') {
      const days = getRecentDays(countsData, 7);
      const categories = getCategories(countsData);

      // Prepare datasets for each category
      const datasets = categories.map((category, index) => {
        // Generate a predictable color based on the category name
        const hue = (index * 137) % 360; // Use golden angle to space colors
        
        return {
          label: category,
          data: days.map(day => countsData.daily[day]?.[category] || 0),
          backgroundColor: `hsla(${hue}, 70%, 60%, 0.7)`,
          borderColor: `hsla(${hue}, 70%, 50%, 1)`,
          borderWidth: 1,
        };
      });

      setChartData({
        labels: days.map(day => new Date(day).toLocaleDateString()),
        datasets,
      });
    } else {
      // Weekly view logic
      const weeks = Object.keys(countsData.weekly || {})
        .sort((a, b) => b.localeCompare(a)) // Sort weeks in descending order
        .slice(0, 8); // Get most recent 8 weeks
        
      const categories = getCategories(countsData);

      // Prepare datasets for each category
      const datasets = categories.map((category, index) => {
        const hue = (index * 137) % 360;
        
        return {
          label: category,
          data: weeks.map(week => countsData.weekly[week]?.[category] || 0),
          backgroundColor: `hsla(${hue}, 70%, 60%, 0.7)`,
          borderColor: `hsla(${hue}, 70%, 50%, 1)`,
          borderWidth: 1,
        };
      });

      setChartData({
        labels: weeks.map(week => week.replace('W', ' Week ')),
        datasets,
      });
    }
  }, [countsData, viewMode]);

  const chartOptions: ChartOptions<'bar'> = {
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: `${viewMode === 'daily' ? 'Daily' : 'Weekly'} Papers by Category`,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${value} papers`;
          }
        }
      }
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Number of papers'
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onCategoryClick) {
        const index = elements[0].datasetIndex;
        const category = chartData.datasets[index].label;
        onCategoryClick(category);
      }
    }
  };

  if (!chartData) {
    return <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">Loading chart data...</div>;
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Publication Trends</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'daily' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'weekly' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>
      <div className="h-80">
        <Bar data={chartData} options={chartOptions} />
      </div>
      <p className="mt-4 text-sm text-gray-600">
        Click on a category in the chart to filter the paper list.
      </p>
    </div>
  );
}