#!/usr/bin/env python3
"""
ArXiv AI Safety Trends Dashboard - Data Fetcher and Processor

This script:
1. Fetches recent papers from arXiv in AI-related categories
2. Identifies papers mentioning AI safety keywords
3. Processes abstracts for NLP analysis
4. Generates data files for the dashboard frontend
"""

import os
import json
import datetime
import logging
import time
from collections import Counter, defaultdict

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
logger = logging.getLogger('arxiv_dashboard')

# Download NLTK resources if needed
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
try:
    nltk.data.find('tokenizers/punkt_tab/english')
except LookupError:
    nltk.download('punkt_tab', quiet=True)

# Constants
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
CATEGORIES = [
    "cs.AI", "cs.LG", "cs.CV", "cs.CL", "cs.RO", "stat.ML"
]
MAX_RESULTS = 1000  # Adjust based on API limitations and needs
DAYS_TO_FETCH = 7  # How many days back to fetch papers

# AI Safety keywords (case insensitive)
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

def get_date_range():
    """Generate date range for querying arXiv"""
    today = datetime.datetime.now()
    days_ago = today - datetime.timedelta(days=DAYS_TO_FETCH)
    
    # Format for arXiv query
    date_from = days_ago.strftime("%Y%m%d")
    date_to = today.strftime("%Y%m%d")
    
    return date_from, date_to

def fetch_papers():
    """Fetch papers from arXiv API"""
    logger.info(f"Fetching papers from {', '.join(CATEGORIES)} categories for the last {DAYS_TO_FETCH} days")
    
    # Construct category query string
    cat_query = " OR ".join(f"cat:{cat}" for cat in CATEGORIES)
    
    # Get date range
    date_from, date_to = get_date_range()
    
    # Build query
    query = f"({cat_query}) AND submittedDate:[{date_from}000000 TO {date_to}235959]"
    logger.info(f"Query: {query}")
    
    # Initialize client with appropriate parameters
    client = arxiv.Client(
        page_size=100,
        delay_seconds=3,  # Be respectful of arXiv's servers
        num_retries=5
    )
    
    # Create search
    search = arxiv.Search(
        query=query,
        max_results=MAX_RESULTS,
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending
    )
    
    # Fetch results
    papers = []
    try:
        results = list(client.results(search))
        logger.info(f"Fetched {len(results)} papers")
        
        # Log a sample paper structure for debugging
        if results:
            sample_paper = results[0]
            logger.info(f"Sample paper structure:")
            logger.info(f"  Title: {sample_paper.title}")
            logger.info(f"  Authors: {sample_paper.authors}")
            logger.info(f"  Categories type: {type(sample_paper.categories)}")
            logger.info(f"  Categories: {sample_paper.categories}")
            logger.info(f"  Primary category: {sample_paper.primary_category}")
        
        # Process each paper
        for paper in results:
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
                "is_safety_paper": len(safety_keywords_found) > 0
            }
            
            papers.append(paper_data)
            
    except Exception as e:
        logger.error(f"Error fetching papers: {e}")
        
    return papers

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

def process_papers(papers):
    """Process papers for NLP analysis and aggregation"""
    logger.info("Processing papers for NLP analysis")
    
    # Initialize counters and containers
    daily_counts = defaultdict(lambda: defaultdict(int))
    weekly_counts = defaultdict(lambda: defaultdict(int))
    all_abstracts = []
    all_tokens = []
    safety_papers = []
    
    # Process each paper
    for paper in papers:
        # Store safety papers separately
        if paper["is_safety_paper"]:
            safety_papers.append(paper)
        
        # Update daily counts
        date = paper["submitted_date"]
        primary_category = paper["primary_category"]
        # Ensure primary_category is a string, not a list or other object
        if primary_category and isinstance(primary_category, str):
            daily_counts[date][primary_category] += 1
        elif primary_category:
            # If it's a complex object, try to get a string representation
            try:
                primary_cat_str = str(primary_category)
                daily_counts[date][primary_cat_str] += 1
            except:
                # Fallback to first category if available
                if paper["categories"] and len(paper["categories"]) > 0:
                    daily_counts[date][paper["categories"][0]] += 1
        
        # Update weekly counts (using ISO week format)
        date_obj = datetime.datetime.strptime(date, "%Y-%m-%d")
        year, week, _ = date_obj.isocalendar()
        week_key = f"{year}-W{week:02d}"
        
        # Use the same category handling as for daily counts
        if primary_category and isinstance(primary_category, str):
            weekly_counts[week_key][primary_category] += 1
        elif primary_category:
            try:
                primary_cat_str = str(primary_category)
                weekly_counts[week_key][primary_cat_str] += 1
            except:
                if paper["categories"] and len(paper["categories"]) > 0:
                    weekly_counts[week_key][paper["categories"][0]] += 1
        
        # Process abstract for NLP
        abstract = paper["abstract"]
        tokens, stemmed_tokens = preprocess_abstract(abstract)
        
        # Store for later aggregation
        all_abstracts.append(abstract)
        all_tokens.extend(tokens)
    
    # Generate keyword data using TF-IDF for better results
    logger.info("Generating keyword data using TF-IDF")
    keywords_data = generate_keywords(all_abstracts)
    
    # Simple token frequency for comparison
    token_counter = Counter(all_tokens)
    most_common_tokens = token_counter.most_common(100)
    simple_keywords = [{"text": token, "value": count} for token, count in most_common_tokens]
    
    return {
        "daily_counts": dict(daily_counts),
        "weekly_counts": dict(weekly_counts),
        "keywords": keywords_data,
        "simple_keywords": simple_keywords,
        "safety_papers": safety_papers,
        "total_papers": len(papers),
        "safety_papers_count": len(safety_papers)
    }

