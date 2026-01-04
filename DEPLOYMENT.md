# Deployment Guide

## Overview

This project uses **Netlify** for full-stack deployment:
- **Frontend**: Static React/Vite app
- **Backend**: Netlify Functions (serverless)

Everything deploys automatically when you push to the `main` branch!

## Configuration

### Environment Variables

The frontend uses a relative API path that works seamlessly with Netlify's redirect configuration.

**Files:**
- `.env.production` - Production API URL (`/api`)
- `.env.example` - Template for local development
- `.env` (gitignored) - Your local development settings

### Current Setup

- **Production**: Deployed to Netlify (auto-configured via `netlify.toml`)
- **Local API**: `http://localhost:3001/api`

## Deployment Process

### Initial Setup (First Time Only)

1. **Create Netlify Account**: Go to [netlify.com](https://netlify.com) and sign up (free)

2. **Connect Repository**:
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - Netlify will auto-detect settings from `netlify.toml`

3. **Deploy**: Netlify will automatically build and deploy!

### Subsequent Deployments

Just push to `main` branch:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Netlify automatically:
- Detects the push
- Runs `npm ci && npm run build`
- Deploys frontend to CDN
- Deploys functions to serverless

### Manual Deployment

From Netlify dashboard:
1. Go to your site
2. Click "Deploys" tab
3. Click "Trigger deploy" → "Deploy site"

## Testing Deployment

### Test API Health
```bash
curl https://YOUR-SITE.netlify.app/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-01-04T..."}
```

### Test App Search
```bash
curl "https://YOUR-SITE.netlify.app/api/apps?take=1"
```

Should return app data.

### Test Frontend
Visit your Netlify URL and check:
- Apps load correctly
- No console errors about failed API requests
- Search works
- Categories display properly

## Troubleshooting

### API Returns 404

**Symptoms:**
- `/api/...` requests fail with 404

**Solutions:**
1. **Check function logs**: Netlify Dashboard → Functions → View logs
2. **Verify build**: Check if `netlify/functions/api.js` exists after build
3. **Check redirects**: Ensure `netlify.toml` has correct redirect rules

### Frontend Not Loading

**Symptoms:**
- Blank page or 404

**Solutions:**
1. **Check build output**: Verify `dist/` folder contains `index.html`
2. **Check deploy logs**: Netlify Dashboard → Deploys → View log

### CORS Issues

**Symptoms:**
- "CORS policy" errors in browser console

**Solutions:**
The API function includes CORS headers. If issues persist:
1. Check browser Network tab for actual error
2. Verify the API is returning correct headers

### Slow Cold Starts

Functions may have a cold start on first request after inactivity.
This is normal for serverless - subsequent requests will be fast.

## Local Development

For local development:

1. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Start both servers:
   ```bash
   npm run dev
   ```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Project Structure

```
quicksetup-pro/
├── netlify/
│   └── functions/
│       ├── api.ts          # Main serverless API function
│       └── tsconfig.json   # TypeScript config for functions
├── netlify.toml            # Netlify configuration
├── src/                    # Frontend React app
├── api/                    # Original Express backend (for local dev)
└── dist/                   # Built frontend (generated)
```

## Important Notes

- **API Path**: Frontend uses `/api` which Netlify redirects to `/.netlify/functions/api`
- **Auto-deploy**: Every push to `main` triggers a new deployment
- **Free tier**: Includes 100GB bandwidth/month and 125K function invocations
- **Build time**: ~2-3 minutes for full deployment

## Netlify Dashboard

Your deployment dashboard is at:
`https://app.netlify.com/sites/YOUR-SITE-NAME`

Here you can:
- View deploy logs
- Check function invocations
- Set environment variables
- Configure custom domains
