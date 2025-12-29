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
let mainJsPath = null;
let webpackRuntimePath = null;
let frameworkPath = null;
let polyfillsPath = null;
let mainPath = null;
let cssPath = null;

try {
  // Try to find the actual chunk files
  const chunksDir = path.join(buildDir, 'static', 'chunks');
  if (fs.existsSync(chunksDir)) {
    const files = fs.readdirSync(chunksDir);
    const mainAppFile = files.find(f => f.includes('main-app'));
    const webpackFile = files.find(f => f.includes('webpack') && !f.includes('runtime'));
    const frameworkFile = files.find(f => f.includes('framework'));
    const polyfillsFile = files.find(f => f.includes('polyfills'));
    const mainFile = files.find(f => f.startsWith('main-') && !f.includes('app'));
    
    if (mainAppFile) {
      mainJsPath = `/_next/static/chunks/${mainAppFile}`;
    }
    if (webpackFile) {
      webpackRuntimePath = `/_next/static/chunks/${webpackFile}`;
    }
    if (frameworkFile) {
      frameworkPath = `/_next/static/chunks/${frameworkFile}`;
    }
    if (polyfillsFile) {
      polyfillsPath = `/_next/static/chunks/${polyfillsFile}`;
    }
    if (mainFile) {
      mainPath = `/_next/static/chunks/${mainFile}`;
    }
  }
  
  // Find CSS file
  const cssDir = path.join(buildDir, 'static', 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir);
    if (cssFiles.length > 0) {
      cssPath = `/_next/static/css/${cssFiles[0]}`;
    }
  }
} catch (e) {
  console.warn('Could not find chunk files, using defaults');
}

// Check if there's a pre-rendered HTML file we can use
let prerenderedHtml = null;
try {
  const serverAppDir = path.join(buildDir, 'server', 'app');
  const pageHtmlPath = path.join(serverAppDir, 'page.js');
  // Next.js doesn't generate static HTML for dynamic pages, so we'll create one
} catch (e) {
  // No pre-rendered HTML found
}

// Create a proper index.html that loads the Next.js app
// This is needed for Cloudflare Pages to serve the application
const scripts = [];
if (polyfillsPath) scripts.push(`<script src="${polyfillsPath}"></script>`);
if (webpackRuntimePath) scripts.push(`<script src="${webpackRuntimePath}"></script>`);
if (frameworkPath) scripts.push(`<script src="${frameworkPath}"></script>`);
if (mainPath) scripts.push(`<script src="${mainPath}"></script>`);
if (mainJsPath) scripts.push(`<script src="${mainJsPath}"></script>`);

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
  ${cssPath ? `<link rel="stylesheet" href="${cssPath}" />` : ''}
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
  ${scripts.join('\n  ')}
  <script>
    // Next.js will hydrate the app
    // The scripts above will load the Next.js runtime
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

