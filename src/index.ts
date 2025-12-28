// Minimal Worker entry point for Cloudflare
// This file exists only to satisfy "npx wrangler deploy" command
// For Cloudflare Pages, the deploy command should be REMOVED or set to "npm run deploy"
// Cloudflare Pages automatically deploys the build output from .next directory

export default {
  async fetch(request: Request): Promise<Response> {
    return new Response('This is a placeholder Worker. For Pages deployment, remove the deploy command from Cloudflare Pages dashboard.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};

