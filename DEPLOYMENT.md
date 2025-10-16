# Deployment Checklist

## Pre-deployment
- [ ] All environment variables configured
- [ ] Build tests passing locally
- [ ] No ESLint errors
- [ ] TypeScript compilation successful

## Vercel Deployment
- [ ] Repository connected to Vercel
- [ ] Build command: `npm run build:vercel`
- [ ] Output directory: `dist`
- [ ] Node.js version: 18.x
- [ ] Environment variables set in dashboard

## Cloudflare Pages Deployment
- [ ] Repository connected to Cloudflare Pages
- [ ] Build command: `npm run build:cloudflare`
- [ ] Build output directory: `dist`
- [ ] Environment variables set in dashboard
- [ ] Custom domain configured (optional)

## Environment Variables Required
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_PROJECT_ID=your-supabase-project-id
VITE_WEB3FORMS_ACCESS_KEY=your-web3forms-api-key
```

## Post-deployment Testing
- [ ] Site loads correctly
- [ ] Authentication works
- [ ] Product catalog displays
- [ ] Contact forms functional
- [ ] All routes accessible
- [ ] Mobile responsiveness