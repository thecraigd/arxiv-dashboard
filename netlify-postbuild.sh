#!/bin/bash
# Post-build script to ensure data files are copied

echo "Running post-build script to copy data files..."

# Create data directory in the published folder if it doesn't exist
mkdir -p frontend/out/data

# Copy data files from the data directory to the published folder
echo "Copying data files from data/ to frontend/out/data/"
cp -rv data/* frontend/out/data/

echo "Data files copied successfully."
exit 0