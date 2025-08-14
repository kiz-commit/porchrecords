"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { MERCH_CATEGORIES } from '@/lib/types';

interface Category {
  id: string;
  name: string;
  type: 'record' | 'merch' | 'accessory';
  description?: string;
  isActive: boolean;
}

interface MerchCategory {
  id: string;
  name: string;
  sizes?: string;
  colors?: string;
  isActive: boolean;
}

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchCategories, setMerchCategories] = useState<MerchCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'main' | 'merch'>('main');

  // Form states for main categories
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'record' as 'record' | 'merch' | 'accessory',
    description: ''
  });

  // Form states for merch categories
  const [newMerchCategory, setNewMerchCategory] = useState({
    name: '',
    sizes: '',
    colors: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      // Load main categories
      const mainCategories: Category[] = [
        { id: 'records', name: 'Records', type: 'record', description: 'Vinyl records, CDs, and other music formats', isActive: true },
        { id: 'merch', name: 'Merch', type: 'merch', description: 'T-shirts, hoodies, hats, and other merchandise', isActive: true },
        { id: 'accessories', name: 'Accessories', type: 'accessory', description: 'Vinyl accessories, home goods, and other items', isActive: true }
      ];
      setCategories(mainCategories);

      // Load merch categories
      const merchCats: MerchCategory[] = MERCH_CATEGORIES.map(cat => ({
        id: cat.toLowerCase().replace(/\s+/g, '-'),
        name: cat,
        sizes: cat === 'T-Shirts' || cat === 'Hoodies' ? 'XS,S,M,L,XL,XXL' : 'One Size',
        colors: 'Black,Navy,White,Various',
        isActive: true
      }));
      setMerchCategories(merchCats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMainCategory = () => {
    if (!newCategory.name.trim()) return;

    const category: Category = {
      id: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
      name: newCategory.name,
      type: newCategory.type,
      description: newCategory.description,
      isActive: true
    };

    setCategories([...categories, category]);
    setNewCategory({ name: '', type: 'record', description: '' });
  };

  const handleAddMerchCategory = () => {
    if (!newMerchCategory.name.trim()) return;

    const category: MerchCategory = {
      id: newMerchCategory.name.toLowerCase().replace(/\s+/g, '-'),
      name: newMerchCategory.name,
      sizes: newMerchCategory.sizes || 'One Size',
      colors: newMerchCategory.colors || 'Various',
      isActive: true
    };

    setMerchCategories([...merchCategories, category]);
    setNewMerchCategory({ name: '', sizes: '', colors: '' });
  };

  const toggleCategoryActive = (id: string, type: 'main' | 'merch') => {
    if (type === 'main') {
      setCategories(categories.map(cat => 
        cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
      ));
    } else {
      setMerchCategories(merchCategories.map(cat => 
        cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
      ));
    }
  };

  const deleteCategory = (id: string, type: 'main' | 'merch') => {
    if (type === 'main') {
      setCategories(categories.filter(cat => cat.id !== id));
    } else {
      setMerchCategories(merchCategories.filter(cat => cat.id !== id));
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Categories</h1>
          <p className="mt-2 text-gray-600">
            Manage your product categories and merchandise types
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('main')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'main'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Main Categories
          </button>
          <button
            onClick={() => setActiveTab('merch')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'merch'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Merch Categories
          </button>
        </nav>
      </div>

      {/* Main Categories Tab */}
      {activeTab === 'main' && (
        <div className="space-y-6">
          {/* Add New Main Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Cassettes, Posters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={newCategory.type}
                  onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as 'record' | 'merch' | 'accessory' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="record">Records</option>
                  <option value="merch">Merch</option>
                  <option value="accessory">Accessories</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Brief description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddMainCategory}
                  disabled={!newCategory.name.trim()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>

          {/* Main Categories List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Main Categories</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.type === 'record' ? 'bg-purple-100 text-purple-800' :
                          category.type === 'merch' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {category.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {category.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => toggleCategoryActive(category.id, 'main')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {category.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteCategory(category.id, 'main')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Merch Categories Tab */}
      {activeTab === 'merch' && (
        <div className="space-y-6">
          {/* Add New Merch Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Merch Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newMerchCategory.name}
                  onChange={(e) => setNewMerchCategory({ ...newMerchCategory, name: e.target.value })}
                  placeholder="e.g., Beanies, Mugs"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Sizes
                </label>
                <input
                  type="text"
                  value={newMerchCategory.sizes}
                  onChange={(e) => setNewMerchCategory({ ...newMerchCategory, sizes: e.target.value })}
                  placeholder="XS,S,M,L,XL,One Size"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Colors
                </label>
                <input
                  type="text"
                  value={newMerchCategory.colors}
                  onChange={(e) => setNewMerchCategory({ ...newMerchCategory, colors: e.target.value })}
                  placeholder="Black,Navy,White,Various"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddMerchCategory}
                  disabled={!newMerchCategory.name.trim()}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>

          {/* Merch Categories List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Merch Categories</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sizes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Colors
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {merchCategories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {category.sizes || 'One Size'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {category.colors || 'Various'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => toggleCategoryActive(category.id, 'merch')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {category.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteCategory(category.id, 'merch')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 