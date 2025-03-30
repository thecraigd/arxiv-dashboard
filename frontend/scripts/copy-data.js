// Simple script to copy data before build
const fs = require('fs');
const path = require('path');

// Define directories
const dataDir = path.join(__dirname, '..', '..', 'data');
const publicDataDir = path.join(__dirname, '..', 'public', 'data');

// Ensure public/data directory exists
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
  console.log('Created directory:', publicDataDir);
}

// Copy data files
if (fs.existsSync(dataDir)) {
  const files = fs.readdirSync(dataDir);
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const sourcePath = path.join(dataDir, file);
      const destPath = path.join(publicDataDir, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file} to public/data/`);
    }
  });
} else {
  console.warn('Data directory not found:', dataDir);
}

console.log('Data copy completed');