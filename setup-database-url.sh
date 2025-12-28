#!/bin/bash
# Bash script to set DATABASE_URL and YOUTUBE_API_KEY in Netlify
# Run this script after authenticating with Netlify CLI

DATABASE_URL="postgresql://postgres:93mMKqR8xfQ3jPM!@db.tjywoiawsxrrepthgkqd.supabase.co:5432/postgres"
YOUTUBE_API_KEY="AIzaSyDufIjgKWTjSY6e6YnLfuhHVC5dAwtJPLg"
RSS_FEED_URL="https://anchor.fm/s/d89491c4/podcast/rss"

echo "Setting environment variables in Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Please install it:"
    echo "   npm install -g netlify-cli"
    exit 1
fi

# Check if logged in
echo "Checking Netlify authentication..."
if ! netlify status &> /dev/null; then
    echo "❌ Not logged in to Netlify. Please run: netlify login"
    exit 1
fi

# Get site ID from netlify status
SITE_ID=$(netlify status --json | jq -r '.siteId' 2>/dev/null)
if [ -z "$SITE_ID" ]; then
    echo "❌ Could not find site ID. Please link your site first:"
    echo "   netlify link"
    exit 1
fi

echo "✅ Found site: $SITE_ID"

# Set the environment variables
SUCCESS=true
ERRORS=()

echo "Setting DATABASE_URL environment variable..."
if netlify env:set DATABASE_URL "$DATABASE_URL" --context production; then
    echo "✅ DATABASE_URL set successfully!"
else
    SUCCESS=false
    ERRORS+=("DATABASE_URL failed")
fi

echo "Setting YOUTUBE_API_KEY environment variable..."
if netlify env:set YOUTUBE_API_KEY "$YOUTUBE_API_KEY" --context production; then
    echo "✅ YOUTUBE_API_KEY set successfully!"
else
    SUCCESS=false
    ERRORS+=("YOUTUBE_API_KEY failed")
fi

echo "Setting RSS_FEED_URL environment variable..."
if netlify env:set RSS_FEED_URL "$RSS_FEED_URL" --context production; then
    echo "✅ RSS_FEED_URL set successfully!"
else
    SUCCESS=false
    ERRORS+=("RSS_FEED_URL failed")
fi

if [ "$SUCCESS" = true ]; then
    echo ""
    echo "✅ All environment variables set successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Trigger a new deployment in Netlify dashboard"
    echo "2. After deployment, visit: /api/setup-db"
    echo "3. Then visit: /api/rss/sync"
else
    echo ""
    echo "❌ Some environment variables failed to set:"
    for error in "${ERRORS[@]}"; do
        echo "   $error"
    done
    echo ""
    echo "Alternative: Set them manually in Netlify dashboard:"
    echo "1. Go to https://app.netlify.com"
    echo "2. Select your site"
    echo "3. Site settings → Environment variables"
    echo "4. Add these variables:"
    echo "   DATABASE_URL = $DATABASE_URL"
    echo "   YOUTUBE_API_KEY = $YOUTUBE_API_KEY"
    echo "   RSS_FEED_URL = $RSS_FEED_URL"
fi

