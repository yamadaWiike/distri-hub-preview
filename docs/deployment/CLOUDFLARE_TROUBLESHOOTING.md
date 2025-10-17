# Cloudflare Pages Blank Page Troubleshooting

## Common Causes and Solutions

### 1. Environment Variables Missing
The most common cause of blank pages is missing environment variables.

**Check in Cloudflare Pages Dashboard:**
- Go to your Pages project → Settings → Environment variables
- Ensure ALL required variables are set:

```bash
VITE_SUPABASE_URL=https://sahllcduqzfvhiohgpro.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=sahllcduqzfvhiohgpro
VITE_WEB3FORMS_ACCESS_KEY=c4ba5a15-894e-43f8-86e2-c5444bd16409
```

**Important Notes:**
- Variables must have `VITE_` prefix for client-side access
- Set variables for both Production and Preview environments
- Values should NOT be wrapped in quotes in Cloudflare dashboard

### 2. Build Configuration Issues

**Correct Build Settings in Cloudflare Pages:**
```
Build command: npm run build:cloudflare
Build output directory: dist
Root directory: (leave blank)
```

### 3. Routing Problems

**Check for SPA Routing:**
- The `_redirects` file should be in the build output
- Content should be: `/*    /index.html   200`

### 4. JavaScript Errors

**Check Browser Console:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Common errors:
   - "Cannot read properties of undefined" (missing env vars)
   - Network errors (API calls failing)
   - Import/module errors (build issues)

### 5. Network/API Issues

**Check Network Tab:**
1. Open DevTools → Network tab
2. Refresh page
3. Look for failed requests (red entries)
4. Check if Supabase API calls are working

### 6. Build Output Verification

**Local Testing:**
```bash
# Test the build locally
npm run build:cloudflare

# Check if files are generated
ls -la dist/
# Should see: index.html, assets/, _redirects

# Test locally
npm run preview
# Visit http://localhost:4173
```

### 7. Cloudflare Specific Issues

**Cache Problems:**
- Try purging cache in Cloudflare dashboard
- Use "Development mode" to bypass cache

**Deployment Logs:**
- Check build logs in Cloudflare Pages for errors
- Look for npm install or build failures

## Quick Fix Checklist

1. ✅ Environment variables set correctly
2. ✅ Build command: `npm run build:cloudflare`
3. ✅ Output directory: `dist`
4. ✅ `_redirects` file in build output
5. ✅ No JavaScript errors in console
6. ✅ Supabase URL and keys are valid
7. ✅ Latest deployment succeeded

## Emergency Debugging

**If still blank, try this minimal test:**

1. Temporarily replace `src/main.tsx` content with:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <div style={{padding: '20px', fontSize: '24px'}}>
    <h1>Cloudflare Test Page</h1>
    <p>Environment Variables:</p>
    <ul>
      <li>SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || 'MISSING'}</li>
      <li>PROJECT_ID: {import.meta.env.VITE_SUPABASE_PROJECT_ID || 'MISSING'}</li>
    </ul>
  </div>
)
```

2. Deploy and check if this basic page works
3. If yes, the issue is in your app code
4. If no, it's a deployment configuration issue