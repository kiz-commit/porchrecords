"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useCartContext } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import GlobalSearch from "./GlobalSearch";


interface NavItem {
  id: string;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  children?: NavItem[];
}

const rightLinks = [
  { href: "/order-history", label: "ORDERS" },
  { href: "/cart", label: "CART" },
];

export default function Navigation() {
  const headerRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { cart } = useCartContext();
  // Add state for open mobile dropdown
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if navigation data is available from server
    if (typeof window !== 'undefined' && (window as any).__NAVIGATION_DATA__) {
      const serverNavItems = (window as any).__NAVIGATION_DATA__;
      setNavItems(serverNavItems.filter((item: NavItem) => item.isActive));
      setLoading(false);
    } else {
      // Fallback to client-side fetch if server data is not available
      fetchNavItems();
    }
  }, []);

  // Initialize with server data immediately if available
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__NAVIGATION_DATA__ && navItems.length === 0) {
      const serverNavItems = (window as any).__NAVIGATION_DATA__;
      setNavItems(serverNavItems.filter((item: NavItem) => item.isActive));
      setLoading(false);
    }
  }, [navItems.length]);

  const fetchNavItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/navigation");
      if (res.ok) {
        const data = await res.json();
        setNavItems((data.navItems || []).filter((item: NavItem) => item.isActive));
      }
    } catch (e) {
      setNavItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Set header height CSS variable
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = headerRef.current;
      if (header) {
        const height = header.offsetHeight;
        document.documentElement.style.setProperty('--nav-height', `${height}px`);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [mobileOpen]);

  // Set announcement bar height CSS variable
  useEffect(() => {
    // Check if announcement bar is visible
    const bar = document.querySelector('[data-announcement-bar]');
    if (bar) {
      document.documentElement.style.setProperty('--announcement-bar-height', '40px');
    } else {
      document.documentElement.style.setProperty('--announcement-bar-height', '0px');
    }
  });

  return (
    <>
      <header 
        ref={headerRef}
        className="w-full fixed left-0 right-0 z-50"
        style={{ 
          top: 'var(--announcement-bar-height, 0px)',
          backgroundColor: 'var(--color-mustard)',
          borderBottom: '2px solid var(--color-clay)'
        }}
      >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2 md:py-3 relative">
        {/* Left: Main nav links */}
        <div className="flex items-center gap-6">
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className="sr-only">Open menu</span>
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="hidden md:flex gap-6">
            {/* Static navigation for immediate display */}
            <div className="relative group">
              <Link href="/store" className="font-mono text-[color:var(--black)] text-lg tracking-wide px-1 py-0.5 relative group transition-colors duration-200 uppercase hover:underline hover:decoration-[3px] hover:decoration-[color:var(--mustard)] flex items-center" data-cursor="nav">
                STORE
              </Link>
            </div>
            <div className="relative group">
              <Link href="/shows" className="font-mono text-[color:var(--black)] text-lg tracking-wide px-1 py-0.5 relative group transition-colors duration-200 uppercase hover:underline hover:decoration-[3px] hover:decoration-[color:var(--mustard)] flex items-center" data-cursor="nav">
                SHOWS
              </Link>
            </div>
            <div className="relative group">
              <Link href="/studio" className="font-mono text-[color:var(--black)] text-lg tracking-wide px-1 py-0.5 relative group transition-colors duration-200 uppercase hover:underline hover:decoration-[3px] hover:decoration-[color:var(--mustard)] flex items-center" data-cursor="nav">
                STUDIO
                <span className="ml-1 text-xs align-middle">▼</span>
              </Link>
              <div 
                className="absolute left-0 top-full min-w-[160px] shadow-lg rounded mt-0 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity transition-shadow z-40" 
                style={{ 
                  transitionDelay: '75ms',
                  backgroundColor: 'var(--color-mustard)',
                  border: '1px solid var(--color-clay)'
                }}
              >
                <Link 
                  href="/new-child2" 
                  className="block px-6 py-2 text-base font-mono text-[color:var(--black)] hover:underline transition-colors whitespace-nowrap" 
                  style={{
                    backgroundColor: 'var(--color-mustard)',
                    '--tw-bg-opacity': '0.8'
                  } as React.CSSProperties}
                  data-cursor="nav"
                >
                  New Child
                </Link>
              </div>
            </div>
            <div className="relative group">
              <Link href="/djs" className="font-mono text-[color:var(--black)] text-lg tracking-wide px-1 py-0.5 relative group transition-colors duration-200 uppercase hover:underline hover:decoration-[3px] hover:decoration-[color:var(--mustard)] flex items-center" data-cursor="nav">
                DJS
              </Link>
            </div>
            <div className="relative group">
              <Link href="/about" className="font-mono text-[color:var(--black)] text-lg tracking-wide px-1 py-0.5 relative group transition-colors duration-200 uppercase hover:underline hover:decoration-[3px] hover:decoration-[color:var(--mustard)] flex items-center" data-cursor="nav">
                ABOUT
              </Link>
            </div>
          </div>
        </div>
        {/* Center: Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center group" style={{ marginTop: '2px' }}>
          <Link href="/">
            <Image src="/logo.png" alt="Porch Records Logo" width={48} height={48} className="inline-block record-spin spin-on-group-hover" />
          </Link>
        </div>
        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Mobile: Icon buttons */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
              aria-label="Search"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Cart Icon */}
            <Link href="/cart" className="p-2 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors relative">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cart.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-clay)' }}>
                  {cart.totalItems}
                </span>
              )}
            </Link>
          </div>
          
          {/* Desktop: Text buttons */}
          <div className="hidden md:flex items-center gap-6">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="font-mono text-[color:var(--black)] text-lg tracking-wide px-1 py-0.5 relative group transition-colors duration-200 uppercase hover:underline hover:decoration-[3px] hover:decoration-[color:var(--mustard)] flex items-center"
              data-cursor="nav"
              aria-label="Search"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              SEARCH
            </button>
            
            {rightLinks.map(link => (
              <Link key={link.href} href={link.href} className="font-mono text-[color:var(--black)] text-lg tracking-wide px-1 py-0.5 relative group transition-colors duration-200 uppercase hover:underline hover:decoration-[3px] hover:decoration-[color:var(--mustard)]" data-cursor="nav">
                {link.label}
                {link.href === '/cart' && cart.totalItems > 0 && (
                  <span className="ml-1 text-white rounded-full px-2 py-0.5 text-xs align-top"
                        style={{ backgroundColor: 'var(--color-clay)' }}>{cart.totalItems}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
        {/* Mobile menu */}
        {mobileOpen && (
          <div 
            className="absolute top-full left-0 w-full flex flex-col items-start gap-4 px-4 py-4 md:hidden z-50 border-b"
            style={{ 
              backgroundColor: 'var(--color-mustard)',
              borderColor: 'var(--color-clay)'
            }}
          >
            {!loading && navItems.length > 0 && (
              navItems.sort((a, b) => a.order - b.order).map(item => {
                const children = item.children ?? [];
                const hasChildren = children.filter(child => child.isActive).length > 0;
                const isOpen = openDropdown === item.id;
                return item.isActive && (
                  <div key={item.id} className="w-full">
                    <div className="w-full flex items-center justify-between border-b border-black"
                         style={{ backgroundColor: 'var(--color-mustard)' }}>
                      <Link
                        href={item.href}
                        className="flex-1 font-mono text-[color:var(--black)] text-lg tracking-wide px-6 py-4 uppercase hover:underline hover:decoration-[3px] hover:decoration-[color:var(--mustard)] focus:outline-none text-left"
                        style={{ fontWeight: 700 }}
                        data-cursor="nav"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                      {hasChildren && (
                        <button
                          className="px-6 py-4 text-xl focus:outline-none"
                          aria-label={isOpen ? `Close ${item.label} menu` : `Open ${item.label} menu`}
                          onClick={e => {
                            e.preventDefault();
                            setOpenDropdown(isOpen ? null : item.id);
                          }}
                          tabIndex={0}
                          type="button"
                        >
                          {isOpen ? '▲' : '▼'}
                        </button>
                      )}
                    </div>
                    {hasChildren && isOpen && (
                      <div className="w-full border-b border-black"
                           style={{ backgroundColor: 'var(--color-mustard)' }}>
                        {children
                          .filter(child => child.isActive)
                          .sort((a, b) => a.order - b.order)
                          .map(child => (
                            <Link
                              key={child.id}
                              href={child.href}
                              className="block w-full px-10 py-4 text-base font-mono text-[color:var(--black)] hover:underline transition-colors whitespace-nowrap border-b border-black"
                              style={{ 
                                fontWeight: 500,
                                backgroundColor: 'var(--color-mustard)',
                                '--tw-bg-opacity': '0.8'
                              } as React.CSSProperties}
                              data-cursor="nav"
                              onClick={() => setMobileOpen(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div className="border-t w-full my-2" style={{ borderColor: 'var(--color-clay)' }}></div>
            {/* Mobile Search Button */}
            <button
              onClick={() => {
                setSearchOpen(true);
                setMobileOpen(false);
              }}
              className="font-mono text-[color:var(--black)] text-lg tracking-wide px-1 py-0.5 relative group transition-colors duration-200 uppercase hover:underline hover:decoration-[3px] hover:decoration-[color:var(--mustard)] w-full flex items-center"
              data-cursor="nav"
              aria-label="Search"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              SEARCH
            </button>
            
            {rightLinks.map(link => (
              <Link key={link.href} href={link.href} className="font-mono text-[color:var(--black)] text-lg tracking-wide px-1 py-0.5 relative group transition-colors duration-200 uppercase hover:underline hover:decoration-[3px] hover:decoration-[color:var(--mustard)] w-full" data-cursor="nav" onClick={() => setMobileOpen(false)}>
                {link.label}
                {link.href === '/cart' && cart.totalItems > 0 && (
                  <span className="ml-1 text-white rounded-full px-2 py-0.5 text-xs align-top"
                        style={{ backgroundColor: 'var(--color-clay)' }}>{cart.totalItems}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
    
    {/* Global Search Modal - Outside header for proper overlay */}
    <GlobalSearch 
      isOpen={searchOpen} 
      onClose={() => setSearchOpen(false)} 
    />
  </>
  );
} 