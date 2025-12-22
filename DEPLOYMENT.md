# Deployment Guide

## Overview

This project uses a split deployment strategy:
- **Frontend**: GitHub Pages (via GitHub Actions)
- **Backend**: Railway

## Configuration

### Environment Variables

The frontend needs to know where the backend API is located. This is configured via the `VITE_API_URL` environment variable.

**Files:**
- `.env.production` - Production API URL (Railway)
- `.env.example` - Template for local development
- `.env` (gitignored) - Your local development settings

### Current Setup

- **Production API:** `https://quicksetup-pro-production.up.railway.app/api`
- **Local API:** `http://localhost:3001/api`

## Deployment Process

### Deploying Frontend (GitHub Pages)

1. Commit and push changes to the `main` branch
2. GitHub Actions will automatically:
   - Install dependencies
   - Build with production API URL
   - Deploy to GitHub Pages

**Manual deployment:**
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

The deployment status can be monitored at:
https://github.com/YOUR_USERNAME/quicksetup-pro/actions

### Deploying Backend (Railway)

Railway automatically deploys when you push to the connected branch.

**To redeploy manually:**
1. Go to Railway dashboard
2. Select your project
3. Click "Deploy" or push changes to trigger deployment

## Testing Deployment

### Test Backend Health
```bash
curl https://quicksetup-pro-production.up.railway.app/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-12-22T..."}
```

### Test Backend API
```bash
curl "https://quicksetup-pro-production.up.railway.app/api/apps?take=1"
```

Should return app data.

### Test Frontend
Visit your GitHub Pages URL and check:
- Apps load correctly
- No console errors about failed API requests
- Network tab shows requests going to Railway backend

## Troubleshooting

### Frontend can't connect to backend

**Symptoms:**
- "Connection Error" message
- "Failed to load apps. Make sure the backend server is running."

**Solutions:**

1. **Check if backend is running:**
   ```bash
   curl https://quicksetup-pro-production.up.railway.app/api/health
   ```

2. **Verify GitHub Actions used correct API URL:**
   - Check latest workflow run logs
   - Look for the build step
   - Confirm `VITE_API_URL` environment variable was set

3. **Check for CORS issues:**
   - Open browser DevTools → Network tab
   - Look for failed requests
   - Check if CORS headers are present

4. **Redeploy frontend:**
   - Make a small change (e.g., add comment to README)
   - Push to main branch
   - Wait for GitHub Actions to complete

### Backend not responding

1. **Check Railway logs:**
   - Go to Railway dashboard
   - View deployment logs
   - Look for errors

2. **Check Railway service status:**
   - Verify service is not sleeping
   - Check resource usage

3. **Verify environment variables in Railway:**
   - `PORT` should be set (Railway provides this)
   - Node.js version matches package.json

## Updating API URL

If you change the Railway deployment URL:

1. Update `.env.production`:
   ```
   VITE_API_URL=https://new-url.railway.app/api
   ```

2. Update `.github/workflows/deploy.yml`:
   ```yaml
   - name: Build
     run: npm run build:client
     env:
       VITE_API_URL: https://new-url.railway.app/api
   ```

3. Commit and push changes

## Local Development

For local development:

1. Create `.env` file (gitignored):
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

## Important Notes

- **Environment variables are embedded at build time** in Vite apps
- Changing `.env.production` requires a new build and deployment
- The GitHub Actions workflow explicitly sets `VITE_API_URL` during build
- Backend CORS is configured to accept requests from any origin
