# Square Sync & Product API Rebuild Task Plan

## 🎯 Project Overview
Rebuild the Square sync and product API system to ensure:
- Square inventory API is the source of truth for product availability
- Admin products page shows only products available at the configured location
- Store page pulls from local database (not Square API directly)
- Admin edits (genre, mood, etc.) are preserved during sync operations
- Sync operations don't reset the database or lose admin-managed data

## 🔍 Current Issues Identified

### 1. Sync System Problems
- **Database Reset**: Sync operations clear all products and start fresh
- **Location Filtering**: Multiple conflicting approaches to location filtering
- **Data Loss**: Admin-managed fields (genre, mood) are overwritten during sync
- **Inconsistent APIs**: Multiple sync endpoints with different behaviors

### 2. Admin Products Page Issues
- **Wrong Data Source**: Shows products from Square API instead of local database
- **Missing Location Filter**: Doesn't respect `available_at_location` field
- **Edit Persistence**: Changes don't save or get lost on next sync

### 3. Store Page Issues
- **Wrong Data Source**: Pulls from Square API instead of local database
- **Performance**: Slow due to direct Square API calls
- **Inconsistency**: Different product sets than admin page

## 🏗️ Architecture Goals

### Data Flow
```
Square Inventory API → Local Database → Admin Products → Store Page
```

### Key Principles
1. **Square Inventory API as Source of Truth**: Only products with inventory at configured location
2. **Local Database as Single Source**: All product data flows through local database
3. **Admin Data Preservation**: Admin-managed fields never overwritten by sync
4. **Incremental Sync**: Update existing products, don't reset database

## 📋 Task Breakdown

### Phase 1: Database Schema & Utilities
- [x] **Task 1.1**: Audit and standardize database schema
  - Review all product table columns
  - Ensure `available_at_location` field exists and is used consistently
  - Add any missing indexes for performance
  - **Success Criteria**: Database schema is clean and consistent

- [x] **Task 1.2**: Create database utility functions
  - `getProductsByLocation()` - Get products available at configured location
  - `getAdminFields()` - Helper to preserve admin-managed data during updates
  - `updateProductInventory()` - Update only inventory-related fields
  - **Success Criteria**: Reusable database utilities for consistent operations

### Phase 2: Square API Integration
- [x] **Task 2.1**: Create robust Square inventory checker
  - Single function to check if product has inventory at configured location
  - Handle pagination for large product catalogs
  - Proper error handling and logging
  - **Success Criteria**: Reliable inventory checking for any Square product

- [x] **Task 2.2**: Build incremental sync system
  - Fetch all Square products with pagination
  - Check inventory for each product at configured location
  - Update only products that have inventory records
  - Preserve admin-managed fields during updates
  - **Success Criteria**: Sync updates existing products without data loss

### Phase 3: Admin Products API
- [x] **Task 3.1**: Fix admin products API
  - Query local database only (not Square API)
  - Filter by `available_at_location = 1`
  - Include all admin-managed fields
  - **Success Criteria**: Admin page shows correct products from database

- [x] **Task 3.2**: Fix admin product edit API
  - Save changes to local database only
  - Don't sync back to Square (admin data is local-only)
  - Preserve changes across sync operations
  - **Success Criteria**: Admin edits persist and don't get overwritten

### Phase 4: Store Products API
- [x] **Task 4.1**: Fix store products API
  - Query local database only (not Square API)
  - Filter by `is_visible = 1` and `available_at_location = 1`
  - Include all product metadata
  - **Success Criteria**: Store page shows correct products from database

- [x] **Task 4.2**: Optimize store performance
  - Add proper database indexes
  - Implement caching if needed
  - Ensure fast query performance
  - **Success Criteria**: Store page loads quickly with database data

### Phase 5: Sync Management
- [x] **Task 5.1**: Create unified sync endpoint
  - Single `/api/admin/sync` endpoint
  - Clear logging and progress tracking
  - Proper error handling and rollback
  - **Success Criteria**: Reliable sync that doesn't break existing data

- [x] **Task 5.2**: Add sync status tracking
  - Track last sync time
  - Show sync progress
  - Handle sync failures gracefully
  - **Success Criteria**: Admin can see sync status and history

### Phase 6: Testing & Validation
- [x] **Task 6.1**: Test sync operations
  - Test with real Square data
  - Verify location filtering works
  - Confirm admin data preservation
  - **Success Criteria**: Sync works correctly in production environment

