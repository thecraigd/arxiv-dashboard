#!/usr/bin/env python3
"""
ArXiv AI Safety Trends Dashboard - Historical Data Fetcher

This script:
1. Fetches historical papers (last 6 months) from arXiv in AI-related categories
2. Processes them incrementally to avoid memory issues
3. Saves the data in a format compatible with the dashboard
"""

import os
import json
import datetime
import logging
import time
from collections import Counter, defaultdict
import calendar
import argparse

import arxiv
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('arxiv_historical')

# Download NLTK resources if needed
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

# Constants
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
CATEGORIES = [
    "cs.AI", "cs.LG", "cs.CV", "cs.CL", "cs.RO", "stat.ML"
]
BATCH_SIZE = 500  # Number of papers to process in one batch
RESULTS_PER_QUERY = 100  # Maximum results per API query
MONTHS_TO_FETCH = 6  # How many months of data to fetch

# AI Safety keywords (case insensitive) - same as update_data.py
SAFETY_TERMS = [
    "alignment", "misalignment", "value alignment", "AI alignment", "aligned AI",
    "interpretability", "explainability", "transparency",
    "existential risk", "x-risk", "catastrophic risk",
    "safety", "AI safety", "safe AI", "robust AI",
    "control problem", "AI control", "corrigibility",
    "specification gaming", "reward hacking", "value learning",
    "outer alignment", "inner alignment", 
    "adversarial", "adversarial attack", "adversarial example",
    "ethics", "ethical AI", "responsible AI",
    "goal misgeneralization", "distributional shift",
    "AI governance", "AI policy",
    "superintelligence", "AGI safety"
]

