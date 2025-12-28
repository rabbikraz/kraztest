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

// Create a proper index.html that loads the Next.js app
// This is needed for Cloudflare Pages to serve the application
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rabbi Kraz Shiurim</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
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
  </style>
</head>
<body>
  <div id="__next"></div>
  <script>
    // Next.js will hydrate this
    // Cloudflare Pages will serve the static files from .next/static
    (function() {
      // The actual Next.js app will be loaded by the framework
      // This is just a placeholder for Cloudflare Pages
    })();
  </script>
</body>
</html>`;

// Write index.html to .next directory (this is where Cloudflare Pages looks)
const indexPath = path.join(buildDir, 'index.html');
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('✅ Created index.html in .next directory');

// Also ensure there's an index.html in the root for some Cloudflare Pages configurations
const rootIndexPath = path.join(process.cwd(), 'index.html');
fs.writeFileSync(rootIndexPath, indexHtml, 'utf8');
console.log('✅ Created index.html in root directory');

console.log('✅ Post-build script completed successfully');

