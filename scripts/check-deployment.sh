#!/bin/bash

echo "🔍 Checking deployment configuration..."

echo ""
echo "📋 Current repository information:"
echo "Repository: $(git remote get-url origin)"
echo "Current branch: $(git branch --show-current)"

echo ""
echo "📁 Build output check:"
if [ -d "out" ]; then
    echo "✅ 'out' directory exists"
    echo "📄 Files in out directory:"
    ls -la out/ | head -10
else
    echo "❌ 'out' directory not found. Run 'npm run build' first."
fi

echo ""
echo "🔧 Next.js configuration:"
echo "next.config.js content:"
cat next.config.js

echo ""
echo "📝 GitHub Actions workflow:"
if [ -f ".github/workflows/deploy.yml" ]; then
    echo "✅ GitHub Actions workflow exists"
else
    echo "❌ GitHub Actions workflow not found"
fi

echo ""
echo "🌐 Expected GitHub Pages URL:"
echo "https://uppusaikiran.github.io/trade-risk/"

echo ""
echo "📚 Manual steps to complete:"
echo "1. Push changes to GitHub: git push origin main"
echo "2. Go to repository Settings → Actions → General"
echo "3. Set 'Workflow permissions' to 'Read and write permissions'"
echo "4. Go to repository Settings → Pages"
echo "5. Set 'Source' to 'GitHub Actions'" 