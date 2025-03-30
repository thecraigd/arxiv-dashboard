#!/bin/bash
# Custom build script specifically for Netlify

# First try to build with Next.js
echo "Attempting to build with Next.js..."
node scripts/prepare-build.js

if [ $? -ne 0 ]; then
  echo "Prepare build script failed, creating static HTML site instead..."
  node scripts/create-static.js
  exit 0
fi

next build

if [ $? -ne 0 ]; then
  echo "Next.js build failed, creating static HTML site instead..."
  node scripts/create-static.js
  exit 0
fi

# Ensure data directory exists in output
mkdir -p out/data

# Copy data files to the output directory
echo "Copying data files to output directory..."
cp -r public/data/* out/data/

echo "Build successful!"
exit 0