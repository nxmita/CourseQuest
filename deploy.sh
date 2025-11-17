#!/bin/bash

# CourseQuest Deployment Script
# This script helps you prepare and deploy CourseQuest

echo "🚀 CourseQuest Deployment Helper"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git branch -M main
    echo "✅ Git repository initialized"
    echo ""
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Create a GitHub repository at https://github.com/new"
    echo "2. Run these commands:"
    echo "   git add ."
    echo "   git commit -m 'Initial commit - CourseQuest deployment'"
    echo "   git remote add origin <your-github-repo-url>"
    echo "   git push -u origin main"
    echo ""
    echo "3. Go to https://vercel.com and:"
    echo "   - Sign up/login"
    echo "   - Click 'Add New Project'"
    echo "   - Import your GitHub repository"
    echo "   - Click 'Deploy'"
    echo ""
    echo "4. Configure custom domain www.coursequest.com in Vercel settings"
    echo ""
    echo "📖 For detailed instructions, see DEPLOYMENT.md"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

