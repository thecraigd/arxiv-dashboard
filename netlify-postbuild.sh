#!/bin/bash
# Post-build script to ensure data files are copied

echo "Running post-build script to copy data files..."

# Create data directory in the published folder if it doesn't exist
mkdir -p frontend/out/data

# First, ensure we preserve the frontend/public/data files which have been copied to out/data
echo "Backing up frontend public data files..."
mkdir -p frontend/out/data_backup
cp -rv frontend/out/data/* frontend/out/data_backup/ 2>/dev/null || true

# Copy data files from the data directory to the published folder
echo "Copying data files from data/ to frontend/out/data/"
cp -rv data/* frontend/out/data/

# Restore the important files from frontend/public/data that might have been overwritten
echo "Restoring frontend public data files that have safety terms..."
cp -v frontend/public/data/monthly_keywords.json frontend/out/data/ 2>/dev/null || true

# Also restore from backup if available
echo "Restoring any additional files from backup..."
cp -rv frontend/out/data_backup/* frontend/out/data/ 2>/dev/null || true

echo "Data files copied successfully."
exit 0