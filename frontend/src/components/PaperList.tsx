'use client';

import { useState, useMemo } from 'react';
import { Paper } from '../lib/types';
import { getArxivUrl, getArxivPdfUrl } from '../lib/data';

interface PaperListProps {
  papers: Paper[];
  title?: string;
  selectedCategory?: string;
  selectedKeyword?: string;
}

export default function PaperList({ 
  papers, 
  title = 'Recent Papers', 
  selectedCategory,
  selectedKeyword
}: PaperListProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const papersPerPage = 10;
  
  // Filter papers based on search, category and keyword
  const filteredPapers = useMemo(() => {
    return papers.filter(paper => {
      const searchMatch = search === '' || 
        paper.title.toLowerCase().includes(search.toLowerCase()) ||
        paper.authors.some(author => author.toLowerCase().includes(search.toLowerCase())) ||
        ((paper.abstract_snippet || paper.abstract) && 
         ((paper.abstract_snippet && paper.abstract_snippet.toLowerCase().includes(search.toLowerCase())) ||
          (paper.abstract && paper.abstract.toLowerCase().includes(search.toLowerCase()))));
      
      const categoryMatch = !selectedCategory || paper.categories.includes(selectedCategory);
      
      const keywordMatch = !selectedKeyword || 
        paper.title.toLowerCase().includes(selectedKeyword.toLowerCase()) ||
        ((paper.abstract_snippet && paper.abstract_snippet.toLowerCase().includes(selectedKeyword.toLowerCase())) ||
         (paper.abstract && paper.abstract.toLowerCase().includes(selectedKeyword.toLowerCase())));
      
      return searchMatch && categoryMatch && keywordMatch;
    });
  }, [papers, search, selectedCategory, selectedKeyword]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredPapers.length / papersPerPage);
  const currentPapers = filteredPapers.slice(
    (currentPage - 1) * papersPerPage,
    currentPage * papersPerPage
  );
  
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {title}
          {(selectedCategory || selectedKeyword) && (
            <span className="font-normal text-base ml-2">
              {selectedCategory && `| Category: ${selectedCategory}`}
              {selectedKeyword && `| Keyword: ${selectedKeyword}`}
            </span>
          )}
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search papers..."
            className="px-4 py-2 border rounded-lg w-64"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
      </div>
      
      {filteredPapers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No papers found matching your criteria.
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {currentPapers.map((paper) => (
              <div key={paper.id} className="border-b pb-5">
                <h3 className="text-lg font-medium">
                  <a 
                    href={getArxivUrl(paper.id)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-700 hover:underline"
                  >
                    {paper.title}
                  </a>
                </h3>
                <div className="text-sm text-gray-600 mt-1">
                  {paper.authors.join(', ')}
                </div>
                <div className="flex gap-2 mt-2">
                  {paper.categories.map(cat => (
                    <span 
                      key={cat} 
                      className={`text-xs px-2 py-1 rounded ${
                        cat === selectedCategory 
                          ? 'bg-primary-100 text-primary-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {cat}
                    </span>
                  ))}
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                    {paper.submitted_date}
                  </span>
                </div>
                
                {paper.safety_keywords_found.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Safety keywords: {paper.safety_keywords_found.join(', ')}
                    </span>
                  </div>
                )}
                
                <p className="text-gray-700 mt-2">
                  {paper.abstract_snippet || 
                   (paper.abstract ? (paper.abstract.length > 200 ? 
                                      paper.abstract.substring(0, 200) + '...' : 
                                      paper.abstract) : 
                    'No abstract available')}
                </p>
                
                <div className="mt-3 flex gap-3">
                  <a 
                    href={getArxivUrl(paper.id)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:underline"
                  >
                    arXiv Page
                  </a>
                  <a 
                    href={getArxivPdfUrl(paper.id)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:underline"
                  >
                    PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="px-4 py-1">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}