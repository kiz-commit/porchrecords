#!/bin/bash

echo "🧹 Clearing Next.js cache and node modules cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "🔄 Restarting development server..."
pkill -f "next dev" 2>/dev/null || true

echo "⏳ Waiting for processes to stop..."
sleep 2

echo "🚀 Starting development server..."
npm run dev &

echo "✅ Development server started!"
echo "📝 To clear browser cache:"
echo "   - Chrome/Edge: Ctrl+Shift+R (Cmd+Shift+R on Mac)"
echo "   - Firefox: Ctrl+F5 (Cmd+Shift+R on Mac)"
echo "   - Safari: Cmd+Option+R"
echo ""
echo "🌐 Open http://localhost:3000 in your browser"
echo "🔍 If you still see ChunkLoadError, try:"
echo "   1. Hard refresh (Ctrl+Shift+R)"
echo "   2. Clear browser cache completely"
echo "   3. Open in incognito/private mode" 