// Script to create a fully working standalone HTML file
// This is a backup approach if all other approaches fail
const fs = require('fs');
const path = require('path');

// First run the normal prepare-build script
require('./prepare-build');

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
        
        // Initialize the dashboard
        renderDashboard({papers, counts, keywords, safetyPapers, metadata});
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
      const { papers, counts, keywords, safetyPapers, metadata } = data;
      
      // Start with metrics
      const metricsHtml = renderMetrics(metadata);
      
      // Prepare chart for categories
      const chartHtml = renderCategoryChart(counts);
      
      // Word cloud
      const wordCloudHtml = renderWordCloud(keywords);
      
      // Tabs for papers
      const tabsAndPapersHtml = renderPapersTabs(papers, safetyPapers);
      
      // Combine all sections
      document.getElementById('app').innerHTML = \`
        \${metricsHtml}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          \${chartHtml}
          \${wordCloudHtml}
        </div>
        \${tabsAndPapersHtml}
      \`;
      
      // Initialize chart after DOM is ready
      initializeChart(counts);
      
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

    // Initialize the chart
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
      window.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: days.map(day => new Date(day).toLocaleDateString()),
          datasets,
        },
        options: {
          plugins: {
            legend: {
              position: 'bottom',
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
      if (!window.chart || !appState.data) return;
      
      const { counts } = appState.data;
      
      if (mode === 'daily') {
        // Update button styles
        document.getElementById('daily-btn').className = 'px-3 py-1 rounded text-sm bg-blue-600 text-white';
        document.getElementById('weekly-btn').className = 'px-3 py-1 rounded text-sm bg-gray-200 text-gray-800';
        
        // Update chart data
        const days = getRecentDays(counts, 7);
        const categories = getCategories(counts);
        
        window.chart.data.labels = days.map(day => new Date(day).toLocaleDateString());
        window.chart.data.datasets = categories.map((category, index) => {
          const hue = (index * 137) % 360;
          return {
            label: category,
            data: days.map(day => counts.daily[day]?.[category] || 0),
            backgroundColor: \`hsla(\${hue}, 70%, 60%, 0.7)\`,
            borderColor: \`hsla(\${hue}, 70%, 50%, 1)\`,
            borderWidth: 1,
          };
        });
        
        window.chart.options.plugins.title.text = 'Daily Papers by Category';
        window.chart.update();
        
      } else if (mode === 'weekly') {
        // Update button styles
        document.getElementById('daily-btn').className = 'px-3 py-1 rounded text-sm bg-gray-200 text-gray-800';
        document.getElementById('weekly-btn').className = 'px-3 py-1 rounded text-sm bg-blue-600 text-white';
        
        // Update chart data
        const weeks = Object.keys(counts.weekly || {})
          .sort((a, b) => b.localeCompare(a))
          .slice(0, 8);
          
        const categories = getCategories(counts);
        
        window.chart.data.labels = weeks.map(week => week.replace('W', ' Week '));
        window.chart.data.datasets = categories.map((category, index) => {
          const hue = (index * 137) % 360;
          return {
            label: category,
            data: weeks.map(week => counts.weekly[week]?.[category] || 0),
            backgroundColor: \`hsla(\${hue}, 70%, 60%, 0.7)\`,
            borderColor: \`hsla(\${hue}, 70%, 50%, 1)\`,
            borderWidth: 1,
          };
        });
        
        window.chart.options.plugins.title.text = 'Weekly Papers by Category';
        window.chart.update();
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
        // Load data 
        const papers = await fetch('./data/papers.json').then(res => res.json());
        const counts = await fetch('./data/counts.json').then(res => res.json());
        const keywords = await fetch('./data/keywords.json').then(res => res.json());
        const safetyPapers = await fetch('./data/safety_papers.json').then(res => res.json());
        const metadata = await fetch('./data/metadata.json').then(res => res.json());
        
        // Store data in appState
        appState.data = { papers, counts, keywords, safetyPapers, metadata };
        
        // Render the dashboard
        renderDashboard(appState.data);
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

    // Start the application
    document.addEventListener('DOMContentLoaded', loadAndInitialize);
  </script>
</body>
</html>`;

// Write the template to the output directory
fs.writeFileSync(path.join(__dirname, '..', 'out', 'index.html'), htmlTemplate);
console.log('Created standalone index.html file');

// Also copy the _redirects file to ensure it's properly included
fs.copyFileSync(
  path.join(__dirname, '..', 'public', '_redirects'),
  path.join(__dirname, '..', 'out', '_redirects')
);
console.log('Copied _redirects file to output directory');

console.log('Static site creation completed');