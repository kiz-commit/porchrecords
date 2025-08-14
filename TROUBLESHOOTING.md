# Troubleshooting Guide

## ChunkLoadError Solutions

### What is ChunkLoadError?
ChunkLoadError occurs when the browser fails to load JavaScript chunks (code splitting) from the webpack bundle. This is common in Next.js applications during development.

### Quick Fixes (Try in Order)

1. **Hard Refresh Browser**
   ```bash
   # Chrome/Edge: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   # Firefox: Ctrl+F5 (Cmd+Shift+R on Mac)
   # Safari: Cmd+Option+R
   ```

2. **Clear Browser Cache**
   - Open Developer Tools (F12)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

3. **Use Incognito/Private Mode**
   - Open browser in incognito/private mode
   - Navigate to http://localhost:3000

4. **Clear Next.js Cache**
   ```bash
   ./scripts/clear-cache.sh
   ```

5. **Manual Cache Clear**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   npm run dev
   ```

### Advanced Solutions

#### 1. Check for Multiple Development Servers
```bash
ps aux | grep "next dev"
# Kill all instances if multiple found
pkill -f "next dev"
```

#### 2. Clear Node Modules and Reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 3. Check Network Issues
- Disable VPN/Proxy if using
- Try different browser
- Check firewall settings

#### 4. Browser-Specific Issues

**Chrome/Edge:**
- Clear all browsing data
- Disable extensions temporarily
- Reset browser settings

**Firefox:**
- Clear cache and cookies
- Disable add-ons
- Try safe mode

**Safari:**
- Clear website data
- Disable content blockers
- Reset Safari

### Prevention Measures

The application now includes:

1. **Error Boundary**: Catches and handles ChunkLoadError gracefully
2. **Chunk Error Handler**: Automatically detects and recovers from chunk loading errors
3. **Webpack Optimization**: Better chunk splitting and loading
4. **Automatic Recovery**: Page reload on chunk loading failure

### Development Best Practices

1. **Always use the clear cache script when switching branches:**
   ```bash
   ./scripts/clear-cache.sh
   ```

2. **Monitor development server logs:**
   ```bash
   npm run dev
   # Watch for any error messages
   ```

3. **Use consistent Node.js version:**
   ```bash
   node --version
   # Should match package.json engines
   ```

4. **Keep dependencies updated:**
   ```bash
   npm audit
   npm update
   ```

### When to Contact Support

Contact support if:
- ChunkLoadError persists after all above solutions
- Error occurs in production (not just development)
- Multiple team members experience the same issue
- Error is accompanied by other symptoms (build failures, etc.)

### Debug Information

When reporting issues, include:
- Browser and version
- Operating system
- Node.js version
- Next.js version
- Full error message from console
- Steps to reproduce
- Network tab information (if relevant) 