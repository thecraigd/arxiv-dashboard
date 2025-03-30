#!/usr/bin/env python3
"""
Helper script to copy data files from the data directory to the frontend public directory.
Run this after update_data.py has generated new data files.
"""

import os
import shutil
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('copy_data')

# Constants
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(REPO_ROOT, "data")
FRONTEND_DATA_DIR = os.path.join(REPO_ROOT, "frontend", "public", "data")

def main():
    """Main execution function"""
    logger.info(f"Copying data from {DATA_DIR} to {FRONTEND_DATA_DIR}")
    
    # Ensure frontend data directory exists
    os.makedirs(FRONTEND_DATA_DIR, exist_ok=True)
    
    # Get list of JSON files in data directory
    data_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.json')]
    
    if not data_files:
        logger.warning("No JSON files found in data directory")
        return
    
    # Copy each file
    for filename in data_files:
        src_path = os.path.join(DATA_DIR, filename)
        dst_path = os.path.join(FRONTEND_DATA_DIR, filename)
        
        try:
            shutil.copy2(src_path, dst_path)
            logger.info(f"Copied {filename} to frontend")
        except Exception as e:
            logger.error(f"Error copying {filename}: {e}")
    
    logger.info("Data copy completed successfully")

if __name__ == "__main__":
    main()