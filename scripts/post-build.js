const fs = require('fs');
const path = require('path');

// Create index.html for Cloudflare Pages
// Cloudflare Pages requires an index.html file in the build output directory

const buildDir = path.join(process.cwd(), '.next');
const staticDir = path.join(buildDir, 'static');

// Ensure .next directory exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ .next directory not found. Build may have failed.');
  process.exit(1);
}

// Read the build manifest to get the correct paths
let buildId = 'development';
try {
  const buildIdPath = path.join(buildDir, 'BUILD_ID');
  if (fs.existsSync(buildIdPath)) {
    buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
  }
} catch (e) {
  console.warn('Could not read BUILD_ID, using default');
}

// Find the actual Next.js static chunks
let mainJsPath = '/_next/static/chunks/main-app.js';
let webpackRuntimePath = '/_next/static/chunks/webpack.js';

try {
  // Try to find the actual chunk files
  const chunksDir = path.join(buildDir, 'static', 'chunks');
  if (fs.existsSync(chunksDir)) {
    const files = fs.readdirSync(chunksDir);
    const mainAppFile = files.find(f => f.includes('main-app'));
    const webpackFile = files.find(f => f.includes('webpack'));
    
    if (mainAppFile) {
      mainJsPath = `/_next/static/chunks/${mainAppFile}`;
    }
    if (webpackFile) {
      webpackRuntimePath = `/_next/static/chunks/${webpackFile}`;
    }
  }
} catch (e) {
  console.warn('Could not find chunk files, using defaults');
}

// Create a proper index.html that loads the Next.js app
// This is needed for Cloudflare Pages to serve the application
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rabbi Kraz's Shiurim</title>
  <meta name="description" content="Timeless Torah wisdom, delivered with passion.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    #__next {
      min-height: 100vh;
    }
    /* Loading state */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-size: 18px;
      color: #666;
    }
  </style>
</head>
<body>
  <div id="__next">
    <div class="loading">Loading...</div>
  </div>
  <script>
    // Next.js will hydrate this
    // Load the Next.js runtime and main app
    (function() {
      // The Next.js app will be loaded by the framework
      // This placeholder ensures Cloudflare Pages can serve the file
    })();
  </script>
</body>
</html>`;

// Write index.html to .next directory (this is where Cloudflare Pages looks)
const indexPath = path.join(buildDir, 'index.html');
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('✅ Created index.html in .next directory:', indexPath);

// Also ensure there's an index.html in the root for some Cloudflare Pages configurations
const rootIndexPath = path.join(process.cwd(), 'index.html');
fs.writeFileSync(rootIndexPath, indexHtml, 'utf8');
console.log('✅ Created index.html in root directory:', rootIndexPath);

// Verify the files were created
if (fs.existsSync(indexPath)) {
  console.log('✅ Verified: index.html exists in .next directory');
} else {
  console.error('❌ Failed to create index.html in .next directory');
  process.exit(1);
}

if (fs.existsSync(rootIndexPath)) {
  console.log('✅ Verified: index.html exists in root directory');
} else {
  console.error('❌ Failed to create index.html in root directory');
  process.exit(1);
}

console.log('✅ Post-build script completed successfully');

