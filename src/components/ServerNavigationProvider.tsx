import fs from 'fs';
import path from 'path';

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

export async function ServerNavigationProvider() {
  const navItems = readNavigation();
  
  // Return a script tag that injects the navigation data into the window object
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.__NAVIGATION_DATA__ = ${JSON.stringify(navItems)};
        `
      }}
    />
  );
} 