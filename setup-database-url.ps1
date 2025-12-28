# PowerShell script to set DATABASE_URL and YOUTUBE_API_KEY in Netlify
# Run this script after authenticating with Netlify CLI

$DATABASE_URL = "postgresql://postgres:93mMKqR8xfQ3jPM!@db.tjywoiawsxrrepthgkqd.supabase.co:5432/postgres"
$YOUTUBE_API_KEY = "AIzaSyDufIjgKWTjSY6e6YnLfuhHVC5dAwtJPLg"
$RSS_FEED_URL = "https://anchor.fm/s/d89491c4/podcast/rss"

Write-Host "Setting environment variables in Netlify..." -ForegroundColor Cyan

# Check if Netlify CLI is installed
$netlifyCmd = Get-Command netlify -ErrorAction SilentlyContinue
if (-not $netlifyCmd) {
    Write-Host "❌ Netlify CLI not found. Installing..." -ForegroundColor Yellow
    Write-Host "Please run: npm install -g netlify-cli" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Check if logged in
Write-Host "Checking Netlify authentication..." -ForegroundColor Cyan
$authCheck = netlify status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Netlify. Please run: netlify login" -ForegroundColor Yellow
    exit 1
}

# Get site ID from netlify status
$siteInfo = netlify status --json 2>&1 | ConvertFrom-Json
if (-not $siteInfo.siteId) {
    Write-Host "❌ Could not find site ID. Please link your site first:" -ForegroundColor Yellow
    Write-Host "   netlify link" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found site: $($siteInfo.siteId)" -ForegroundColor Green

# Set the environment variables
$success = $true
$errors = @()

Write-Host "Setting DATABASE_URL environment variable..." -ForegroundColor Cyan
$result1 = netlify env:set DATABASE_URL "$DATABASE_URL" --context production 2>&1
if ($LASTEXITCODE -ne 0) {
    $success = $false
    $errors += "DATABASE_URL: $result1"
} else {
    Write-Host "✅ DATABASE_URL set successfully!" -ForegroundColor Green
}

Write-Host "Setting YOUTUBE_API_KEY environment variable..." -ForegroundColor Cyan
$result2 = netlify env:set YOUTUBE_API_KEY "$YOUTUBE_API_KEY" --context production 2>&1
if ($LASTEXITCODE -ne 0) {
    $success = $false
    $errors += "YOUTUBE_API_KEY: $result2"
} else {
    Write-Host "✅ YOUTUBE_API_KEY set successfully!" -ForegroundColor Green
}

Write-Host "Setting RSS_FEED_URL environment variable..." -ForegroundColor Cyan
$result3 = netlify env:set RSS_FEED_URL "$RSS_FEED_URL" --context production 2>&1
if ($LASTEXITCODE -ne 0) {
    $success = $false
    $errors += "RSS_FEED_URL: $result3"
} else {
    Write-Host "✅ RSS_FEED_URL set successfully!" -ForegroundColor Green
}

if ($success) {
    Write-Host ""
    Write-Host "✅ All environment variables set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Trigger a new deployment in Netlify dashboard" -ForegroundColor White
    Write-Host "2. After deployment, visit: /api/setup-db" -ForegroundColor White
    Write-Host "3. Then visit: /api/rss/sync" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Some environment variables failed to set:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Alternative: Set them manually in Netlify dashboard:" -ForegroundColor Yellow
    Write-Host "1. Go to https://app.netlify.com" -ForegroundColor White
    Write-Host "2. Select your site" -ForegroundColor White
    Write-Host "3. Site settings → Environment variables" -ForegroundColor White
    Write-Host "4. Add these variables:" -ForegroundColor White
    Write-Host "   DATABASE_URL = $DATABASE_URL" -ForegroundColor Cyan
    Write-Host "   YOUTUBE_API_KEY = $YOUTUBE_API_KEY" -ForegroundColor Cyan
    Write-Host "   RSS_FEED_URL = $RSS_FEED_URL" -ForegroundColor Cyan
}

