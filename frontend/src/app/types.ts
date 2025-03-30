export interface Paper {
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
}