def ensure_output_dir():
    """Ensure output directory exists"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    logger.info(f"Output directory: {OUTPUT_DIR}")

def get_month_ranges(months=MONTHS_TO_FETCH):
    """Generate monthly date ranges for querying arXiv"""
    today = datetime.datetime.now()
    current_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    ranges = []
    for i in range(months):
        # Calculate the first day of the current month
        month_start = current_month.replace(day=1)
        
        # Calculate the last day of the current month
        _, last_day = calendar.monthrange(month_start.year, month_start.month)
        month_end = month_start.replace(day=last_day, hour=23, minute=59, second=59)
        
        # Format dates for arXiv query
        date_from = month_start.strftime("%Y%m%d")
        date_to = month_end.strftime("%Y%m%d")
        
        # Add to ranges
        ranges.append((date_from, date_to, month_start.strftime("%Y-%m")))
        
        # Move to previous month
        if month_start.month == 1:
            current_month = current_month.replace(year=month_start.year-1, month=12)
        else:
            current_month = current_month.replace(month=month_start.month-1)
    
    return ranges

def fetch_papers_for_month(date_from, date_to, month_label):
    """Fetch papers for a specific month"""
    logger.info(f"Fetching papers for {month_label} ({date_from} to {date_to})")
    
    # Construct category query string
    cat_query = " OR ".join(f"cat:{cat}" for cat in CATEGORIES)
    
    # Build query
    query = f"({cat_query}) AND submittedDate:[{date_from}000000 TO {date_to}235959]"
    logger.info(f"Query: {query}")
    
    # Initialize client with appropriate parameters
    client = arxiv.Client(
        page_size=RESULTS_PER_QUERY,
        delay_seconds=3,  # Be respectful of arXiv's servers
        num_retries=5
    )
    
    # Create search
    search = arxiv.Search(
        query=query,
        max_results=2000,  # Higher limit for historical data
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending
    )
    
    # Fetch results
    papers = []
    try:
        # Use a generator to avoid loading everything into memory at once
        results_gen = client.results(search)
        
        batch_count = 0
        batch = []
        
        for paper in results_gen:
            # Process paper
            paper_data = process_paper(paper)
            
            # Add to batch
            batch.append(paper_data)
            
            # If batch is full, yield it and start a new one
            if len(batch) >= BATCH_SIZE:
                batch_count += 1
                logger.info(f"Completed batch {batch_count} ({len(batch)} papers)")
                papers.extend(batch)
                batch = []
        
        # Add any remaining papers
        if batch:
            papers.extend(batch)
            logger.info(f"Completed final batch with {len(batch)} papers")
            
        logger.info(f"Fetched total of {len(papers)} papers for {month_label}")
        
    except Exception as e:
        logger.error(f"Error fetching papers: {e}")
    
    return papers

def process_paper(paper):
    """Process a single paper"""
    try:
        # Handle categories (could be a list or a string depending on arxiv package version)
        if isinstance(paper.categories, list):
            categories = paper.categories
        else:
            categories = [cat.strip() for cat in paper.categories.split()]
        
        # Extract authors
        authors = [author.name for author in paper.authors]
        
        # Check for safety terms in title and abstract
        title_lower = paper.title.lower()
        abstract_lower = paper.summary.lower()
        
        safety_keywords_found = []
        for term in SAFETY_TERMS:
            if (term.lower() in title_lower) or (term.lower() in abstract_lower):
                safety_keywords_found.append(term)
        
        # Process primary category
        if isinstance(paper.primary_category, str):
            primary_cat = paper.primary_category
        else:
            # Try to get a string representation or use the first category
            try:
                primary_cat = str(paper.primary_category)
            except:
                primary_cat = categories[0] if categories else "unknown"
        
        # Format paper data
        paper_data = {
            "id": paper.entry_id.split('/')[-1],
            "title": paper.title,
            "authors": authors,
            "abstract": paper.summary,
            "categories": categories,
            "primary_category": primary_cat,
            "submitted_date": paper.published.strftime("%Y-%m-%d"),
            "last_updated": paper.updated.strftime("%Y-%m-%d"),
            "safety_keywords_found": safety_keywords_found,
            "is_safety_paper": len(safety_keywords_found) > 0,
            "month": paper.published.strftime("%Y-%m")
        }
        
        return paper_data
    except Exception as e:
        logger.error(f"Error processing paper: {e}")
        # Return minimal data to avoid breaking the pipeline
        return {
            "id": "unknown",
            "title": "Error processing paper",
            "authors": [],
            "abstract": "",
            "categories": [],
            "primary_category": "unknown",
            "submitted_date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "last_updated": datetime.datetime.now().strftime("%Y-%m-%d"),
            "safety_keywords_found": [],
            "is_safety_paper": False,
            "month": datetime.datetime.now().strftime("%Y-%m")
        }

def preprocess_abstract(abstract):
    """Preprocess abstract text for NLP analysis"""
    # Tokenize
    tokens = word_tokenize(abstract.lower())
    
    # Remove stopwords and punctuation
    stop_words = set(stopwords.words('english'))
    tokens = [word for word in tokens if word.isalpha() and word not in stop_words and len(word) > 2]
    
    # Stemming
    stemmer = PorterStemmer()
    stemmed_tokens = [stemmer.stem(word) for word in tokens]
    
    return tokens, stemmed_tokens

def calculate_monthly_stats(papers):
    """Calculate monthly statistics from papers"""
    logger.info("Calculating monthly statistics")
    
    # Initialize counters
    monthly_counts = defaultdict(lambda: defaultdict(int))
    monthly_safety_counts = defaultdict(int)
    monthly_tokens = defaultdict(list)
    monthly_safety_papers = defaultdict(list)
    
    # Process each paper
    for paper in papers:
        month = paper.get("month", "unknown")
        primary_category = paper.get("primary_category", "unknown")
        
        # Update monthly category counts
        monthly_counts[month][primary_category] += 1
        
        # Track safety papers
        if paper.get("is_safety_paper", False):
            monthly_safety_counts[month] += 1
            monthly_safety_papers[month].append(paper)
        
        # Process abstract for tokens
        abstract = paper.get("abstract", "")
        if abstract:
            tokens, _ = preprocess_abstract(abstract)
            monthly_tokens[month].extend(tokens)
    
    # Calculate keyword frequencies for each month
    monthly_keywords = {}
    for month, tokens in monthly_tokens.items():
        counter = Counter(tokens)
        monthly_keywords[month] = [{"text": term, "value": count} 
                                   for term, count in counter.most_common(100)]
    
    return {
        "monthly_counts": dict(monthly_counts),
        "monthly_safety_counts": dict(monthly_safety_counts),
        "monthly_keywords": monthly_keywords,
        "monthly_safety_papers": {k: v for k, v in monthly_safety_papers.items()}
    }

def merge_current_data(historical_data):
    """Merge historical data with current data files if they exist"""
    logger.info("Merging with current data")
    
    # Current data files
    counts_file = os.path.join(OUTPUT_DIR, "counts.json")
    keywords_file = os.path.join(OUTPUT_DIR, "keywords.json")
    papers_file = os.path.join(OUTPUT_DIR, "papers.json")
    safety_papers_file = os.path.join(OUTPUT_DIR, "safety_papers.json")
    
    # Load and merge counts data
    current_counts = {}
    if os.path.exists(counts_file):
        with open(counts_file, 'r', encoding='utf-8') as f:
            current_counts = json.load(f)
    
    # Update existing data with historical monthly data
    if "monthly" not in current_counts:
        current_counts["monthly"] = {}
    
    # Add monthly data
    current_counts["monthly"].update(historical_data["monthly_counts"])
    
    # Write updated counts
    with open(counts_file, 'w', encoding='utf-8') as f:
        json.dump(current_counts, f, ensure_ascii=False, indent=2)
    logger.info(f"Updated {counts_file} with monthly data")
    
    # Create historical keyword files
    keywords_by_month_file = os.path.join(OUTPUT_DIR, "monthly_keywords.json")
    with open(keywords_by_month_file, 'w', encoding='utf-8') as f:
        json.dump(historical_data["monthly_keywords"], f, ensure_ascii=False, indent=2)
    logger.info(f"Created {keywords_by_month_file}")
    
    # Create safety trends file
    safety_trends_file = os.path.join(OUTPUT_DIR, "safety_trends.json")
    with open(safety_trends_file, 'w', encoding='utf-8') as f:
        json.dump({
            "monthly_counts": historical_data["monthly_safety_counts"]
        }, f, ensure_ascii=False, indent=2)
    logger.info(f"Created {safety_trends_file}")
    
    # Create historical papers file
    historical_papers_file = os.path.join(OUTPUT_DIR, "historical_papers.json")
    with open(historical_papers_file, 'w', encoding='utf-8') as f:
        # Get papers by month as an array
        papers_by_month = []
        for month_data in historical_data["all_papers_by_month"].values():
            # Simplify papers for storage
            simplified_papers = []
            for paper in month_data:
                paper_copy = paper.copy()
                abstract = paper_copy.get("abstract", "")
                paper_copy["abstract_snippet"] = abstract[:200] + "..." if len(abstract) > 200 else abstract
                paper_copy["abstract"] = None  # Remove full abstract
                simplified_papers.append(paper_copy)
            papers_by_month.extend(simplified_papers)
            
        json.dump(papers_by_month, f, ensure_ascii=False, indent=2)
    logger.info(f"Created {historical_papers_file}")
    
    # Create historical safety papers file
    historical_safety_file = os.path.join(OUTPUT_DIR, "historical_safety_papers.json")
    with open(historical_safety_file, 'w', encoding='utf-8') as f:
        # Get safety papers by month as an array
        safety_papers_by_month = []
        for month_data in historical_data["monthly_safety_papers"].values():
            # Simplify papers for storage
            simplified_papers = []
            for paper in month_data:
                paper_copy = paper.copy()
                abstract = paper_copy.get("abstract", "")
                paper_copy["abstract_snippet"] = abstract[:200] + "..." if len(abstract) > 200 else abstract
                paper_copy["abstract"] = None  # Remove full abstract
                simplified_papers.append(paper_copy)
            safety_papers_by_month.extend(simplified_papers)
            
        json.dump(safety_papers_by_month, f, ensure_ascii=False, indent=2)
    logger.info(f"Created {historical_safety_file}")

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='Fetch historical data from arXiv')
    parser.add_argument('--months', type=int, default=MONTHS_TO_FETCH,
                        help=f'Number of months to fetch (default: {MONTHS_TO_FETCH})')
    args = parser.parse_args()
    
    logger.info(f"Starting arXiv AI Safety Trends Dashboard historical data fetch for the last {args.months} months")
    
    # Ensure output directory exists
    ensure_output_dir()
    
    # Get month ranges
    month_ranges = get_month_ranges(args.months)
    
    # Initialize data structures for all months
    all_papers = []
    all_papers_by_month = {}
    
    # Fetch data for each month
    for date_from, date_to, month_label in month_ranges:
        monthly_papers = fetch_papers_for_month(date_from, date_to, month_label)
        all_papers.extend(monthly_papers)
        all_papers_by_month[month_label] = monthly_papers
        
        # Sleep between months to avoid overloading the API
        if month_label != month_ranges[-1][2]:  # Skip sleep after last month
            logger.info(f"Sleeping for 5 seconds before fetching next month...")
            time.sleep(5)
    
    # Calculate statistics for all months
    historical_data = calculate_monthly_stats(all_papers)
    historical_data["all_papers_by_month"] = all_papers_by_month
    
    # Merge with current data
    merge_current_data(historical_data)
    
    logger.info(f"Historical data fetch completed successfully")
    logger.info(f"Total papers fetched: {len(all_papers)}")
    logger.info(f"Total safety papers: {sum(len(papers) for papers in historical_data['monthly_safety_papers'].values())}")

if __name__ == "__main__":
    main()