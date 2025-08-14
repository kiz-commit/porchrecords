import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { withAdminAuth } from '@/lib/route-protection';

const NAVIGATION_FILE = path.join(process.cwd(), 'src', 'data', 'navigation.json');

const readNavigation = () => {
  try {
    if (fs.existsSync(NAVIGATION_FILE)) {
      const data = fs.readFileSync(NAVIGATION_FILE, 'utf8');
      return JSON.parse(data);
    }
    return getDefaultNavigation();
  } catch (error) {
    console.error('Error reading navigation file:', error);
    return getDefaultNavigation();
  }
};

const writeNavigation = (navItems: any[]) => {
  try {
    const dir = path.dirname(NAVIGATION_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(NAVIGATION_FILE, JSON.stringify(navItems, null, 2));
  } catch (error) {
    console.error('Error writing navigation file:', error);
    throw error;
  }
};

const getDefaultNavigation = () => [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    order: 1,
    isActive: true
  },
  {
    id: 'store',
    label: 'Store',
    href: '/store',
    order: 2,
    isActive: true
  },
  {
    id: 'studio',
    label: 'Studio',
    href: '/studio',
    order: 3,
    isActive: true
  },
  {
    id: 'shows',
    label: 'Shows',
    href: '/shows',
    order: 4,
    isActive: false
  },
  {
    id: 'about',
    label: 'About',
    href: '/about',
    order: 5,
    isActive: false
  },
  {
    id: 'contact',
    label: 'Contact',
    href: '/contact',
    order: 6,
    isActive: false
  }
];

// GET - Fetch navigation
async function getHandler() {
  try {
    const navItems = readNavigation();
    
    return NextResponse.json({
      navItems,
      total: navItems.length,
    });
  } catch (error) {
    console.error('Error fetching navigation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch navigation' },
      { status: 500 }
    );
  }
}

// POST - Update navigation
async function postHandler(request: NextRequest) {
  try {
    const { navItems } = await request.json();
    
    if (!navItems || !Array.isArray(navItems)) {
      return NextResponse.json(
        { error: 'Navigation items array is required' },
        { status: 400 }
      );
    }

    // Validate navigation items
    for (const item of navItems) {
      if (!item.id || !item.label || !item.href) {
        return NextResponse.json(
          { error: 'Each navigation item must have id, label, and href' },
          { status: 400 }
        );
      }
    }

    // Sort by order
    const sortedNavItems = navItems.sort((a: any, b: any) => a.order - b.order);
    
    writeNavigation(sortedNavItems);

    return NextResponse.json({
      success: true,
      message: 'Navigation updated successfully',
      navItems: sortedNavItems
    });
  } catch (error) {
    console.error('Error saving navigation:', error);
    return NextResponse.json(
      { error: 'Failed to save navigation' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const GET = withAdminAuth(getHandler);
export const POST = withAdminAuth(postHandler, true); 