// Script to create a fully working standalone HTML file
// This is a backup approach if all other approaches fail
const fs = require('fs');
const path = require('path');

// Don't reference prepare-build script directly
// Instead, implement the necessary functionality here

// Now create a static HTML file that will load the data locally
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Safety arXiv Trends Dashboard</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>

  <style>
    .card {
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      transition: box-shadow 0.3s;
    }
    .card:hover {
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    }
    .keyword {
      display: inline-block;
      margin: 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      cursor: pointer;
    }
    .animate-gradient-x {
      background-size: 200% 200%;
      animation: gradient-x 15s ease infinite;
    }
    @keyframes gradient-x {
      0%, 100% {
        background-position: left center;
      }
      50% {
        background-position: right center;
      }
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <header class="bg-blue-700 text-white py-4 shadow-md">
    <div class="container mx-auto px-4">
      <h1 class="text-2xl font-bold">AI Safety arXiv Trends Dashboard</h1>
    </div>
  </header>

  <main class="container mx-auto px-4 py-8">
    <div id="app">
      <div class="text-center py-16">
        <p class="text-xl">Loading dashboard data...</p>
      </div>
    </div>
  </main>

  <footer class="bg-gray-100 py-6 mt-12">
    <div class="container mx-auto px-4 text-center text-gray-600">
      <p>Data sourced from <a href="https://arxiv.org/" class="text-blue-600 hover:underline">arXiv.org</a></p>
      <p class="mt-2 text-sm">
        Updated daily via GitHub Actions
      </p>
    </div>
  </footer>

  <script>
    // Main application script
    async function loadDashboard() {
      try {
        // Load data 
        const papers = await fetch('./data/papers.json').then(res => res.json());
        const counts = await fetch('./data/counts.json').then(res => res.json());
        const keywords = await fetch('./data/keywords.json').then(res => res.json());
        const safetyPapers = await fetch('./data/safety_papers.json').then(res => res.json());
        const metadata = await fetch('./data/metadata.json').then(res => res.json());
        
        // Load historical data
        let monthlyKeywords = {};
        let safetyTrends = { monthly_counts: {} };
        let historicalPapers = [];
        
        try {
          monthlyKeywords = await fetch('./data/monthly_keywords.json').then(res => res.json());
        } catch (e) {
          console.warn('Monthly keywords data not available');
        }
        
        try {
          safetyTrends = await fetch('./data/safety_trends.json').then(res => res.json());
        } catch (e) {
          console.warn('Safety trends data not available');
        }
        
        try {
          historicalPapers = await fetch('./data/historical_papers.json').then(res => res.json());
        } catch (e) {
          console.warn('Historical papers data not available');
        }
        
        // Initialize the dashboard
        renderDashboard({
          papers, 
          counts, 
          keywords, 
          safetyPapers, 
          metadata,
          monthlyKeywords,
          safetyTrends,
          historicalPapers
        });
      } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('app').innerHTML = \`
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline">Failed to load dashboard data.</span>
          </div>
        \`;
      }
    }

    // Helper functions
    function getArxivUrl(id) {
      const baseId = id.split('v')[0];
      return \`https://arxiv.org/abs/\${baseId}\`;
    }

    function getArxivPdfUrl(id) {
      const baseId = id.split('v')[0];
      return \`https://arxiv.org/pdf/\${baseId}.pdf\`;
    }

    function getRecentDays(counts, days = 7) {
      if (!counts || !counts.daily) return [];
      
      return Object.keys(counts.daily)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .slice(0, days);
    }

    function getCategories(counts) {
      if (!counts || !counts.daily) return [];
      
      const categories = new Set();
      Object.values(counts.daily).forEach(day => {
        Object.keys(day).forEach(category => {
          categories.add(category);
        });
      });
      
      return Array.from(categories);
    }

    // Main rendering function
    function renderDashboard(data) {
      const { papers, counts, keywords, safetyPapers, metadata, monthlyKeywords, safetyTrends, historicalPapers } = data;
      
      // Start with metrics
      const metricsHtml = renderMetrics(metadata);
      
      // Historical Trends section
      const historicalSectionHtml = renderHistoricalSection(counts, monthlyKeywords, safetyTrends, metadata);
      
      // Prepare chart for categories
      const chartHtml = renderCategoryChart(counts);
      
      // Word cloud
      const wordCloudHtml = renderWordCloud(keywords);
      
      // Tabs for papers
      const tabsAndPapersHtml = renderPapersTabs(papers, safetyPapers);
      
      // Combine all sections
      document.getElementById('app').innerHTML = \`
        \${metricsHtml}
        \${historicalSectionHtml}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          \${chartHtml}
          \${wordCloudHtml}
        </div>
        \${tabsAndPapersHtml}
      \`;
      
      // Initialize charts after DOM is ready
      initializeChart(counts);
      
      // Initialize historical trends charts if data is available
      if (counts.monthly && Object.keys(counts.monthly).length > 0) {
        initializeTrendChart(counts, safetyTrends);
      }
      
      if (monthlyKeywords && Object.keys(monthlyKeywords).length > 0) {
        initializeKeywordTrendsChart(monthlyKeywords);
      }
      
      if (metadata.safety_terms && monthlyKeywords && Object.keys(monthlyKeywords).length > 0) {
        initializeSafetyKeywordTrendsChart(monthlyKeywords, metadata.safety_terms);
      }
      
      // Setup event listeners
      setupEventListeners();
    }

    function renderMetrics(metadata) {
      if (!metadata) return '';
      
      const formattedDate = metadata.last_updated 
        ? new Date(metadata.last_updated).toLocaleString()
        : 'Unknown';
      
      const safetyPercentage = metadata.total_papers > 0
        ? ((metadata.safety_papers_count / metadata.total_papers) * 100).toFixed(1)
        : '0';
      
      return \`
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="card bg-blue-50">
            <h3 class="text-lg font-medium text-blue-900">Total Papers</h3>
            <p class="text-3xl font-bold text-blue-700 mt-2">\${metadata.total_papers}</p>
            <p class="text-sm text-blue-600 mt-1">across \${metadata.categories?.length || 0} arXiv categories</p>
          </div>
          
          <div class="card bg-green-50">
            <h3 class="text-lg font-medium text-green-900">Safety Papers</h3>
            <p class="text-3xl font-bold text-green-700 mt-2">\${metadata.safety_papers_count}</p>
            <p class="text-sm text-green-600 mt-1">\${safetyPercentage}% of total papers</p>
          </div>
          
          <div class="card bg-purple-50">
            <h3 class="text-lg font-medium text-purple-900">Last Updated</h3>
            <p class="text-xl font-bold text-purple-700 mt-2">\${formattedDate}</p>
            <p class="text-sm text-purple-600 mt-1">Automatic daily updates</p>
          </div>
        </div>
      \`;
    }
    
    function renderHistoricalSection(counts, monthlyKeywords, safetyTrends, metadata) {
      // Only show historical section if we have monthly data
      if (!counts.monthly || Object.keys(counts.monthly).length === 0) {
        return '';
      }
      
      return \`
        <section class="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-xl shadow mb-10 border border-blue-200 animate-gradient-x">
          <div class="flex items-center mb-6">
            <div class="w-1 h-8 bg-blue-600 mr-3 rounded"></div>
            <h2 class="text-2xl font-bold text-gray-800">AI Research Historical Trends (6 Months)</h2>
          </div>
          
          <p class="text-gray-600 mb-8">
            Analyze AI research trends from arXiv over the past 6 months. Explore publication patterns, 
            track AI safety topics, and identify emerging research themes.
          </p>
          
          <div class="space-y-10">
            <!-- Publication volume trends -->
            <div class="bg-white p-6 rounded-lg shadow border border-gray-100">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">AI Safety Publication Trends</h2>
                <div class="flex space-x-2">
                  <button
                    id="trend-safety-btn"
                    class="px-3 py-1 rounded text-sm bg-blue-600 text-white"
                  >
                    Safety Trends
                  </button>
                  <button
                    id="trend-categories-btn"
                    class="px-3 py-1 rounded text-sm bg-gray-200 text-gray-800"
                  >
                    By Category
                  </button>
                </div>
              </div>
              <div class="h-80">
                <canvas id="trend-chart"></canvas>
              </div>
              <p class="mt-4 text-sm text-gray-600">
                Monthly safety paper trends compared to total publication volume
              </p>
            </div>
            
            <!-- Safety keyword trends -->
            \${metadata.safety_terms && metadata.safety_terms.length > 0 && monthlyKeywords && Object.keys(monthlyKeywords).length > 0 ? \`
            <div class="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h2 class="text-xl font-semibold mb-4">AI Safety Related Keywords</h2>
              <div class="h-80">
                <canvas id="safety-keyword-chart"></canvas>
              </div>
              <div class="mt-6">
                <h3 class="text-sm font-medium text-gray-700 mb-2" id="safety-keywords-title">Select keywords to display:</h3>
                <div class="flex flex-wrap gap-2" id="safety-keyword-buttons">
                  <!-- Safety keyword buttons will be added here -->
                  <div class="animate-pulse flex space-x-4">
                    <div class="bg-gray-200 h-8 w-20 rounded"></div>
                    <div class="bg-gray-200 h-8 w-24 rounded"></div>
                    <div class="bg-gray-200 h-8 w-16 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            \` : ''}
            
            <!-- General keyword trends -->
            \${monthlyKeywords && Object.keys(monthlyKeywords).length > 0 ? \`
            <div class="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h2 class="text-xl font-semibold mb-4">Popular Research Topics Over Time</h2>
              <div class="h-80">
                <canvas id="keyword-trends-chart"></canvas>
              </div>
              <div class="mt-6">
                <h3 class="text-sm font-medium text-gray-700 mb-2" id="keyword-trends-title">Select keywords to display:</h3>
                <div class="flex flex-wrap gap-2" id="keyword-trends-buttons">
                  <!-- Keyword buttons will be added here -->
                  <div class="animate-pulse flex space-x-4">
                    <div class="bg-gray-200 h-8 w-20 rounded"></div>
                    <div class="bg-gray-200 h-8 w-24 rounded"></div>
                    <div class="bg-gray-200 h-8 w-16 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            \` : ''}
          </div>
        </section>
      \`;
    }

    function renderCategoryChart(counts) {
      return \`
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Publication Trends</h2>
            <div class="flex space-x-2">
              <button
                id="daily-btn"
                class="px-3 py-1 rounded text-sm bg-blue-600 text-white"
              >
                Daily
              </button>
              <button
                id="weekly-btn"
                class="px-3 py-1 rounded text-sm bg-gray-200 text-gray-800"
              >
                Weekly
              </button>
            </div>
          </div>
          <div class="h-80">
            <canvas id="category-chart"></canvas>
          </div>
          <p class="mt-4 text-sm text-gray-600">
            Click on a category in the chart to filter the paper list.
          </p>
        </div>
      \`;
    }

    function renderWordCloud(keywords) {
      if (!keywords || !keywords.length) {
        return \`
          <div class="card">
            <h2 class="text-xl font-semibold mb-4">Trending Keywords</h2>
            <div class="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
              No keyword data available
            </div>
          </div>
        \`;
      }
      
      // Sort keywords by value and take top 50
      const topKeywords = [...keywords]
        .sort((a, b) => b.value - a.value)
        .slice(0, 50);
        
      // Calculate min/max for sizing
      const minValue = Math.min(...topKeywords.map(w => w.value));
      const maxValue = Math.max(...topKeywords.map(w => w.value));
      
      // Generate keyword elements
      const keywordElements = topKeywords.map(keyword => {
        // Calculate size between 12px and 40px
        const scale = maxValue === minValue 
          ? 0.5 
          : (keyword.value - minValue) / (maxValue - minValue);
        const fontSize = 12 + scale * 28;
        
        // Generate a color based on the word's value
        const hue = (keyword.value * 137) % 360;
        
        return \`
          <div 
            class="keyword hover:bg-gray-100" 
            style="font-size: \${fontSize}px; color: hsl(\${hue}, 70%, 50%); font-weight: \${keyword.value > (maxValue / 2) ? 'bold' : 'normal'}"
            data-keyword="\${keyword.text}"
            title="\${keyword.text}: \${keyword.value} occurrences"
          >
            \${keyword.text}
          </div>
        \`;
      }).join('');
      
      return \`
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Trending Keywords</h2>
          <div class="bg-gray-50 rounded-lg p-6 h-[400px] flex flex-wrap justify-center items-center overflow-hidden">
            \${keywordElements}
          </div>
          <p class="mt-4 text-sm text-gray-600">
            Click on a keyword to filter papers containing that term.
          </p>
        </div>
      \`;
    }

    function renderPapersTabs(papers, safetyPapers) {
      return \`
        <div class="mb-6">
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex">
              <button
                id="all-papers-tab"
                class="py-3 px-6 text-sm font-medium border-b-2 border-blue-600 text-blue-600"
              >
                All Papers (\${papers.length})
              </button>
              <button
                id="safety-papers-tab"
                class="py-3 px-6 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                AI Safety Papers (\${safetyPapers.length})
              </button>
            </nav>
          </div>
        </div>
        
        <div id="papers-container" class="card">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">
              <span id="papers-title">All Recent Papers</span>
              <span id="filter-info" class="font-normal text-base ml-2 hidden"></span>
            </h2>
            <div class="relative">
              <input
                id="search-input"
                type="text"
                placeholder="Search papers..."
                class="px-4 py-2 border rounded-lg w-64"
              />
            </div>
          </div>
          
          <div id="papers-list" class="space-y-6">
            <!-- Papers will be rendered here -->
          </div>
          
          <!-- Pagination -->
          <div id="pagination" class="flex justify-center mt-8 space-x-2">
            <button
              id="prev-page"
              class="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <div class="px-4 py-1">
              Page <span id="current-page">1</span> of <span id="total-pages">1</span>
            </div>
            <button
              id="next-page"
              class="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      \`;
    }

    // Initialize the category chart
    function initializeChart(countsData) {
      if (!countsData) return;
      
      const ctx = document.getElementById('category-chart').getContext('2d');
      
      // Default to daily view
      let days = getRecentDays(countsData, 7);
      const categories = getCategories(countsData);
      
      // Prepare datasets for each category
      const datasets = categories.map((category, index) => {
        // Generate a predictable color based on the category name
        const hue = (index * 137) % 360; // Use golden angle to space colors
        
        return {
          label: category,
          data: days.map(day => countsData.daily[day]?.[category] || 0),
          backgroundColor: \`hsla(\${hue}, 70%, 60%, 0.7)\`,
          borderColor: \`hsla(\${hue}, 70%, 50%, 1)\`,
          borderWidth: 1,
        };
      });
      
      // Create chart
      window.categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: days.map(day => new Date(day).toLocaleDateString()),
          datasets,
        },
        options: {
          plugins: {
            legend: {
              position: 'bottom',
              display: false
            },
            title: {
              display: true,
              text: 'Daily Papers by Category',
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.dataset.label || '';
                  const value = context.raw;
                  return \`\${label}: \${value} papers\`;
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
            if (elements.length > 0) {
              const index = elements[0].datasetIndex;
              const category = datasets[index].label;
              filterByCategory(category);
            }
          }
        }
      });
      
      // Setup view toggle buttons
      document.getElementById('daily-btn').addEventListener('click', () => {
        setChartViewMode('daily');
      });
      
      document.getElementById('weekly-btn').addEventListener('click', () => {
        setChartViewMode('weekly');
      });
    }
    
    // Initialize the trend chart for historical data
    function initializeTrendChart(countsData, safetyCountsData) {
      if (!countsData.monthly || Object.keys(countsData.monthly).length === 0) return;
      
      const ctx = document.getElementById('trend-chart').getContext('2d');
      
      // Get months sorted chronologically
      const months = Object.keys(countsData.monthly).sort();
      
      // Get all unique categories
      const categories = new Set();
      Object.values(countsData.monthly).forEach(monthData => {
        Object.keys(monthData).forEach(category => {
          categories.add(category);
        });
      });
      
      // Take top 8 categories by volume
      const topCategories = Array.from(categories)
        .map(category => {
          const total = months.reduce((sum, month) => 
            sum + (countsData.monthly[month]?.[category] || 0), 0);
          return { category, total };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
        .map(item => item.category);
      
      // Prepare datasets for each category
      const categoryDatasets = topCategories.map((category, index) => {
        // Generate a predictable color based on the category name
        const hue = (index * 137) % 360; // Use golden angle to space colors
        
        return {
          label: category,
          data: months.map(month => countsData.monthly[month]?.[category] || 0),
          borderColor: \`hsla(\${hue}, 70%, 50%, 1)\`,
          backgroundColor: \`hsla(\${hue}, 70%, 60%, 0.2)\`,
          tension: 0.4,
          borderWidth: 2,
          hidden: index >= 5  // Only show top 5 categories by default
        };
      });
      
      // Prepare safety datasets
      const totalByMonth = months.map(month => {
        return Object.values(countsData.monthly?.[month] || {}).reduce(
          (sum, count) => sum + count, 0
        );
      });
      
      // Calculate safety percentage
      const safetyPercentage = months.map((month, index) => {
        const safetyCount = safetyCountsData?.monthly_counts?.[month] || 0;
        const total = totalByMonth[index];
        return total > 0 ? (safetyCount / total) * 100 : 0;
      });
      
      const safetyDatasets = [
        {
          label: 'Total Papers',
          data: totalByMonth,
          borderColor: 'hsla(210, 70%, 50%, 1)',
          backgroundColor: 'hsla(210, 70%, 60%, 0.2)',
          tension: 0.4,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Safety Papers',
          data: months.map(month => safetyCountsData?.monthly_counts?.[month] || 0),
          borderColor: 'hsla(120, 70%, 40%, 1)',
          backgroundColor: 'hsla(120, 70%, 50%, 0.2)',
          tension: 0.4,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Safety %',
          data: safetyPercentage,
          borderColor: 'hsla(30, 90%, 50%, 1)',
          backgroundColor: 'hsla(30, 90%, 60%, 0.2)',
          tension: 0.4,
          borderWidth: 2,
          yAxisID: 'y1',
        }
      ];
      
      // Format month labels
      const monthLabels = months.map(monthKey => {
        const [year, monthNum] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      });
      
      // Create chart with safety datasets by default
      window.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: safetyDatasets,
        },
        options: {
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
              text: 'AI Safety Paper Trends',
              font: {
                size: 16
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
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
              max: Math.max(20, Math.ceil(Math.max(...safetyPercentage) * 1.1)),
              ticks: {
                callback: (value) => \`\${value}%\`
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          },
          elements: {
            point: {
              radius: 3,
              hitRadius: 10,
              hoverRadius: 5
            }
          }
        }
      });
      
      // Setup toggle buttons for trend view
      document.getElementById('trend-categories-btn').addEventListener('click', () => {
        setTrendViewMode('categories');
      });
      
      document.getElementById('trend-safety-btn').addEventListener('click', () => {
        setTrendViewMode('safety');
      });
      
      // Function to toggle between view modes
      function setTrendViewMode(mode) {
        if (mode === 'categories') {
          // Update button styles
          document.getElementById('trend-categories-btn').className = 'px-3 py-1 rounded text-sm bg-blue-600 text-white';
          document.getElementById('trend-safety-btn').className = 'px-3 py-1 rounded text-sm bg-gray-200 text-gray-800';
          
          // Update chart data and options
          window.trendChart.data.datasets = categoryDatasets;
          window.trendChart.options.scales = {
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
          };
          window.trendChart.options.plugins.title.text = 'Category Publication Trends';
          
        } else if (mode === 'safety') {
          // Update button styles
          document.getElementById('trend-categories-btn').className = 'px-3 py-1 rounded text-sm bg-gray-200 text-gray-800';
          document.getElementById('trend-safety-btn').className = 'px-3 py-1 rounded text-sm bg-blue-600 text-white';
          
          // Update chart data and options
          window.trendChart.data.datasets = safetyDatasets;
          window.trendChart.options.scales = {
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
              max: Math.max(20, Math.ceil(Math.max(...safetyPercentage) * 1.1)),
              ticks: {
                callback: (value) => \`\${value}%\`
              }
            }
          };
          window.trendChart.options.plugins.title.text = 'AI Safety Paper Trends';
        }
        
        window.trendChart.update();
      }
    }
    
    // Initialize the keyword trends chart
    function initializeKeywordTrendsChart(monthlyKeywords) {
      if (!monthlyKeywords || Object.keys(monthlyKeywords).length === 0) return;
      
      const ctx = document.getElementById('keyword-trends-chart').getContext('2d');
      
      // Get months sorted chronologically
      const months = Object.keys(monthlyKeywords).sort();
      
      // Extract all unique keywords across all months
      const keywordSet = new Set();
      Object.values(monthlyKeywords).forEach(keywords => {
        keywords.forEach(kw => keywordSet.add(kw.text));
      });
      
      // Find the most common keywords by summing their values across all months
      const keywordCounts = {};
      Object.values(monthlyKeywords).forEach(keywords => {
        keywords.forEach(kw => {
          keywordCounts[kw.text] = (keywordCounts[kw.text] || 0) + kw.value;
        });
      });
      
      // Sort keywords by total count and take the top ones
      const topKeywords = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(entry => entry[0]);
      
      // Default to showing the top 5 keywords
      const initialKeywords = topKeywords.slice(0, 5);
      
      // Create datasets for selected keywords
      const datasets = initialKeywords.map((keyword, index) => {
        // Generate a color based on the keyword index
        const hue = (index * 137) % 360; // Use golden angle for better color distribution
        
        return {
          label: keyword,
          data: months.map(month => {
            const keywordObj = monthlyKeywords[month].find(k => k.text === keyword);
            return keywordObj ? keywordObj.value : 0;
          }),
          borderColor: \`hsla(\${hue}, 70%, 50%, 1)\`,
          backgroundColor: \`hsla(\${hue}, 70%, 60%, 0.2)\`,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        };
      });
      
      // Format month labels
      const monthLabels = months.map(monthKey => {
        const [year, monthNum] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      });
      
      // Create the chart
      window.keywordTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets,
        },
        options: {
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
              text: 'Top Keywords Over Time',
              font: {
                size: 16
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false
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
          }
        }
      });
      
      // Generate keyword buttons
      const keywordButtonsContainer = document.getElementById('keyword-trends-buttons');
      keywordButtonsContainer.innerHTML = topKeywords.map(keyword => {
        const isSelected = initialKeywords.includes(keyword);
        return \`
          <button
            class="keyword-trend-btn px-3 py-1 text-sm rounded-full \${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }"
            data-keyword="\${keyword}"
          >
            \${keyword}
          </button>
        \`;
      }).join('');
      
      // Add event listeners to buttons
      document.querySelectorAll('.keyword-trend-btn').forEach(button => {
        button.addEventListener('click', () => {
          const keyword = button.dataset.keyword;
          toggleKeywordInChart(keyword, button);
        });
      });
      
      // Function to toggle a keyword in the chart
      function toggleKeywordInChart(keyword, button) {
        // Check if the keyword is already in the chart
        const existingDatasetIndex = window.keywordTrendsChart.data.datasets.findIndex(
          dataset => dataset.label === keyword
        );
        
        if (existingDatasetIndex > -1) {
          // Remove the keyword dataset
          window.keywordTrendsChart.data.datasets.splice(existingDatasetIndex, 1);
          button.classList.remove('bg-blue-600', 'text-white');
          button.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
        } else {
          // Add the keyword dataset
          const newIndex = window.keywordTrendsChart.data.datasets.length;
          const hue = (newIndex * 137) % 360;
          
          window.keywordTrendsChart.data.datasets.push({
            label: keyword,
            data: months.map(month => {
              const keywordObj = monthlyKeywords[month].find(k => k.text === keyword);
              return keywordObj ? keywordObj.value : 0;
            }),
            borderColor: \`hsla(\${hue}, 70%, 50%, 1)\`,
            backgroundColor: \`hsla(\${hue}, 70%, 60%, 0.2)\`,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
          });
          
          button.classList.remove('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
          button.classList.add('bg-blue-600', 'text-white');
        }
        
        window.keywordTrendsChart.update();
      }
    }
    
    // Initialize the safety keyword trends chart
    function initializeSafetyKeywordTrendsChart(monthlyKeywords, safetyTerms) {
      if (!monthlyKeywords || Object.keys(monthlyKeywords).length === 0 || !safetyTerms || safetyTerms.length === 0) return;
      
      const ctx = document.getElementById('safety-keyword-chart').getContext('2d');
      
      // Convert safety terms to lowercase for case-insensitive matching
      const lowerSafetyTerms = safetyTerms.map(term => term.toLowerCase());
      
      // Extract all keywords across all months
      const allKeywords = new Set();
      Object.values(monthlyKeywords).forEach(keywords => {
        keywords.forEach(kw => allKeywords.add(kw.text.toLowerCase()));
      });
      
      // Filter to find safety-related keywords
      const safetyKeywords = Array.from(allKeywords).filter(keyword => {
        // Check if this keyword contains any safety term
        return lowerSafetyTerms.some(term => keyword.includes(term));
      });
      
      // If no safety keywords found, display a message
      if (safetyKeywords.length === 0) {
        const container = document.getElementById('safety-keywords-title').parentNode.parentNode;
        container.innerHTML = \`
          <h2 class="text-xl font-semibold mb-4">AI Safety Related Keywords</h2>
          <div class="h-80 flex items-center justify-center bg-gray-100 rounded-lg">
            <p class="text-gray-500">No safety-related keywords found in the dataset</p>
          </div>
        \`;
        return;
      }
      
      // Find the frequency of each safety keyword
      const keywordCounts = {};
      Object.values(monthlyKeywords).forEach(keywords => {
        keywords.forEach(kw => {
          const lowerKeyword = kw.text.toLowerCase();
          if (safetyKeywords.includes(lowerKeyword)) {
            keywordCounts[kw.text] = (keywordCounts[kw.text] || 0) + kw.value;
          }
        });
      });
      
      // Sort keywords by total count and take the top ones
      const topSafetyKeywords = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(entry => entry[0]);
      
      // Default to showing the top 5 safety keywords
      const initialKeywords = topSafetyKeywords.slice(0, 5);
      
      // Get months sorted chronologically
      const months = Object.keys(monthlyKeywords).sort();
      
      // Create datasets for selected keywords
      const datasets = initialKeywords.map((keyword, index) => {
        // Generate a color based on the keyword index
        const hue = (index * 137) % 360; // Use golden angle for better color distribution
        
        return {
          label: keyword,
          data: months.map(month => {
            const keywordObj = monthlyKeywords[month].find(k => k.text === keyword);
            return keywordObj ? keywordObj.value : 0;
          }),
          borderColor: \`hsla(\${hue}, 70%, 50%, 1)\`,
          backgroundColor: \`hsla(\${hue}, 70%, 60%, 0.2)\`,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        };
      });
      
      // Format month labels
      const monthLabels = months.map(monthKey => {
        const [year, monthNum] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      });
      
      // Create the chart
      window.safetyKeywordChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets,
        },
        options: {
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
              text: 'AI Safety Keyword Trends',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false
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
          }
        }
      });
      
      // Generate keyword buttons
      const keywordButtonsContainer = document.getElementById('safety-keyword-buttons');
      keywordButtonsContainer.innerHTML = topSafetyKeywords.map(keyword => {
        const isSelected = initialKeywords.includes(keyword);
        return \`
          <button
            class="safety-keyword-btn px-3 py-1 text-sm rounded-full \${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }"
            data-keyword="\${keyword}"
          >
            \${keyword}
          </button>
        \`;
      }).join('');
      
      // Add event listeners to buttons
      document.querySelectorAll('.safety-keyword-btn').forEach(button => {
        button.addEventListener('click', () => {
          const keyword = button.dataset.keyword;
          toggleSafetyKeywordInChart(keyword, button);
        });
      });
      
      // Function to toggle a keyword in the chart
      function toggleSafetyKeywordInChart(keyword, button) {
        // Check if the keyword is already in the chart
        const existingDatasetIndex = window.safetyKeywordChart.data.datasets.findIndex(
          dataset => dataset.label === keyword
        );
        
        if (existingDatasetIndex > -1) {
          // Remove the keyword dataset
          window.safetyKeywordChart.data.datasets.splice(existingDatasetIndex, 1);
          button.classList.remove('bg-blue-600', 'text-white');
          button.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
        } else {
          // Add the keyword dataset
          const newIndex = window.safetyKeywordChart.data.datasets.length;
          const hue = (newIndex * 137) % 360;
          
          window.safetyKeywordChart.data.datasets.push({
            label: keyword,
            data: months.map(month => {
              const keywordObj = monthlyKeywords[month].find(k => k.text === keyword);
              return keywordObj ? keywordObj.value : 0;
            }),
            borderColor: \`hsla(\${hue}, 70%, 50%, 1)\`,
            backgroundColor: \`hsla(\${hue}, 70%, 60%, 0.2)\`,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
          });
          
          button.classList.remove('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
          button.classList.add('bg-blue-600', 'text-white');
        }
        
        window.safetyKeywordChart.update();
      }
    }
    
    // Global state for the app
    const appState = {
      currentPage: 1,
      papersPerPage: 10,
      activeTab: 'all',
      selectedCategory: null,
      selectedKeyword: null,
      searchTerm: '',
      data: null
    };
    
    function setupEventListeners() {
      // Tab switching
      document.getElementById('all-papers-tab').addEventListener('click', () => {
        switchTab('all');
      });
      
      document.getElementById('safety-papers-tab').addEventListener('click', () => {
        switchTab('safety');
      });
      
      // Search input
      document.getElementById('search-input').addEventListener('input', (e) => {
        appState.searchTerm = e.target.value;
        appState.currentPage = 1;
        renderPapersList();
      });
      
      // Keyword clicks
      document.querySelectorAll('.keyword').forEach(el => {
        el.addEventListener('click', () => {
          const keyword = el.dataset.keyword;
          filterByKeyword(keyword);
        });
      });
      
      // Pagination
      document.getElementById('prev-page').addEventListener('click', () => {
        if (appState.currentPage > 1) {
          appState.currentPage--;
          renderPapersList();
        }
      });
      
      document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = calculateTotalPages();
        if (appState.currentPage < totalPages) {
          appState.currentPage++;
          renderPapersList();
        }
      });
    }
    
    function switchTab(tab) {
      appState.activeTab = tab;
      appState.currentPage = 1;
      
      // Update UI
      if (tab === 'all') {
        document.getElementById('all-papers-tab').className = 'py-3 px-6 text-sm font-medium border-b-2 border-blue-600 text-blue-600';
        document.getElementById('safety-papers-tab').className = 'py-3 px-6 text-sm font-medium text-gray-500 hover:text-gray-700';
        document.getElementById('papers-title').textContent = 'All Recent Papers';
      } else {
        document.getElementById('all-papers-tab').className = 'py-3 px-6 text-sm font-medium text-gray-500 hover:text-gray-700';
        document.getElementById('safety-papers-tab').className = 'py-3 px-6 text-sm font-medium border-b-2 border-blue-600 text-blue-600';
        document.getElementById('papers-title').textContent = 'AI Safety Papers';
      }
      
      renderPapersList();
    }
    
    function filterByCategory(category) {
      if (appState.selectedCategory === category) {
        // Clear filter if already selected
        appState.selectedCategory = null;
      } else {
        appState.selectedCategory = category;
      }
      
      appState.selectedKeyword = null;
      appState.currentPage = 1;
      
      updateFilterInfo();
      renderPapersList();
    }
    
    function filterByKeyword(keyword) {
      if (appState.selectedKeyword === keyword) {
        // Clear filter if already selected
        appState.selectedKeyword = null;
      } else {
        appState.selectedKeyword = keyword;
      }
      
      appState.selectedCategory = null;
      appState.currentPage = 1;
      
      updateFilterInfo();
      renderPapersList();
    }
    
    function updateFilterInfo() {
      const filterInfo = document.getElementById('filter-info');
      
      if (appState.selectedCategory) {
        filterInfo.textContent = \`| Category: \${appState.selectedCategory}\`;
        filterInfo.classList.remove('hidden');
      } else if (appState.selectedKeyword) {
        filterInfo.textContent = \`| Keyword: \${appState.selectedKeyword}\`;
        filterInfo.classList.remove('hidden');
      } else {
        filterInfo.classList.add('hidden');
      }
    }
    
    function setChartViewMode(mode) {
      if (!window.categoryChart || !appState.data) return;
      
      const { counts } = appState.data;
      
      if (mode === 'daily') {
        // Update button styles
        document.getElementById('daily-btn').className = 'px-3 py-1 rounded text-sm bg-blue-600 text-white';
        document.getElementById('weekly-btn').className = 'px-3 py-1 rounded text-sm bg-gray-200 text-gray-800';
        
        // Update chart data
        const days = getRecentDays(counts, 7);
        const categories = getCategories(counts);
        
        window.categoryChart.data.labels = days.map(day => new Date(day).toLocaleDateString());
        window.categoryChart.data.datasets = categories.map((category, index) => {
          const hue = (index * 137) % 360;
          return {
            label: category,
            data: days.map(day => counts.daily[day]?.[category] || 0),
            backgroundColor: \`hsla(\${hue}, 70%, 60%, 0.7)\`,
            borderColor: \`hsla(\${hue}, 70%, 50%, 1)\`,
            borderWidth: 1,
          };
        });
        
        window.categoryChart.options.plugins.title.text = 'Daily Papers by Category';
        window.categoryChart.update();
        
      } else if (mode === 'weekly') {
        // Update button styles
        document.getElementById('daily-btn').className = 'px-3 py-1 rounded text-sm bg-gray-200 text-gray-800';
        document.getElementById('weekly-btn').className = 'px-3 py-1 rounded text-sm bg-blue-600 text-white';
        
        // Update chart data
        const weeks = Object.keys(counts.weekly || {})
          .sort((a, b) => b.localeCompare(a))
          .slice(0, 8);
          
        const categories = getCategories(counts);
        
        window.categoryChart.data.labels = weeks.map(week => week.replace('W', ' Week '));
        window.categoryChart.data.datasets = categories.map((category, index) => {
          const hue = (index * 137) % 360;
          return {
            label: category,
            data: weeks.map(week => counts.weekly[week]?.[category] || 0),
            backgroundColor: \`hsla(\${hue}, 70%, 60%, 0.7)\`,
            borderColor: \`hsla(\${hue}, 70%, 50%, 1)\`,
            borderWidth: 1,
          };
        });
        
        window.categoryChart.options.plugins.title.text = 'Weekly Papers by Category';
        window.categoryChart.update();
      }
    }
    
    function renderPapersList() {
      if (!appState.data) return;
      
      const { papers, safetyPapers } = appState.data;
      const papersToUse = appState.activeTab === 'all' ? papers : safetyPapers;
      
      // Filter papers
      const filteredPapers = papersToUse.filter(paper => {
        const searchMatch = appState.searchTerm === '' || 
          paper.title.toLowerCase().includes(appState.searchTerm.toLowerCase()) ||
          (paper.authors && paper.authors.some(author => author.toLowerCase().includes(appState.searchTerm.toLowerCase()))) ||
          (paper.abstract_snippet && paper.abstract_snippet.toLowerCase().includes(appState.searchTerm.toLowerCase()));
        
        const categoryMatch = !appState.selectedCategory || paper.categories.includes(appState.selectedCategory);
        
        const keywordMatch = !appState.selectedKeyword || 
          paper.title.toLowerCase().includes(appState.selectedKeyword.toLowerCase()) ||
          (paper.abstract_snippet && paper.abstract_snippet.toLowerCase().includes(appState.selectedKeyword.toLowerCase()));
        
        return searchMatch && categoryMatch && keywordMatch;
      });
      
      // Pagination
      const totalPages = Math.ceil(filteredPapers.length / appState.papersPerPage);
      const startIndex = (appState.currentPage - 1) * appState.papersPerPage;
      const currentPapers = filteredPapers.slice(startIndex, startIndex + appState.papersPerPage);
      
      // Update pagination UI
      document.getElementById('current-page').textContent = appState.currentPage;
      document.getElementById('total-pages').textContent = totalPages || 1;
      document.getElementById('prev-page').disabled = appState.currentPage <= 1;
      document.getElementById('next-page').disabled = appState.currentPage >= totalPages;
      
      // Render papers
      const papersListElement = document.getElementById('papers-list');
      
      if (filteredPapers.length === 0) {
        papersListElement.innerHTML = \`
          <div class="text-center py-8 text-gray-500">
            No papers found matching your criteria.
          </div>
        \`;
        return;
      }
      
      papersListElement.innerHTML = currentPapers.map(paper => {
        // Generate categories badges
        const categoriesBadges = paper.categories.map(cat => {
          const isSelected = cat === appState.selectedCategory;
          return \`
            <span 
              class="text-xs px-2 py-1 rounded \${
                isSelected 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }"
            >
              \${cat}
            </span>
          \`;
        }).join(' ');
        
        // Generate safety keywords section if any
        const safetyKeywordsSection = paper.safety_keywords_found.length > 0 
          ? \`
            <div class="mt-2">
              <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Safety keywords: \${paper.safety_keywords_found.join(', ')}
              </span>
            </div>
          \`
          : '';
        
        // Generate abstract snippet
        const abstractText = paper.abstract_snippet || 
          (paper.abstract ? (paper.abstract.length > 200 ? 
                          paper.abstract.substring(0, 200) + '...' : 
                          paper.abstract) : 
            'No abstract available');
        
        return \`
          <div class="border-b pb-5">
            <h3 class="text-lg font-medium">
              <a 
                href="\${getArxivUrl(paper.id)}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-blue-700 hover:underline"
              >
                \${paper.title}
              </a>
            </h3>
            <div class="text-sm text-gray-600 mt-1">
              \${paper.authors.join(', ')}
            </div>
            <div class="flex gap-2 mt-2 flex-wrap">
              \${categoriesBadges}
              <span class="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                \${paper.submitted_date}
              </span>
            </div>
            
            \${safetyKeywordsSection}
            
            <p class="text-gray-700 mt-2">
              \${abstractText}
            </p>
            
            <div class="mt-3 flex gap-3">
              <a 
                href="\${getArxivUrl(paper.id)}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-sm text-blue-600 hover:underline"
              >
                arXiv Page
              </a>
              <a 
                href="\${getArxivPdfUrl(paper.id)}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-sm text-blue-600 hover:underline"
              >
                PDF
              </a>
            </div>
          </div>
        \`;
      }).join('');
    }
    
    function calculateTotalPages() {
      if (!appState.data) return 1;
      
      const { papers, safetyPapers } = appState.data;
      const papersToUse = appState.activeTab === 'all' ? papers : safetyPapers;
      
      // Apply filters
      const filteredPapers = papersToUse.filter(paper => {
        const searchMatch = appState.searchTerm === '' || 
          paper.title.toLowerCase().includes(appState.searchTerm.toLowerCase()) ||
          (paper.authors && paper.authors.some(author => author.toLowerCase().includes(appState.searchTerm.toLowerCase()))) ||
          (paper.abstract_snippet && paper.abstract_snippet.toLowerCase().includes(appState.searchTerm.toLowerCase()));
        
        const categoryMatch = !appState.selectedCategory || paper.categories.includes(appState.selectedCategory);
        
        const keywordMatch = !appState.selectedKeyword || 
          paper.title.toLowerCase().includes(appState.selectedKeyword.toLowerCase()) ||
          (paper.abstract_snippet && paper.abstract_snippet.toLowerCase().includes(appState.selectedKeyword.toLowerCase()));
        
        return searchMatch && categoryMatch && keywordMatch;
      });
      
      return Math.ceil(filteredPapers.length / appState.papersPerPage);
    }

    // Store data globally after loading
    async function loadAndInitialize() {
      try {
        // Load all data files
        const papers = await fetch('./data/papers.json').then(res => res.json());
        const counts = await fetch('./data/counts.json').then(res => res.json());
        const keywords = await fetch('./data/keywords.json').then(res => res.json());
        const safetyPapers = await fetch('./data/safety_papers.json').then(res => res.json());
        const metadata = await fetch('./data/metadata.json').then(res => res.json());
        
        // Load historical data
        let monthlyKeywords = {};
        let safetyTrends = { monthly_counts: {} };
        let historicalPapers = [];
        
        try {
          monthlyKeywords = await fetch('./data/monthly_keywords.json').then(res => res.json());
        } catch (e) {
          console.warn('Monthly keywords data not available');
        }
        
        try {
          safetyTrends = await fetch('./data/safety_trends.json').then(res => res.json());
        } catch (e) {
          console.warn('Safety trends data not available');
        }
        
        try {
          historicalPapers = await fetch('./data/historical_papers.json').then(res => res.json());
        } catch (e) {
          console.warn('Historical papers data not available');
        }
        
        // Store data in appState
        appState.data = { 
          papers, 
          counts, 
          keywords, 
          safetyPapers, 
          metadata,
          monthlyKeywords,
          safetyTrends,
          historicalPapers
        };
        
        // Render the dashboard
        renderDashboard(appState.data);
      } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('app').innerHTML = \`
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline">Failed to load dashboard data. Details: \${error.message}</span>
          </div>
        \`;
      }
    }

    // Start the application
    document.addEventListener('DOMContentLoaded', loadAndInitialize);
  </script>
</body>
</html>`;

// Ensure the output directory exists
const outDir = path.join(__dirname, '..', 'out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
  console.log('Created output directory');
}

// Write the template to the output directory
fs.writeFileSync(path.join(outDir, 'index.html'), htmlTemplate);
console.log('Created standalone index.html file');

// Create a _redirects file in the output directory
const redirectsContent = '/*    /index.html   200';
fs.writeFileSync(path.join(outDir, '_redirects'), redirectsContent);
console.log('Created _redirects file in output directory');

// Ensure data directory exists in output
const outDataDir = path.join(outDir, 'data');
if (!fs.existsSync(outDataDir)) {
  fs.mkdirSync(outDataDir, { recursive: true });
  console.log('Created data directory in output');
}

// Create manifest file to show what files have been processed
const manifestContent = JSON.stringify({
  buildTime: new Date().toISOString(),
  createdFiles: ['index.html', '_redirects'],
  features: ['historicalTrends', 'safetyKeywordTrends', 'monthlyCharts']
}, null, 2);

fs.writeFileSync(path.join(outDir, 'build-manifest.json'), manifestContent);
console.log('Created build manifest in output directory');

console.log('Static site creation completed');