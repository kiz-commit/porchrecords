"use client";

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface NavItem {
  id: string;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  children?: NavItem[];
}

export default function AdminNavigation() {
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Add state for editing nav items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);

  const fetchNavigation = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/navigation');
      if (response.ok) {
        const data = await response.json();
        setNavItems(data.navItems || getDefaultNavigation());
      }
    } catch (error) {
      console.error('Failed to fetch navigation:', error);
      setNavItems(getDefaultNavigation());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  const getDefaultNavigation = (): NavItem[] => [
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

  const handleSaveNavigation = async () => {
    try {
      const response = await fetch('/api/admin/navigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ navItems }),
      });

      if (response.ok) {
        alert('Navigation updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update navigation: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving navigation:', error);
      alert('Failed to save navigation. Please try again.');
    }
  };

  const toggleItemActive = (itemId: string) => {
    setNavItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isActive: !item.isActive } : item
    ));
  };

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    setNavItems(prev => {
      const items = [...prev];
      const index = items.findIndex(item => item.id === itemId);
      
      if (direction === 'up' && index > 0) {
        [items[index], items[index - 1]] = [items[index - 1], items[index]];
      } else if (direction === 'down' && index < items.length - 1) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
      }
      
      return items.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  const addNavItem = () => {
    const newItem: NavItem = {
      id: `nav_${Date.now()}`,
      label: 'New Item',
      href: '/new-page',
      order: navItems.length + 1,
      isActive: true
    };
    setNavItems(prev => [...prev, newItem]);
  };

  const removeNavItem = (itemId: string) => {
    if (confirm('Are you sure you want to remove this navigation item?')) {
      setNavItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const handleEditNavItem = (itemId: string) => setEditingItemId(itemId);
  const handleEditChildItem = (childId: string) => setEditingChildId(childId);
  const handleCancelEdit = () => { setEditingItemId(null); setEditingChildId(null); };

  const handleNavItemChange = (itemId: string, field: keyof NavItem, value: string) => {
    setNavItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handleChildItemChange = (parentId: string, childId: string, field: keyof NavItem, value: string) => {
    setNavItems(prev => prev.map(item => {
      if (item.id !== parentId) return item;
      return {
        ...item,
        children: (item.children || []).map(child =>
          child.id === childId ? { ...child, [field]: value } : child
        )
      };
    }));
  };

  const addChildToNavItem = (parentId: string) => {
    setNavItems(prev => prev.map(item => {
      if (item.id !== parentId) return item;
      const newChild: NavItem = {
        id: `child_${Date.now()}`,
        label: 'New Child',
        href: '/new-child',
        order: (item.children?.length || 0) + 1,
        isActive: true,
      };
      return {
        ...item,
        children: [...(item.children || []), newChild],
      };
    }));
  };

  const removeChildFromNavItem = (parentId: string, childId: string) => {
    setNavItems(prev => prev.map(item => {
      if (item.id !== parentId) return item;
      return {
        ...item,
        children: (item.children || []).filter(child => child.id !== childId),
      };
    }));
  };

  const moveChild = (parentId: string, childId: string, direction: 'up' | 'down') => {
    setNavItems(prev => prev.map(item => {
      if (item.id !== parentId) return item;
      const children = [...(item.children || [])];
      const index = children.findIndex(child => child.id === childId);
      if (direction === 'up' && index > 0) {
        [children[index], children[index - 1]] = [children[index - 1], children[index]];
      } else if (direction === 'down' && index < children.length - 1) {
        [children[index], children[index + 1]] = [children[index + 1], children[index]];
      }
      return {
        ...item,
        children: children.map((child, idx) => ({ ...child, order: idx + 1 })),
      };
    }));
  };

  // Add a function to toggle child item active state
  const toggleChildItemActive = (parentId: string, childId: string) => {
    setNavItems(prev => prev.map(item => {
      if (item.id !== parentId) return item;
      return {
        ...item,
        children: (item.children || []).map(child =>
          child.id === childId ? { ...child, isActive: !child.isActive } : child
        )
      };
    }));
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Navigation</h1>
        <p className="mt-2 text-gray-600">
          Manage menu structure and navigation links
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={addNavItem}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Add Item
        </button>
        <button
          onClick={handleSaveNavigation}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
      </div>

      {/* Navigation Items */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Navigation Items</h2>
            <p className="text-sm text-gray-600 mt-1">Drag to reorder or click to edit</p>
          </div>
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading navigation...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {navItems.map((item, index) => (
                <div key={item.id} className="px-6 py-4 flex flex-col gap-2 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col space-y-1">
                        <button onClick={() => moveItem(item.id, 'up')} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
                        <button onClick={() => moveItem(item.id, 'down')} disabled={index === navItems.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
                      </div>
                      {editingItemId === item.id ? (
                        <>
                          <input type="text" value={item.label} onChange={e => handleNavItemChange(item.id, 'label', e.target.value)} className="border px-2 py-1 rounded mr-2" />
                          <input type="text" value={item.href} onChange={e => handleNavItemChange(item.id, 'href', e.target.value)} className="border px-2 py-1 rounded mr-2" />
                          <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-800 text-sm mr-2">Cancel</button>
                          <button onClick={handleCancelEdit} className="text-green-600 hover:text-green-900 text-sm">Done</button>
                        </>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">{item.label}</span>
                          <span className="text-sm text-gray-500">{item.href}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{item.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => toggleItemActive(item.id)} className={`px-3 py-1 text-xs rounded-md ${item.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>{item.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => handleEditNavItem(item.id)} className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                      <button onClick={() => removeNavItem(item.id)} className="text-red-600 hover:text-red-900 text-sm">Remove</button>
                      <button onClick={() => addChildToNavItem(item.id)} className="text-teal-600 hover:text-teal-900 text-sm">Add Child</button>
                    </div>
                  </div>
                  {/* Children (Dropdowns) */}
                  {item.children && item.children.length > 0 && (
                    <div className="ml-10 mt-2 flex flex-col gap-2">
                      {item.children.sort((a, b) => a.order - b.order).map((child, cidx) => (
                        <div key={child.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex flex-col space-y-1">
                              <button onClick={() => moveChild(item.id, child.id, 'up')} disabled={cidx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
                              <button onClick={() => moveChild(item.id, child.id, 'down')} disabled={cidx === item.children!.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
                            </div>
                            {editingChildId === child.id ? (
                              <>
                                <input type="text" value={child.label} onChange={e => handleChildItemChange(item.id, child.id, 'label', e.target.value)} className="border px-2 py-1 rounded mr-2" />
                                <input type="text" value={child.href} onChange={e => handleChildItemChange(item.id, child.id, 'href', e.target.value)} className="border px-2 py-1 rounded mr-2" />
                                <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-800 text-sm mr-2">Cancel</button>
                                <button onClick={handleCancelEdit} className="text-green-600 hover:text-green-900 text-sm">Done</button>
                              </>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-900">{child.label}</span>
                                <span className="text-sm text-gray-500">{child.href}</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${child.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{child.isActive ? 'Active' : 'Inactive'}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => toggleChildItemActive(item.id, child.id)} className={`px-3 py-1 text-xs rounded-md ${child.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>{child.isActive ? 'Deactivate' : 'Activate'}</button>
                            <button onClick={() => handleEditChildItem(child.id)} className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                            <button onClick={() => removeChildFromNavItem(item.id, child.id)} className="text-red-600 hover:text-red-900 text-sm">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 