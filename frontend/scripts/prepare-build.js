// Prepare build script for Netlify
const fs = require('fs');
const path = require('path');

// Function to create directory if it doesn't exist
function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to copy a file with error handling
function copyFileWithFallback(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${path.basename(src)} to ${path.dirname(dest)}`);
  } catch (error) {
    console.warn(`Warning: Could not copy ${src} to ${dest}: ${error.message}`);
  }
}

// First, copy data files
const dataDir = path.join(__dirname, '..', '..', 'data');
const publicDataDir = path.join(__dirname, '..', 'public', 'data');

// Ensure public/data directory exists
ensureDirExists(publicDataDir);

// Copy data files if they exist
if (fs.existsSync(dataDir)) {
  const files = fs.readdirSync(dataDir);
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const sourcePath = path.join(dataDir, file);
      const destPath = path.join(publicDataDir, file);
      copyFileWithFallback(sourcePath, destPath);
    }
  });
} else {
  console.warn('Data directory not found:', dataDir);
}

// Now let's skip the lib file copying since it's not working on Netlify
// Instead, let's create the files directly

// Setup paths for directories
const srcDir = path.join(__dirname, '..', 'src');
const componentsDir = path.join(srcDir, 'components');
const appDir = path.join(srcDir, 'app');

// Ensure directories exist
ensureDirExists(srcDir);
ensureDirExists(componentsDir); 
ensureDirExists(appDir);

// Create types.ts in components directory
const typesContent = `export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  abstract_snippet?: string;
  categories: string[];
  primary_category: string;
  submitted_date: string;
  last_updated: string;
  safety_keywords_found: string[];
  is_safety_paper: boolean;
}

export interface CountsData {
  daily: {
    [date: string]: {
      [category: string]: number;
    };
  };
  weekly: {
    [week: string]: {
      [category: string]: number;
    };
  };
}

export interface KeywordData {
  text: string;
  value: number;
}

export interface Metadata {
  last_updated: string;
  total_papers: number;
  safety_papers_count: number;
  categories: string[];
  safety_terms: string[];
}`;

// Create data.ts in components directory
const dataContent = `import { Paper, CountsData, KeywordData, Metadata } from './types';

// Helper function to load data from the JSON files
export async function loadData() {
  try {
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
  return \`https://arxiv.org/abs/\${baseId}\`;
}

// Helper to format arXiv ID as a PDF URL
export function getArxivPdfUrl(id: string): string {
  // Remove version number if present (e.g., v1, v2)
  const baseId = id.split('v')[0];
  return \`https://arxiv.org/pdf/\${baseId}.pdf\`;
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
}`;

// Write files to both components and app directories
try {
  fs.writeFileSync(path.join(componentsDir, 'types.ts'), typesContent);
  console.log('Created types.ts in components directory');
  
  fs.writeFileSync(path.join(componentsDir, 'data.ts'), dataContent);
  console.log('Created data.ts in components directory');
  
  fs.writeFileSync(path.join(appDir, 'types.ts'), typesContent);
  console.log('Created types.ts in app directory');
  
  fs.writeFileSync(path.join(appDir, 'data.ts'), dataContent);
  console.log('Created data.ts in app directory');
} catch (error) {
  console.error('Error creating TypeScript files:', error);
}

console.log('Build preparation completed');