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

// Register the required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrendChartProps {
  countsData: {
    monthly?: Record<string, Record<string, number>>;
  };
  safetyCountsData?: {
    monthly_counts: Record<string, number>;
  };
  title?: string;
}

export default function TrendChart({ 
  countsData, 
  safetyCountsData,
  title = 'Monthly Trends'
}: TrendChartProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [displayType, setDisplayType] = useState<'categories' | 'safety'>('categories');

  useEffect(() => {
    if (!countsData || !countsData.monthly) return;

    if (displayType === 'categories') {
      // Prepare data for category trends
      const months = Object.keys(countsData.monthly).sort();
      const categories = new Set<string>();
      
      // Get all unique categories
      Object.values(countsData.monthly).forEach(monthData => {
        Object.keys(monthData).forEach(category => {
          categories.add(category);
        });
      });
      
      // Prepare datasets for each category
      const datasets = Array.from(categories).map((category, index) => {
        // Generate a predictable color based on the category name
        const hue = (index * 137) % 360; // Use golden angle to space colors
        
        return {
          label: category,
          data: months.map(month => countsData.monthly?.[month]?.[category] || 0),
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
    } else if (displayType === 'safety' && safetyCountsData) {
      // Prepare data for safety trends
      const months = Object.keys(safetyCountsData.monthly_counts).sort();
      
      // Get total papers per month
      const totalByMonth = months.map(month => {
        return Object.values(countsData.monthly?.[month] || {}).reduce(
          (sum, count) => sum + count, 0
        );
      });
      
      // Calculate safety percentage
      const safetyPercentage = months.map((month, index) => {
        const safetyCount = safetyCountsData.monthly_counts[month] || 0;
        const total = totalByMonth[index];
        return total > 0 ? (safetyCount / total) * 100 : 0;
      });
      
      setChartData({
        labels: months.map(monthKey => {
          // Format month labels
          const [year, monthNum] = monthKey.split('-');
          const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
          return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        }),
        datasets: [
          {
            label: 'Total Papers',
            data: totalByMonth,
            borderColor: 'hsla(210, 70%, 50%, 1)',
            backgroundColor: 'hsla(210, 70%, 60%, 0.2)',
            tension: 0.4,
            yAxisID: 'y',
          },
          {
            label: 'Safety Papers',
            data: months.map(month => safetyCountsData.monthly_counts[month] || 0),
            borderColor: 'hsla(120, 70%, 40%, 1)',
            backgroundColor: 'hsla(120, 70%, 50%, 0.2)',
            tension: 0.4,
            yAxisID: 'y',
          },
          {
            label: 'Safety %',
            data: safetyPercentage,
            borderColor: 'hsla(30, 90%, 50%, 1)',
            backgroundColor: 'hsla(30, 90%, 60%, 0.2)',
            tension: 0.4,
            yAxisID: 'y1',
          }
        ],
      });
    }
  }, [countsData, safetyCountsData, displayType]);

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
    scales: displayType === 'safety' ? {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Number of Papers',
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
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Safety %',
          font: {
            size: 12
          }
        },
        min: 0,
        max: Math.max(20, Math.ceil(Math.max(...(safetyCountsData?.monthly_counts 
          ? Object.values(safetyCountsData.monthly_counts).map((count, i) => {
            const month = Object.keys(safetyCountsData.monthly_counts)[i];
            const totalInMonth = Object.values(countsData.monthly?.[month] || {}).reduce((sum, c) => sum + c, 0);
            return totalInMonth > 0 ? (count / totalInMonth) * 100 : 0;
          })
          : [0])) * 1.1)), // Add 10% padding
        ticks: {
          callback: (value) => `${value}%`
        }
      },
    } : {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Papers',
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
    return <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">Loading trend data...</div>;
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setDisplayType('categories')}
            className={`px-3 py-1 rounded text-sm ${
              displayType === 'categories' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            By Category
          </button>
          <button
            onClick={() => setDisplayType('safety')}
            className={`px-3 py-1 rounded text-sm ${
              displayType === 'safety' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            Safety Trends
          </button>
        </div>
      </div>
      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>
      <p className="mt-4 text-sm text-gray-600">
        {displayType === 'categories' 
          ? 'Showing publication trends by category over time'
          : 'Comparing safety papers to total papers over time'}
      </p>
    </div>
  );
}