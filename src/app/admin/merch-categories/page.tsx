"use client";

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { MERCH_CATEGORIES } from '@/lib/types';

interface MerchAssignment {
  productId: string;
  productName: string;
  productType: string;
  merchCategory: string;
  size?: string;
  color?: string;
}

export default function MerchCategoriesAdmin() {
  const [assignments, setAssignments] = useState<MerchAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedMerchCategory, setSelectedMerchCategory] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    // Load current assignments
    fetch('/api/admin/merch-categories')
      .then(res => res.json())
      .then(data => {
        setAssignments(data.assignments || []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to load merch category assignments:', error);
        setIsLoading(false);
      });
  }, []);

  const handleAssignMerch = async () => {
    if (!selectedProduct || !selectedProductType || !selectedMerchCategory) return;

    try {
      const response = await fetch('/api/admin/merch-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct,
          productType: selectedProductType,
          merchCategory: selectedMerchCategory,
          size: selectedSize,
          color: selectedColor,
        }),
      });

      if (response.ok) {
        // Refresh assignments
        const updatedAssignments = [...assignments];
        const existingIndex = updatedAssignments.findIndex(a => a.productId === selectedProduct);
        
        if (existingIndex >= 0) {
          updatedAssignments[existingIndex] = {
            ...updatedAssignments[existingIndex],
            productType: selectedProductType,
            merchCategory: selectedMerchCategory,
            size: selectedSize,
            color: selectedColor,
          };
        } else {
          updatedAssignments.push({
            productId: selectedProduct,
            productName: 'Unknown Product', // Would be fetched from Square
            productType: selectedProductType,
            merchCategory: selectedMerchCategory,
            size: selectedSize,
            color: selectedColor,
          });
        }
        
        setAssignments(updatedAssignments);
        setSelectedProduct('');
        setSelectedProductType('');
        setSelectedMerchCategory('');
        setSelectedSize('');
        setSelectedColor('');
      }
    } catch (error) {
      console.error('Failed to assign merch category:', error);
    }
  };

  const handleRemoveAssignment = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/merch-categories/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAssignments(assignments.filter(a => a.productId !== productId));
      }
    } catch (error) {
      console.error('Failed to remove merch category assignment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Merch Categories Management</h1>
            <p className="mt-2 text-gray-600">
              Manage merch categories: T-Shirts, Hoodies, Hats, Totes, Stickers, Posters, Pins, Vinyl Accessories, Home Goods, Limited Edition
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Add New Assignment */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Merch Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID
                </label>
                <input
                  type="text"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  placeholder="Enter Square product ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type
                </label>
                <select
                  value={selectedProductType}
                  onChange={(e) => setSelectedProductType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="merch">Merch</option>
                  <option value="accessory">Accessory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merch Category
                </label>
                <select
                  value={selectedMerchCategory}
                  onChange={(e) => setSelectedMerchCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {MERCH_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <input
                  type="text"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  placeholder="M, L, XL, One Size"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  placeholder="Black, Navy, Various"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAssignMerch}
                  disabled={!selectedProduct || !selectedProductType || !selectedMerchCategory}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>

          {/* Current Assignments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Current Assignments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.productId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignment.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.productType === 'merch' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {assignment.productType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {assignment.merchCategory}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.size || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.color || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRemoveAssignment(assignment.productId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No merch category assignments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 