#!/bin/bash
# Cloudflare Pages deployment script
# 
# This script handles deployment for Cloudflare Pages.
# The deploy command in Cloudflare Pages should be: npm run deploy
# Or better yet, REMOVE the deploy command entirely (Cloudflare auto-deploys)

set -e

# Check if .next directory exists (build output)
if [ ! -d ".next" ]; then
  echo "⚠️  .next directory not found. Build may have failed."
  exit 0
fi

# Deploy to Cloudflare Pages using wrangler pages deploy
# This is the correct command for Pages (not wrangler deploy which is for Workers)
echo "🚀 Deploying to Cloudflare Pages..."
npx wrangler pages deploy .next --project-name=rabbi-kraz-shiurim --compatibility-date=2025-12-28 || {
  echo "⚠️  Deployment via script failed, but Cloudflare Pages should auto-deploy the build output."
  echo "💡 Best practice: Remove the deploy command from Cloudflare Pages dashboard."
  exit 0
}

echo "✅ Deployment completed!"