def generate_keywords(abstracts):
    """Generate keywords using TF-IDF vectorization"""
    if not abstracts:
        return []
        
    # Use TF-IDF to find important terms
    vectorizer = TfidfVectorizer(
        max_features=100,
        stop_words='english',
        ngram_range=(1, 2)  # Include bigrams
    )
    
    try:
        tfidf_matrix = vectorizer.fit_transform(abstracts)
        feature_names = vectorizer.get_feature_names_out()
        
        # Sum TF-IDF scores across documents
        tfidf_scores = tfidf_matrix.sum(axis=0).A1
        
        # Sort terms by score
        sorted_indices = tfidf_scores.argsort()[::-1]
        top_indices = sorted_indices[:100]  # Top 100 terms
        
        # Create keyword data for word cloud
        keywords_data = []
        for idx in top_indices:
            term = feature_names[idx]
            score = tfidf_scores[idx]
            # Scale score for word cloud (arbitrary scaling for visual appeal)
            visual_score = int(score * 100)
            keywords_data.append({"text": term, "value": visual_score})
        
        return keywords_data
    except Exception as e:
        logger.error(f"Error generating keywords: {e}")
        return []

def save_data_files(data, papers):
    """Save processed data to JSON files for frontend"""
    logger.info("Saving processed data to JSON files")
    
    # Save all papers (excluding abstracts to reduce file size)
    papers_simplified = []
    for paper in papers:
        paper_copy = paper.copy()
        # Replace full abstract with snippet for list view
        abstract = paper_copy["abstract"]
        paper_copy["abstract_snippet"] = abstract[:200] + "..." if len(abstract) > 200 else abstract
        paper_copy["abstract"] = None  # Remove full abstract
        papers_simplified.append(paper_copy)
    
    # Create mapping for file paths
    file_mapping = {
        "papers.json": papers_simplified,
        "counts.json": {
            "daily": data["daily_counts"],
            "weekly": data["weekly_counts"]
        },
        "keywords.json": data["keywords"],
        "safety_papers.json": data["safety_papers"],
        "metadata.json": {
            "last_updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_papers": data["total_papers"],
            "safety_papers_count": data["safety_papers_count"],
            "categories": CATEGORIES,
            "safety_terms": SAFETY_TERMS
        }
    }
    
    # Save each file
    for filename, content in file_mapping.items():
        output_path = os.path.join(OUTPUT_DIR, filename)
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(content, f, ensure_ascii=False, indent=2)
            logger.info(f"Saved {filename}")
        except Exception as e:
            logger.error(f"Error saving {filename}: {e}")

def main():
    """Main execution function"""
    logger.info("Starting arXiv AI Safety Trends Dashboard data update")
    
    # Ensure output directory exists
    ensure_output_dir()
    
    # Fetch papers from arXiv
    papers = fetch_papers()
    
    if not papers:
        logger.error("No papers fetched. Exiting.")
        return
    
    # Process papers for analysis
    processed_data = process_papers(papers)
    
    # Save data files for frontend
    save_data_files(processed_data, papers)
    
    logger.info("Data update completed successfully")

if __name__ == "__main__":
    main()