# Porch Records – System Plan

## Technical Stack (Chosen for Simplicity & Flexibility)

| Layer        | Choice | Rationale |
|--------------|--------|-----------|
| Front-end    | **Next.js 14** (React, App Router) with TypeScript & Tailwind CSS | Mature React meta-framework, supports hybrid static/server rendering, excellent ecosystem, Vercel hosting friendly.  Tailwind accelerates consistent styling. |
| Back-end API | **Next.js API Routes / Edge Functions** calling **Square REST & GraphQL APIs** | Keeps stack unified; only small serverless endpoints are needed to proxy Square requests, handle auth tokens, map custom tags. |
| Data Store   | **Square Catalog & Orders** = source of truth for inventory & sales.<br/>**SQLite or Supabase** (TBD) for auxiliary data like poster archive & custom curation tags. | Avoid duplicating product data; keep a lightweight DB for site-specific metadata. |
| CMS          | **Sanity v3** _or_ simple Markdown/MDX files in repo | Allows non-devs to update content pages & live-show info easily. |
| Auth (Admin) | GitHub / Clerk / Next-Auth – minimal, only for staff admin area. <br/>**Customer auth and account management handled exclusively by Square. No local customer auth or PII storage.** |
| Deployment   | **Vercel** (Preview & Production) | Zero-config for Next.js, fast global CDN, environment secrets. |

## Key Integrations
1. **Square Catalog Sync** – cron or webhook to fetch product/stock updates, cache in local DB / ISR.
2. **Square Checkout API** – **Square Hosted Checkout for maximum PCI compliance. All payment data handled entirely by Square's secure hosted checkout pages.**
3. **Humanitix Widget** – iframe embed on Live Shows page.
4. **Social / SEO** – OpenGraph tags, sitemap, playlists.

## Site Configuration System (New)

### Overview
The site will be made fully configurable through a comprehensive configuration system that allows non-technical staff to customize the site's appearance and content without developer intervention.

### Architecture Components

#### 1. Homepage Configuration
- **Hero Section**: Extend existing hero image management with additional configurable elements
- **Dynamic Sections**: Add configurable sections below the hero using the existing PageBuilder system
- **Section Types**: Featured products, latest releases, upcoming shows, about preview, newsletter signup
- **Layout Options**: Full-width, contained, grid layouts, spacing controls

#### 2. Global Theme Configuration
- **Color System**: Primary, secondary, accent colors with CSS custom properties
- **Typography**: Font family selection, size scales, weight options
- **Spacing**: Global spacing scale configuration
- **Effects**: Animation settings, hover effects, transitions
- **Brand Elements**: Logo positioning, navigation styling, footer configuration

#### 3. Configuration Storage
- **Database Tables**: 
  - `site_config` - Global theme settings
  - `homepage_sections` - Homepage section configuration
  - `theme_presets` - Pre-built theme configurations
- **API Endpoints**: CRUD operations for all configuration data
- **Caching**: Redis or in-memory caching for performance

#### 4. Admin Interface
- **Configuration Dashboard**: Central hub for all site customization
- **Theme Editor**: Visual theme customization with live preview
- **Homepage Builder**: Drag-and-drop section management
- **Preset System**: Pre-built themes and configurations

### Implementation Strategy

#### Phase 1: Foundation
1. **Database Schema**: Create configuration tables
2. **API Layer**: Build configuration CRUD endpoints
3. **CSS Custom Properties**: Convert hardcoded styles to CSS variables
4. **Configuration Context**: React context for theme data

#### Phase 2: Homepage Enhancement
1. **Section System**: Extend PageBuilder for homepage sections
2. **Hero Enhancement**: Add configurable elements to hero section
3. **Section Types**: Create homepage-specific section components
4. **Admin Interface**: Build homepage configuration UI

#### Phase 3: Global Theme System
1. **Theme Engine**: Build theme configuration system
2. **Color Management**: Color picker and palette system
3. **Typography System**: Font selection and configuration
4. **Preset System**: Pre-built themes and configurations

#### Phase 4: Page Integration
1. **Style Refactor**: Convert all pages to use configurable styles
2. **Component Updates**: Update components to use theme variables
3. **Responsive Design**: Ensure all configurations work across devices
4. **Performance Optimization**: Optimize theme loading and caching

### Technical Implementation

