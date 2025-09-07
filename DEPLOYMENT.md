# 🚀 InsightLead Deployment Guide

## Cloudflare Pages Setup

### Prerequisites
- GitHub/GitLab repository
- Cloudflare account
- Bun or Node.js locally

### Quick Deploy

1. **Connect Repository to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to Pages
   - Click "Create a project" → "Connect to Git"
   - Select your InsightLead repository

2. **Build Configuration**
   ```
   Framework preset: None
   Build command: npm run build:prod
   Build output directory: dist
   Root directory: /
   ```

3. **Environment Variables**
   ```
   NODE_ENV=production
   VITE_USE_MOCK_DATA=false
   VITE_SEED_INDEXEDDB=false
   ```

### Manual Deployment

```bash
# Build the project
bun run build:prod

# Deploy to Cloudflare Pages (if using Wrangler CLI)
npx wrangler pages publish dist
```

### Local Production Preview

```bash
# Build and preview
bun run build:prod
bun run preview
```

## Environment Variables

### Development (.env.development)
```env
VITE_USE_MOCK_DATA=true
VITE_SEED_INDEXEDDB=false
```

### Production (.env.production)
```env
VITE_USE_MOCK_DATA=false
VITE_SEED_INDEXEDDB=false
```

## Features in Production

✅ **Client-side Storage**: IndexedDB for data persistence  
✅ **GitHub Integration**: Connect your repositories  
✅ **Jira Integration**: Track team issues  
✅ **Team Management**: Organize your development teams  
✅ **Objectives Tracking**: Set and monitor goals  
✅ **Performance Dashboard**: Visualize team metrics  

## Post-Deployment

1. **Custom Domain** (Optional)
   - In Cloudflare Pages settings
   - Add your custom domain
   - Configure DNS records

2. **Analytics** (Optional)
   - Enable Cloudflare Analytics
   - Set up custom tracking

3. **Security Headers**
   - Already configured via `_redirects`
   - HTTPS by default

## Support

For deployment issues, check:
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- Build logs in Cloudflare dashboard
- Browser developer console for runtime errors