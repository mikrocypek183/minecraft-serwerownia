BASE CONTROL SYSTEM — GITHUB DATABASE VERSION

The original v2 interface is preserved. The registry is now stored in a GitHub
repository through a Cloudflare Worker.

SETUP
1. Create a GitHub repository, e.g. base-control-data.
2. Put systems.json in its root.
3. Create a GitHub token with permission to edit repository contents.
4. In wrangler.json set GITHUB_OWNER and GITHUB_REPO.
5. Install Node.js 18+.
6. Run: npm install -D wrangler
7. Run: npx wrangler login
8. Run: npx wrangler secret put GITHUB_TOKEN
9. Run: npx wrangler deploy
10. Copy the Worker URL.
11. In public/script.js replace YOUR_WORKER_URL with that URL.
12. Host public/ as your Web Display page.

SECURITY
Never put GITHUB_TOKEN in browser JavaScript. The token belongs only in the
Cloudflare Worker secret. Cloudflare Workers supports encrypted secrets for API
tokens.

LOGIN
Username: admin
Password: 2137

All Web Displays using the same Worker use the same systems.json.