- [x] **Task 6.2**: Test data consistency
  - Verify admin products match store products
  - Confirm location filtering is consistent
  - Test admin edit persistence
  - **Success Criteria**: All systems show consistent data

## 🚨 Critical Success Factors

1. **No Database Resets**: Sync must update existing records, never clear and recreate
2. **Location Filtering**: Only products with inventory at `SQUARE_LOCATION_ID` should be included
3. **Admin Data Preservation**: Fields like genre, mood, product_type must never be overwritten
4. **Single Source of Truth**: Local database is the only source for both admin and store pages
5. **Performance**: All operations must be fast and reliable

## 🔧 Implementation Notes

### Database Schema Requirements
```sql
-- Key fields for location filtering
available_at_location BOOLEAN DEFAULT 1

-- Key fields for admin data preservation
genre TEXT,
mood TEXT,
product_type TEXT,
merch_category TEXT,
is_visible BOOLEAN DEFAULT 1

-- Key fields for sync tracking
last_synced_at TEXT,
square_updated_at TEXT
```

### API Endpoints to Fix
1. `/api/admin/sync` - Main sync endpoint
2. `/api/admin/products` - Admin products list
3. `/api/admin/products/[id]` - Admin product edit
4. `/api/store/products` - Store products list
5. `/api/products/visible` - Public visible products

### Environment Variables
- `SQUARE_LOCATION_ID` - Must be configured for location filtering
- `DB_PATH` - Database file path

## 📊 Success Metrics

- [ ] Admin products page shows only products available at configured location
- [ ] Store page shows same products as admin page (filtered by visibility)
- [ ] Admin edits (genre, mood) persist across sync operations
- [ ] Sync operations complete without errors or data loss
- [ ] All pages load quickly (< 2 seconds)
- [ ] No direct Square API calls from frontend pages

## 🆘 Help Needed / Planner Follow-up

- Confirm `SQUARE_LOCATION_ID` environment variable is set correctly
- Verify Square API permissions include inventory access
- Determine if any existing admin data needs to be preserved before rebuild
- Confirm acceptable downtime window for sync system rebuild

### Phase 7: Chunked Sync Fix
- [x] **Task 7.1**: Fix admin interface chunked sync
  - Update admin sync page to use chunking parameters
  - Implement automatic chunk continuation in admin interface
  - Add progress tracking for chunked sync operations
  - **Success Criteria**: Admin sync processes all chunks automatically

- [x] **Task 7.2**: Add chunked sync to products page
  - Update products page sync button to use chunking
  - Show progress during chunked sync operations
  - Handle sync completion and error states
  - **Success Criteria**: Products page sync processes all products in chunks

- [x] **Task 7.3**: Add chunked sync to admin dashboard
  - Update admin dashboard refresh cache function to use chunking
  - Ensure all admin sync operations process complete product sets
  - **Success Criteria**: All admin sync operations process all chunks automatically

### Phase 8: Hybrid Inventory Approach
- [x] **Task 8.1**: Create public inventory API
  - Create `/api/inventory/public` endpoint for store use
  - Provide real-time inventory data from Square
  - Filter by location and visibility
  - **Success Criteria**: Public API provides accurate inventory data

- [x] **Task 8.2**: Implement hybrid store products API
  - Use Square inventory API for product availability (source of truth)
  - Use database for admin-managed metadata (genre, mood, visibility, etc.)
  - Merge both data sources for complete product information
  - **Success Criteria**: Store shows correct products with all metadata

### Phase 9: Sync System Simplification
- [x] **Task 9.1**: Simplify sync logic
  - Remove complex chunking logic from sync endpoints
  - Simplify admin interfaces to use single sync calls
  - Maintain admin data preservation during sync
  - **Success Criteria**: Sync completes in one operation without chunking

- [x] **Task 9.2**: Clean up old sync utilities
  - Remove unused chunking functions
  - Simplify sync progress tracking
  - Update error handling for simplified sync
  - **Success Criteria**: Clean, maintainable sync code

## 🎯 Updated Architecture

### Data Flow (Hybrid Approach)
```
Square Inventory API → Product Availability (what exists)
Database → Admin Metadata (genre, mood, visibility, etc.)
Store API → Merges both sources for complete product data
```

### Key Benefits
1. **Real-time Inventory**: Square inventory API provides current stock levels
2. **Admin Control**: Database preserves all admin-managed fields
3. **No Sync Issues**: Eliminates complex sync problems
4. **Single Source of Truth**: Square inventory API determines what products exist
5. **Metadata Preservation**: Database maintains genre, mood, visibility, etc.
