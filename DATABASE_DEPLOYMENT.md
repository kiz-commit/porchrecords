# Database Deployment Guide

## Overview

PorchRecords has been migrated from JSON file storage to SQLite database for better performance, scalability, and data integrity. This guide covers deployment considerations for the new database system.

## Database Architecture

### SQLite Database
- **File**: `data/porchrecords.db`
- **Type**: Serverless SQLite database
- **Size**: Typically 1-10MB for small to medium sites
- **Backup**: Single file backup

### Tables
- `pages` - Page content and metadata
- `media` - Media library items
- `navigation` - Site navigation structure
- `shows` - Event/show information
- `products` - Product catalog
- `genres` - Music genres
- `moods` - Mood categories
- `preorders` - Preorder configurations
- `merch_categories` - Merchandise categories

## Deployment Steps

### 1. Local Development Setup

```bash
# Install dependencies
npm install

# Run migration (if you have existing JSON data)
npm run migrate-db

# Start development server
npm run dev
```

### 2. Production Deployment

#### Option A: Vercel/Netlify (Recommended for cheap hosting)

1. **Database File**: The SQLite database file will be created automatically on first request
2. **File System**: Ensure your hosting provider supports file system writes
3. **Environment**: No additional environment variables needed

```bash
# Build and deploy
npm run build
npm run start
```

#### Option B: Traditional VPS/Server

1. **Database Location**: Place database file in persistent storage
2. **Permissions**: Ensure the application has read/write permissions
3. **Backup Strategy**: Set up regular database backups

```bash
# Create data directory
mkdir -p /var/www/porchrecords/data

# Set permissions
chown www-data:www-data /var/www/porchrecords/data
chmod 755 /var/www/porchrecords/data

# Deploy application
npm run build
npm run start
```

### 3. Migration from JSON Files

If you have existing JSON data:

```bash
# Run migration script
npm run migrate-db

# Verify migration
# Check migration-report.json for details
```

## Performance Considerations

### For Cheap Hosting

1. **Database Size**: SQLite databases are typically very small (< 10MB)
2. **Memory Usage**: Minimal memory footprint
3. **Concurrent Users**: SQLite handles 10-100 concurrent users well
4. **Scaling**: Consider PostgreSQL/MySQL for 1000+ concurrent users

### Optimization Tips

1. **Indexes**: Already configured for common queries
2. **Connection Pooling**: Not needed with SQLite
3. **Caching**: Application-level caching still recommended
4. **Backup Frequency**: Daily backups for active sites

## Backup Strategy

### Automatic Backups

The system creates automatic backups during migration:

```bash
# Manual backup
node -e "
const { backupDatabase } = require('./src/lib/database.ts');
backupDatabase().then(path => console.log('Backup created:', path));
"
```

### Backup Locations

- **JSON Files**: `backup/json-files/YYYY-MM-DD/`
- **Database**: `data/porchrecords.db.backup.TIMESTAMP`

## Monitoring

### Database Statistics

```bash
# Get database stats
node -e "
const { getDatabaseStats } = require('./src/lib/database.ts');
getDatabaseStats().then(stats => console.log(JSON.stringify(stats, null, 2)));
"
```

### Health Checks

Monitor these endpoints:
- `GET /api/admin/pages` - Should return pages list
- `GET /api/admin/pages?limit=1` - Quick health check

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Fix permissions
   chmod 755 data/
   chmod 644 data/porchrecords.db
   ```

2. **Database Locked**
   ```bash
   # Check for other processes
   lsof data/porchrecords.db
   # Restart application
   ```

3. **Migration Failed**
   ```bash
   # Check backup directory
   ls -la backup/json-files/
   # Re-run migration
   npm run migrate-db
   ```

### Logs

Check application logs for database errors:
```bash
# Development
npm run dev

# Production
npm run start
```

## Security Considerations

1. **File Permissions**: Restrict database file access
2. **Backup Security**: Secure backup files
3. **Input Validation**: Already implemented in API layer
4. **Rate Limiting**: Built-in rate limiting on API endpoints

## Cost Optimization

### For Very Cheap Hosting

1. **Database Size**: Monitor database growth
2. **Backup Storage**: Use cloud storage for backups
3. **CDN**: Use CDN for media files to reduce database size
4. **Cleanup**: Regular cleanup of old media files

### Scaling Up

When you need to scale beyond SQLite:

1. **PostgreSQL**: For 1000+ concurrent users
2. **MySQL**: Alternative to PostgreSQL
3. **Cloud Databases**: AWS RDS, Google Cloud SQL
4. **Migration**: Export SQLite data to new database

## Maintenance

### Regular Tasks

1. **Backup Verification**: Test backup restoration monthly
2. **Database Optimization**: Run VACUUM periodically
3. **Log Rotation**: Rotate application logs
4. **Performance Monitoring**: Monitor response times

### Database Maintenance

```sql
-- Optimize database (run monthly)
VACUUM;

-- Analyze table statistics
ANALYZE;

-- Check database integrity
PRAGMA integrity_check;
```

## Support

For database-related issues:

1. Check the migration report: `migration-report.json`
2. Review application logs
3. Verify file permissions
4. Test with a fresh database

## Migration Checklist

- [ ] Run migration script: `npm run migrate-db`
- [ ] Verify all pages load correctly
- [ ] Test page creation and editing
- [ ] Check media upload functionality
- [ ] Verify navigation works
- [ ] Test admin interface
- [ ] Create initial backup
- [ ] Update deployment scripts
- [ ] Monitor performance
- [ ] Document any custom configurations 