# Site Configuration Database Fix

## Issue Summary

**Problem**: When accessing `https://porch-records.fly.dev/admin/site-config`, users were getting "Failed to fetch homepage configuration" error.

**Root Cause**: The `site_config` database table existed but was missing the required `homepage.hero` configuration entry that the admin interface expects.

## What Was Fixed

### 1. Database Analysis
- Confirmed the SQLite database existed at `/data/porchrecords.db` on Fly.io
- Verified all required tables were present including `site_config`
- Found that `site_config` table only had 2 entries (`last_sync` and `pending_changes`)
- Missing: `homepage.hero`, `homepage.hero.images`, and `theme` configurations

### 2. Configuration Added
Added the following default configurations to the database:

#### Homepage Hero Configuration
```json
{
  "title": "PORCH RECORDS",
  "subtitle": "Record Store. Live Shows. Nice Times.",
  "location": "WORKING & CREATING ON KAURNA COUNTRY. SOUTH AUSTRALIA.",
  "showLocation": true,
  "carouselSpeed": 5,
  "bannerOpacity": 1
}
```

#### Homepage Hero Images
```json
[
  {"id": "1", "src": "/hero-image.jpg", "alt": "Porch Records Hero 1", "order": 1},
  {"id": "2", "src": "/hero-image2.jpg", "alt": "Porch Records Hero 2", "order": 2},
  {"id": "3", "src": "/hero-image3.jpg", "alt": "Porch Records Hero 3", "order": 3}
]
```

#### Theme Configuration
```json
{
  "colors": {
    "primary": "#1a1a1a",
    "secondary": "#f5f5f5",
    "accent": "#ffd700",
    "text": "#333333",
    "background": "#ffffff"
  },
  "typography": {
    "fontFamily": "Inter, sans-serif",
    "fontSize": "16px",
    "lineHeight": "1.6"
  },
  "spacing": {
    "base": "1rem",
    "small": "0.5rem",
    "large": "2rem"
  }
}
```

### 3. Prevention Measures

#### Created Initialization Script
- **File**: `scripts/initialize-site-config.js`
- **Command**: `npm run init-site-config`
- **Purpose**: Ensures all required default configurations exist in the database

#### Updated Documentation
- Added initialization step to `DATABASE_DEPLOYMENT.md`
- Updated migration checklist to include site config initialization
- Added npm script for easy access

## How to Prevent This Issue

### For New Deployments
1. Always run `npm run init-site-config` after database migration
2. Include this step in your deployment pipeline
3. Test the admin interface after deployment

### For Existing Deployments
1. Run the initialization script: `npm run init-site-config`
2. Verify the admin interface loads correctly
3. Check that all configuration sections work

### Database Verification Commands

```bash
# Check if database exists and has tables
fly ssh console -C "node -e \"const Database = require('better-sqlite3'); const db = new Database('/data/porchrecords.db'); const tables = db.prepare('SELECT name FROM sqlite_master WHERE type = ?').all(['table']); console.log('Tables:', tables.map(t => t.name)); db.close();\""

# Check site configuration entries
fly ssh console -C "node -e \"const Database = require('better-sqlite3'); const db = new Database('/data/porchrecords.db'); const configs = db.prepare('SELECT config_key FROM site_config ORDER BY config_key').all(); console.log('Config entries:', configs.map(c => c.config_key)); db.close();\""

# Check specific configuration
fly ssh console -C "node -e \"const Database = require('better-sqlite3'); const db = new Database('/data/porchrecords.db'); const config = db.prepare('SELECT config_value FROM site_config WHERE config_key = ?').get(['homepage.hero']); console.log('homepage.hero exists:', !!config); db.close();\""
```

## Related Files

- `src/app/api/admin/site-config/route.ts` - Site config API endpoint
- `src/components/admin/HomepageConfigEditor.tsx` - Admin interface component
- `src/contexts/HomepageContext.tsx` - React context for homepage data
- `scripts/initialize-site-config.js` - Initialization script
- `DATABASE_DEPLOYMENT.md` - Updated deployment documentation

## Status

✅ **RESOLVED** - The site-config admin page should now load correctly without the "Failed to fetch homepage configuration" error.

## Notes

- The Square API rate limit errors in the logs are unrelated to this database issue
- The database is properly configured with persistent storage on Fly.io
- All required tables exist and are functional
- The issue was specifically missing configuration data, not database structure problems
