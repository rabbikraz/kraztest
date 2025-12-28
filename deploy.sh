#!/bin/bash
# Cloudflare Pages deployment script
# 
# Change the deploy command in Cloudflare Pages dashboard to: bash deploy.sh
# Or use: npx wrangler pages deploy .next --project-name=rabbi-kraz-shiurim

set -e

# Check if .next directory exists (build output)
if [ ! -d ".next" ]; then
  echo "⚠️  .next directory not found. Build may have failed."
  exit 0
fi

# Deploy to Cloudflare Pages using wrangler pages deploy
# This is the correct command for Pages (not wrangler deploy which is for Workers)
echo "🚀 Deploying to Cloudflare Pages..."
npx wrangler pages deploy .next --project-name=rabbi-kraz-shiurim --compatibility-date=2025-12-28

echo "✅ Deployment completed!"

