# Porch Records Website Revamp

## Background / Why
Porch Records is an independent record label, physical record store, live-music promoter, and creative studio based in Adelaide. Their existing site (porchrecords.com.au) is dated and does not represent the brand's forward-thinking curation, nor does it integrate with the in-store Square POS that runs daily sales. A modern, unified web presence is required to showcase releases, sell records & merch online, promote live shows and communicate the broader creative work carried out at Summertown Studio.

The goal is to create a professional yet creative energy, to elevate & showcase our future, existing & previous work. The site should be more than just functional; it should be edgy and reflective of the music, brands and labels they represent.

## Purpose / Goals
1.  **Re-launch porchrecords.com.au** with a fresh, visually striking design that still feels warm & community-oriented.
2.  **Launch an Online Store:**
    *   Powered by the existing **Square POS** to keep inventory synced.
    *   Sell vinyl (Jazz, Funk, Soul, Hip Hop, international grooves) and merchandise.
    *   Feature a **unique online sorting system** (e.g., "Porch Picks," "Kitchen Boogies," "Island Time").
    *   Support **pre-orders**.
    *   Explore retailing turntables and accessories.
3.  **Showcase Live Shows:**
    *   Archive of past show posters.
    *   Embed a **Humanitix Widget** for upcoming show ticket sales.
4.  **Feature Summertown Studio:**
    *   Provide a brief overview of the space and its music elements (Winetime, Duck Radio, etc.).
5.  **Create a DJs Page:**
    *   A holding page for venues where Porch Records DJs frequently play (e.g., Latteria, Oddio) and upcoming dates.
6.  **Tell Our Story:**
    *   An "About" page detailing who Porch Records are and their mission.
7.  **Enable In-House Management:**
    *   Allow the Porch team to manage stock, orders, and make small site changes independently.
8.  **Complete E-commerce Experience:**
    *   Customer authentication and account management via Square only (no local storage of credentials or PII).
    *   Shopping cart functionality (non-sensitive data only).
    *   Complete Square checkout integration (all payment data handled by Square).
    *   Order management and tracking via Square.
    *   Admin order management interface (Square Dashboard or secure API only).
9.  **Make Site Fully Configurable:**
    *   **Homepage Configuration**: Extend current hero image management to include configurable sections below the hero
    *   **Global Theme Configuration**: Allow customization of fonts, colors, and overall site styling
    *   **Page Builder Integration**: Leverage existing PageBuilder system for homepage sections
    *   **Style Consistency**: Ensure all customer-facing pages use configurable styling system

## Current Status (December 2024)

### ✅ Completed Features
- **Store Foundation**: Product display, search, filtering, and navigation
- **Payment Integration**: Basic Square payment form integration
- **Admin Panel**: Complete product management with Square API integration
- **Content Management**: Curation tags, genres, merch categories, preorders, shows
- **Inventory Management**: Real-time Square inventory integration
- **Customer Authentication**: Registration, login, logout, and session management
- **Page Builder System**: Complete page building system with sections, templates, and publishing
- **Homepage Hero Management**: Basic hero image carousel configuration

### 🔄 In Progress
- **Enhanced Checkout**: Complete Square Orders API integration
- **Shopping Cart**: Cart functionality and persistence
- **Order Management**: Admin order management interface

### ❌ Pending
- **Square Customer API**: Real customer data management (handled by Square only; no local storage).
- **Order Processing**: Complete order creation and payment processing (Square only).
- **Webhooks**: Real-time order and inventory updates.
- **Analytics**: Sales reporting and analytics dashboard.
- **Site Configuration System**: Homepage sections and global theme configuration
- **Style System Refactor**: Convert all pages to use configurable styling

## Stakeholders
- Porch Records founders & staff (site owners, day-to-day operators)
- In-store customers purchasing via Square POS
- Online customers globally purchasing vinyl & merch
- Artists & promoters collaborating on live shows
- Development team (this repo)

## Non-Goals / Out of Scope (for now)
- Building a bespoke POS – Square remains the source of truth.
- Complex CRM / mailing-list tooling (may embed existing platforms later).

## Success Criteria
- End-to-end purchase flow (browse → cart → Square checkout) works on mobile & desktop.
- A staff member with no dev knowledge can:
  • Add a new product in Square → it appears online within <5 min.
  • Tag that product with a Porch-specific curation tag inside the admin UI.
  • Publish a new live show with poster & Humanitix widget.
  • Manage customer orders and update order status.
  • Configure homepage sections and global site styling without developer assistance.
- Page-load LCP < 2 s on 4G for homepage & store listing.
- Visual design is signed off by Porch Records team.
- Site maintains consistent styling while being fully configurable.

## High-Level Timeline (indicative)
1. Architecture & repo setup. ✅
2. MVP launch – homepage + store listing powered by Square. ✅
3. Content pages & live shows. ✅
4. Admin tooling & unique sorting system. ✅
5. Customer authentication & account management. ✅
6. Complete checkout & order management. 🚧
7. Site configuration system implementation. 📋
8. Style system refactor for all pages. 📋
9. Polish, SEO, deployment hardening.