#### CSS Custom Properties Structure
```css
:root {
  /* Colors */
  --color-primary: #E1B84B;
  --color-secondary: #B86B3A;
  --color-background: #F8F6F2;
  --color-foreground: #181818;
  
  /* Typography */
  --font-primary: 'EB Garamond', serif;
  --font-secondary: 'Space Mono', monospace;
  --font-size-base: 16px;
  --font-size-scale: 1.25;
  
  /* Spacing */
  --spacing-unit: 8px;
  --spacing-scale: 1.5;
  
  /* Effects */
  --transition-speed: 0.3s;
  --border-radius: 4px;
}
```

#### Configuration Data Structure
```typescript
interface SiteConfig {
  theme: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      foreground: string;
    };
    typography: {
      primaryFont: string;
      secondaryFont: string;
      baseSize: number;
      scale: number;
    };
    spacing: {
      unit: number;
      scale: number;
    };
    effects: {
      transitionSpeed: number;
      borderRadius: number;
    };
  };
  homepage: {
    hero: {
      images: HeroImage[];
      title: string;
      subtitle: string;
      showLocation: boolean;
    };
    sections: HomepageSection[];
  };
}
```

#### Database Schema
```sql
CREATE TABLE site_config (
  id INTEGER PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE homepage_sections (
  id INTEGER PRIMARY KEY,
  section_type TEXT NOT NULL,
  section_data TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE theme_presets (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  config_data TEXT NOT NULL,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Benefits
1. **Non-Technical Management**: Staff can customize site without developer help
2. **Consistent Branding**: Centralized theme management ensures consistency
3. **Rapid Iteration**: Quick theme and content changes for marketing campaigns
4. **Performance**: Optimized theme loading and caching
5. **Scalability**: Easy to add new configuration options
6. **Backup & Recovery**: Theme presets and configuration backups

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Configuration conflicts | Validation system and conflict resolution |
| Performance impact | Caching layer and optimized CSS generation |
| Complex UI | Intuitive admin interface with live preview |
| Breaking changes | Version control and rollback system |

## Payment Processing Architecture (Updated)

### Square Checkout API Integration
- **Payment Link Creation**: API endpoint creates Square Checkout payment links
- **Hosted Checkout**: Customers redirected to Square's secure checkout pages
- **Order Creation**: Orders created in Square via Checkout API
- **Payment Processing**: All payment data handled by Square (maximum PCI compliance)
- **Return Handling**: Customers redirected back to site after payment

### Benefits of Square Checkout API
1. **Maximum PCI Compliance**: No payment data touches our servers
2. **Simplified Implementation**: No custom payment forms to maintain
3. **Better Mobile Experience**: Square's optimized checkout pages
4. **Built-in Features**: Digital wallets, Afterpay, international payments
5. **Reduced Maintenance**: Less custom code to maintain
6. **Better Security**: Square handles all sensitive payment data

### Implementation Flow
1. Customer adds items to cart
2. Customer clicks "Checkout" button
3. Our API creates Square Checkout payment link
4. Customer redirected to Square hosted checkout
5. Customer completes payment on Square's secure pages
6. Square redirects back to our success page
7. Order confirmation shows real data from Square

## Phased Roll-out
1. **Phase 0 – Foundations**
   • Repo scaffolding, Tailwind config, CI.
2. **Phase 1 – Public MVP**
   • Home page hero (TouchingBass-style split), navigation, footer.
   • Store listing page powered by Square (basic categories, search).
3. **Phase 2 – Content & Shows**
   • Live Shows page with poster archive + upcoming widget.
   • Summertown Studio, DJs, About pages (MDX/Sanity driven).
4. **Phase 3 – Unique Sorting System & Pre-orders**
   • Admin UI to assign custom curation tags to Square items.
   • Listing filters (Porch Picks, Kitchen Boogies …) + "Pre-order" badge.
5. **Phase 4 – Square Checkout Integration**
   • Replace custom payment forms with Square Checkout API
   • Implement hosted checkout flow
   • Update order management for Square Checkout orders
6. **Phase 5 – Site Configuration System**
   • Implement global theme configuration
   • Extend homepage with configurable sections
   • Build configuration admin interface
7. **Phase 6 – Style System Refactor**
   • Convert all pages to use configurable styling
   • Update components to use theme variables
   • Implement theme presets and backup system
8. **Phase 7 – Polish & Deployment Hardening**
   • Performance, SEO, accessibility checks.
   • Error monitoring (Sentry), analytics (Plausible/GA).

## Homepage Design Update (June 2024)

- The homepage will feature a full-bleed hero image carousel (rotating images, either auto or manual).
- The main navigation menu will be a right-aligned, vertical panel overlaying the hero image, with a solid or semi-transparent background.
- The logo will be minimized and placed in a non-dominant position (top left or right).
- Only essential navigation links (5–6 max) will be shown in the menu, styled with the current color palette and modern, generous spacing.
- Social icons will be placed at the bottom of the menu panel.
- Typography and color usage will remain consistent with the current retro-modern brand identity (yellow/black/cream, bold sans-serif fonts).
- The overall feel will be simple, sexy, and modern, with a nod to retro record label vibes, inspired by the TouchingBass reference.

## Open Questions / Assumptions
- Will Square Checkout suffice or do we need a fully custom cart? _Assume Square Checkout is acceptable for v1._
- Preference between Sanity vs MDX for content? _Assume MDX initially, upgrade later if needed._
- Will custom curation tags be managed in Square's metadata or separate DB? _Lean toward separate table for flexibility._
- **Customer account management, order history, and checkout will be handled by Square for maximum security.**
- **Payment processing will use Square Checkout API for full PCI compliance.**
- **Site configuration will be stored in database with caching for performance.**
- **Theme system will use CSS custom properties for maximum flexibility.**

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Square API rate limits or latency | Cache catalog in DB, use ISR.
| Designer sign-off delays | Develop from agreed Figma or reference sites early.
| SEO impact during migration | 301 redirects & prerender pages.
| Customer experience changes with Square Checkout | Test thoroughly and provide clear messaging.
| Configuration complexity | Intuitive admin interface with live preview and presets.
| Performance impact of theme system | Optimized CSS generation and caching.

# System Plan

## 1. High-Level Architecture

This project is a Next.js application built with TypeScript and styled using Tailwind CSS. The primary goal is to create a visually engaging e-commerce and portfolio site for Porch Records.

## 2. Homepage Redesign (October 2023)

To create a more focused and immersive user experience, the homepage will be redesigned with the following principles:

-   **Full-Width Hero Image**: The current two-column layout will be replaced by a single, full-width hero image that serves as the background for the initial viewport.
-   **Consolidated Navigation**: The top and side navigation menus will be merged into a single, persistent navigation bar at the top of the page. This bar will have a semi-transparent background to ensure readability while maintaining visual continuity with the hero image.
-   **Centered Branding**: The "PORCH RECORDS" title and the brand tagline will be overlaid and centered on the hero image, creating a strong focal point.

This change simplifies the user interface, reduces clutter, and enhances the retro, atmospheric vibe of the brand. 

## Product Management & Sync (Admin)

- **Source of Truth:** All product data (creation, updates, deletion) is managed directly in Square via the Square Catalog API. The admin UI does not store or cache product data locally except for temporary UI state.
- **Admin CRUD:**
    - Creating a product in the admin panel creates it in Square.
    - Editing a product updates it in Square.
    - Deleting a product removes it from Square.
    - All product lists in admin and store are fetched live (or via short-lived cache) from Square.
- **Sync:**
    - After any admin action, the UI re-fetches the product list from Square to ensure consistency.
    - No local product data is persisted except for auxiliary metadata (e.g., curation tags, if not supported in Square).
- **Error Handling:**
    - All admin actions provide user feedback on success/failure, with error details if Square API calls fail.
- **Data Consistency:**
    - The store and admin always reflect the current state of Square. No duplicates or stale data.

## Payment Processing (Updated for Square Checkout API)

### Current State
- Using Square Web Payments SDK with custom payment forms
- Tokenization and payment processing handled locally
- Complex PCI compliance requirements

### Target State (Square Checkout API)
- Square Checkout API for payment link creation
- Hosted checkout pages for maximum PCI compliance
- Simplified implementation with better security

### Migration Benefits
1. **Maximum PCI Compliance**: All payment data handled by Square
2. **Simplified Implementation**: No custom payment forms to maintain
3. **Better Mobile Experience**: Square's optimized checkout pages
4. **Built-in Features**: Digital wallets, Afterpay, international payments
5. **Reduced Maintenance**: Less custom code to maintain
6. **Better Security**: Square handles all sensitive payment data

### Implementation Plan
1. Create Square Checkout API integration
2. Replace custom payment forms with hosted checkout
3. Update order management for Square Checkout orders
4. Remove legacy payment code
5. Test and validate complete flow 