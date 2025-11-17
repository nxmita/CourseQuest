# Quick Start: Deploy CourseQuest to www.coursequest.com

## 🎯 Goal
Deploy CourseQuest online so anyone can access it at www.coursequest.com, with user accounts persisting across sessions.

## ✅ What's Already Set Up

- ✅ Build configuration ready
- ✅ User data persistence (localStorage) - users can log in again
- ✅ Deployment configs (Vercel & Netlify)
- ✅ Production build tested and working

## 🚀 Deploy in 5 Steps

### Step 1: Push to GitHub

```bash
# If not already a git repo
git init
git add .
git commit -m "Initial commit - CourseQuest"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/coursequest.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign up (free)
2. Click **"Add New Project"**
3. **Import** your GitHub repository
4. Vercel auto-detects Vite - just click **"Deploy"**
5. Wait ~2 minutes for deployment

**Your site is now live!** 🎉 (at a URL like `coursequest.vercel.app`)

### Step 3: Get Your Domain

1. **Purchase** `coursequest.com` from:
   - [Namecheap](https://www.namecheap.com) (~$10-15/year)
   - [GoDaddy](https://www.godaddy.com) (~$12-20/year)
   - [Google Domains](https://domains.google) (~$12/year)

### Step 4: Configure Domain in Vercel

1. In Vercel dashboard → Your project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `www.coursequest.com`
4. Vercel shows DNS instructions:
   - Add a **CNAME** record: `www` → `c1.vercel-dns.com`
   - Or add an **A** record (Vercel will show the IP)

### Step 5: Update DNS at Your Domain Registrar

1. Log into your domain registrar (Namecheap, GoDaddy, etc.)
2. Go to **DNS Management**
3. Add the DNS record Vercel provided
4. **Wait 24-48 hours** for DNS propagation

## ✅ User Accounts & Data

**Already Working!** ✅

- User signups are saved in browser localStorage
- Users can log in again (data persists)
- Calendar courses, favorites, and preferences are saved
- Each user's data is stored separately

**Note:** Data is stored in each user's browser. For cross-device sync, you'd need a backend (future enhancement).

## 🧪 Test Before Going Live

```bash
# Build locally
npm run build

# Preview production build
npm run preview

# Visit http://localhost:4173 to test
```

## 📋 Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Site accessible at vercel.app URL
- [ ] Domain purchased (coursequest.com)
- [ ] DNS configured in Vercel
- [ ] DNS records added at domain registrar
- [ ] Tested user signup/login
- [ ] Tested calendar functionality
- [ ] Tested course browsing

## 🆘 Troubleshooting

**Build fails?**
- Run `npm install` first
- Check for errors: `npm run build`

**Domain not working?**
- Check DNS propagation: [whatsmydns.net](https://www.whatsmydns.net)
- Verify DNS records match Vercel's instructions
- Wait 24-48 hours for full propagation

**Users can't log in?**
- localStorage is browser-specific
- Users must use the same browser/device
- Clear browser cache if issues persist

## 🎉 You're Done!

Once DNS propagates, your site will be live at **www.coursequest.com**!

Users can:
- ✅ Sign up with USC email
- ✅ Log in and out
- ✅ Save courses to calendar
- ✅ Favorite courses
- ✅ Write reviews
- ✅ All data persists across sessions

---

**Need help?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

