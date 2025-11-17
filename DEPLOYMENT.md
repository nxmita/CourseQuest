# CourseQuest Deployment Guide

This guide will help you deploy CourseQuest to make it accessible online at www.coursequest.com.

## Prerequisites

1. A GitHub account
2. A Vercel account (free tier works fine)
3. Domain ownership of `coursequest.com` (or you can use a Vercel-provided domain)

## Deployment Steps

### Option 1: Deploy to Vercel (Recommended - Easiest)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com) and sign up/login
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings
   - Click "Deploy"
   - Your site will be live at a URL like `coursequest.vercel.app`

3. **Configure Custom Domain (www.coursequest.com):**
   - In your Vercel project dashboard, go to "Settings" → "Domains"
   - Click "Add Domain"
   - Enter `www.coursequest.com`
   - Follow Vercel's instructions to configure DNS:
     - Add a CNAME record: `www` → `c1.vercel-dns.com`
     - Or add an A record if you prefer
   - Wait for DNS propagation (can take a few minutes to 48 hours)

### Option 2: Deploy to Netlify

1. **Push to GitHub** (same as above)

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com) and sign up/login
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Configure Custom Domain:**
   - Go to "Site settings" → "Domain management"
   - Click "Add custom domain"
   - Enter `www.coursequest.com`
   - Follow Netlify's DNS configuration instructions

### Option 3: Deploy to GitHub Pages

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json:**
   Add to scripts:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

4. **Configure custom domain:**
   - Create a `CNAME` file in the `dist` folder with content: `www.coursequest.com`
   - Configure DNS with your domain provider

## Important Notes

### User Data Persistence

The app uses **localStorage** to store user data. This means:
- ✅ User accounts and preferences are saved in the browser
- ✅ Works across sessions for the same user
- ⚠️ Data is stored locally in each user's browser
- ⚠️ If you need server-side persistence, you'll need to add a backend API

### Domain Setup

To use `www.coursequest.com`:
1. **Purchase the domain** from a registrar (Namecheap, GoDaddy, Google Domains, etc.)
2. **Configure DNS records** as instructed by your hosting provider
3. **Wait for DNS propagation** (usually 24-48 hours)

### Building the Project

Before deploying, test the build locally:
```bash
npm run build
npm run preview
```

This will create a `dist` folder with the production build.

## Troubleshooting

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run lint`
- Verify the build: `npm run build`

### Domain Not Working
- Check DNS propagation: [whatsmydns.net](https://www.whatsmydns.net)
- Verify DNS records are correct
- Wait 24-48 hours for full propagation

### User Data Not Persisting
- localStorage is browser-specific
- Users must use the same browser/device
- Consider adding a backend for cross-device sync

## Next Steps (Optional)

For production use, consider:
1. **Backend API** for user data persistence across devices
2. **Database** for storing user accounts and reviews
3. **Authentication** with JWT tokens
4. **HTTPS/SSL** certificate (usually automatic with Vercel/Netlify)
5. **Analytics** to track usage
6. **Error monitoring** (Sentry, etc.)

