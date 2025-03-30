import { Paper, CountsData, KeywordData, Metadata } from './types';

// Helper function to load data from the JSON files
export async function loadData() {
  try {
    // In a production environment with Next.js, you would fetch these from 
    // your data directory during the build process or via API routes
    
    // Use direct path for more reliable imports
    const papers: Paper[] = await fetch('/data/papers.json').then(res => res.json());
    const counts: CountsData = await fetch('/data/counts.json').then(res => res.json());
    const keywords: KeywordData[] = await fetch('/data/keywords.json').then(res => res.json());
    const safetyPapers: Paper[] = await fetch('/data/safety_papers.json').then(res => res.json());
    const metadata: Metadata = await fetch('/data/metadata.json').then(res => res.json());
    
    return {
      papers,
      counts,
      keywords,
      safetyPapers,
      metadata
    };
  } catch (error) {
    console.error('Failed to load data:', error);
    // Return empty data structures as fallback
    return {
      papers: [],
      counts: { daily: {}, weekly: {} },
      keywords: [],
      safetyPapers: [],
      metadata: {
        last_updated: 'N/A',
        total_papers: 0,
        safety_papers_count: 0,
        categories: [],
        safety_terms: []
      }
    };
  }
}

// Helper to format arXiv ID as a URL
export function getArxivUrl(id: string): string {
  // Remove version number if present (e.g., v1, v2)
  const baseId = id.split('v')[0];
  return `https://arxiv.org/abs/${baseId}`;
}

// Helper to format arXiv ID as a PDF URL
export function getArxivPdfUrl(id: string): string {
  // Remove version number if present (e.g., v1, v2)
  const baseId = id.split('v')[0];
  return `https://arxiv.org/pdf/${baseId}.pdf`;
}

// Helper to get the most recent days from counts data
export function getRecentDays(counts: CountsData, days: number = 7): string[] {
  if (!counts || !counts.daily) return [];
  
  return Object.keys(counts.daily)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, days);
}

// Helper to get categories from counts data
export function getCategories(counts: CountsData): string[] {
  if (!counts || !counts.daily) return [];
  
  // Get all unique categories across all days
  const categories = new Set<string>();
  Object.values(counts.daily).forEach(day => {
    Object.keys(day).forEach(category => {
      categories.add(category);
    });
  });
  
  return Array.from(categories);
}