#!/bin/bash

echo "🔨 Building Next.js app for static export..."
npm run build

echo "📁 Contents of out directory:"
ls -la out/

echo "✅ Build complete! You can test locally by serving the 'out' directory."
echo "💡 To test locally, run: npx serve out" 