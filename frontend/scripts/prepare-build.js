// Prepare build script for Netlify
const fs = require('fs');
const path = require('path');

// First, copy data files
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

// Create direct local copies of modules for better path resolution in Netlify
const srcDir = path.join(__dirname, '..', 'src');
const libDir = path.join(srcDir, 'lib');
const componentsDir = path.join(srcDir, 'components');
const appDir = path.join(srcDir, 'app');

// Copy types.ts and data.ts to components directory for direct imports
fs.copyFileSync(
  path.join(libDir, 'types.ts'),
  path.join(componentsDir, 'types.ts')
);
console.log('Copied types.ts to components directory');

fs.copyFileSync(
  path.join(libDir, 'data.ts'),
  path.join(componentsDir, 'data.ts')
);
console.log('Copied data.ts to components directory');

// Now also copy to app directory
fs.copyFileSync(
  path.join(libDir, 'types.ts'),
  path.join(appDir, 'types.ts')
);
console.log('Copied types.ts to app directory');

fs.copyFileSync(
  path.join(libDir, 'data.ts'),
  path.join(appDir, 'data.ts')
);
console.log('Copied data.ts to app directory');

console.log('Build preparation completed');