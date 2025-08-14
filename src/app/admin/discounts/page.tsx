"use client";

import AdminLayout from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAnnouncementBar } from '@/contexts/AnnouncementBarContext';

interface Discount {
  id: string;
  name: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  percentage?: string;
  amount?: number;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  discountType: 'MANUAL_CODE' | 'AUTOMATIC';
  targetType: 'ALL_PRODUCTS' | 'CATEGORIES' | 'SPECIFIC_PRODUCTS';
  targetCategories: string[];
  targetProducts: string[];
  applicableProducts: string[];
  usageCount: number;
  maxUsage?: number;
  createdAt: string;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const { settings, updateSettings } = useAnnouncementBar();
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementSettings, setAnnouncementSettings] = useState({
    isEnabled: false,
    text: "",
    backgroundColor: "#1f2937",
    textColor: "#ffffff",
    speed: 20
  });
  const [availableCategories, setAvailableCategories] = useState<{
    productTypes: string[];
    merchCategories: string[];
  }>({ productTypes: [], merchCategories: [] });
  const [newDiscount, setNewDiscount] = useState({
    name: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    percentage: '',
    amount: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    maxUsage: '',
    discountType: 'MANUAL_CODE' as 'MANUAL_CODE' | 'AUTOMATIC',
    targetType: 'ALL_PRODUCTS' as 'ALL_PRODUCTS' | 'CATEGORIES' | 'SPECIFIC_PRODUCTS',
    targetCategories: [] as string[],
    targetProducts: [] as string[],
    applicableProducts: [] as string[]
  });

  useEffect(() => {
    fetchDiscounts();
    fetchAvailableCategories();
    // Initialize announcement settings from context
    setAnnouncementSettings({
      isEnabled: settings.isEnabled,
      text: settings.text,
      backgroundColor: settings.backgroundColor,
      textColor: settings.textColor,
      speed: settings.speed
    });
  }, [settings]);

  const fetchAvailableCategories = async () => {
    try {
      const response = await fetch('/api/admin/discounts/categories');
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const response = await fetch('/api/admin/discounts');
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data.discounts || []);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDiscount)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewDiscount({
          name: '',
          type: 'PERCENTAGE',
          percentage: '',
          amount: '',
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          maxUsage: '',
          discountType: 'MANUAL_CODE',
          targetType: 'ALL_PRODUCTS',
          targetCategories: [],
          targetProducts: [],
          applicableProducts: []
        });
        fetchDiscounts();
      }
    } catch (error) {
      console.error('Error creating discount:', error);
    }
  };

  const handleEditDiscount = (discount: Discount) => {
    // Set the discount data to the form and switch to edit mode
    setNewDiscount({
      name: discount.name,
      type: discount.type,
      percentage: discount.percentage || '',
      amount: discount.amount?.toString() || '',
      startDate: discount.startDate || '',
      startTime: discount.startTime || '',
      endDate: discount.endDate || '',
      endTime: discount.endTime || '',
      maxUsage: discount.maxUsage?.toString() || '',
      discountType: discount.discountType,
      targetType: discount.targetType,
      targetCategories: discount.targetCategories,
      targetProducts: discount.targetProducts,
      applicableProducts: discount.applicableProducts
    });
    setEditingDiscount(discount);
    setShowCreateForm(true);
  };

  const handleUpdateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscount) return;

    try {
      const response = await fetch('/api/admin/discounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDiscount.id,
          ...newDiscount
        })
      });

      if (response.ok) {
        setShowCreateForm(false);
        setEditingDiscount(null);
        setNewDiscount({
          name: '',
          type: 'PERCENTAGE',
          percentage: '',
          amount: '',
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          maxUsage: '',
          discountType: 'MANUAL_CODE',
          targetType: 'ALL_PRODUCTS',
          targetCategories: [],
          targetProducts: [],
          applicableProducts: []
        });
        fetchDiscounts();
        alert('Discount updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error updating discount: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating discount:', error);
      alert('Error updating discount. Please try again.');
    }
  };

  const handleDeleteDiscount = async (discountId: string) => {
    if (!confirm('Are you sure you want to delete this discount? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discounts?id=${discountId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchDiscounts();
        alert('Discount deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error deleting discount: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Error deleting discount. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount';
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(announcementSettings);
    setShowAnnouncementForm(false);
  };

    if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading discounts...</div>
        </div>

      {/* Announcement Bar Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Announcement Bar</h2>
            <button
              onClick={() => setShowAnnouncementForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              {settings.isEnabled ? 'Edit Announcement' : 'Create Announcement'}
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          {settings.isEnabled ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Current Announcement</p>
                <p className="text-sm text-gray-600 mt-1">{settings.text}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>Speed: {settings.speed}ms</span>
                  <span>Color: {settings.textColor}</span>
                  <span>Background: {settings.backgroundColor}</span>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ isEnabled: false })}
                className="px-3 py-1 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Disable
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">📢</div>
              <p>No announcement bar active.</p>
              <p className="text-sm">Create an announcement to display moving text across the top of your site.</p>
            </div>
          )}
        </div>
      </div>

      {/* Announcement Bar Modal */}
      {showAnnouncementForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {settings.isEnabled ? 'Edit Announcement' : 'Create Announcement'}
            </h2>
            <form onSubmit={handleAnnouncementSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enable Announcement Bar
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={announcementSettings.isEnabled}
                      onChange={(e) => setAnnouncementSettings({
                        ...announcementSettings,
                        isEnabled: e.target.checked
                      })}
                      className="mr-2"
                    />
                    Show announcement bar on site
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Announcement Text
                  </label>
                  <textarea
                    value={announcementSettings.text}
                    onChange={(e) => setAnnouncementSettings({
                      ...announcementSettings,
                      text: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Enter your announcement text here..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={announcementSettings.backgroundColor}
                      onChange={(e) => setAnnouncementSettings({
                        ...announcementSettings,
                        backgroundColor: e.target.value
                      })}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={announcementSettings.textColor}
                      onChange={(e) => setAnnouncementSettings({
                        ...announcementSettings,
                        textColor: e.target.value
                      })}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Animation Speed (ms)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={announcementSettings.speed}
                    onChange={(e) => setAnnouncementSettings({
                      ...announcementSettings,
                      speed: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Fast</span>
                    <span>{announcementSettings.speed}ms</span>
                    <span>Slow</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {settings.isEnabled ? 'Update' : 'Create'} Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discounts</h1>
            <p className="mt-2 text-gray-600">
              Create and manage store-wide discounts, bundle offers, and promotional codes.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Discount
          </button>
        </div>
      </div>

      {/* Create Discount Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
            </h2>
                            <form onSubmit={editingDiscount ? handleUpdateDiscount : handleCreateDiscount}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Name
                  </label>
                  <input
                    type="text"
                    value={newDiscount.name}
                    onChange={(e) => setNewDiscount({...newDiscount, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={newDiscount.type}
                    onChange={(e) => setNewDiscount({...newDiscount, type: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT'})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                  </select>
                </div>

                {newDiscount.type === 'PERCENTAGE' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Percentage (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newDiscount.percentage}
                      onChange={(e) => setNewDiscount({...newDiscount, percentage: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newDiscount.amount}
                      onChange={(e) => setNewDiscount({...newDiscount, amount: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newDiscount.startDate}
                      onChange={(e) => setNewDiscount({...newDiscount, startDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newDiscount.startTime}
                      onChange={(e) => setNewDiscount({...newDiscount, startTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newDiscount.endDate}
                      onChange={(e) => setNewDiscount({...newDiscount, endDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newDiscount.endTime}
                      onChange={(e) => setNewDiscount({...newDiscount, endTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={newDiscount.discountType}
                    onChange={(e) => setNewDiscount({...newDiscount, discountType: e.target.value as 'MANUAL_CODE' | 'AUTOMATIC'})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="MANUAL_CODE">Manual Code (Customer enters code)</option>
                    <option value="AUTOMATIC">Automatic (Applies automatically)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Products
                  </label>
                  <select
                    value={newDiscount.targetType}
                    onChange={(e) => setNewDiscount({...newDiscount, targetType: e.target.value as 'ALL_PRODUCTS' | 'CATEGORIES' | 'SPECIFIC_PRODUCTS'})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="ALL_PRODUCTS">All Products</option>
                    <option value="CATEGORIES">Specific Categories</option>
                    <option value="SPECIFIC_PRODUCTS">Specific Products</option>
                  </select>
                </div>

                {newDiscount.targetType === 'CATEGORIES' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Categories
                    </label>
                                         <div className="space-y-2">
                       {availableCategories.productTypes.length > 0 && (
                         <>
                           <div className="font-medium text-sm mb-2">Product Types:</div>
                           {availableCategories.productTypes.map((category) => (
                             <label key={category} className="flex items-center">
                               <input
                                 type="checkbox"
                                 checked={newDiscount.targetCategories.includes(category)}
                                 onChange={(e) => {
                                   if (e.target.checked) {
                                     setNewDiscount({
                                       ...newDiscount,
                                       targetCategories: [...newDiscount.targetCategories, category]
                                     });
                                   } else {
                                     setNewDiscount({
                                       ...newDiscount,
                                       targetCategories: newDiscount.targetCategories.filter(c => c !== category)
                                     });
                                   }
                                 }}
                                 className="mr-2"
                               />
                               {category.charAt(0).toUpperCase() + category.slice(1)}
                             </label>
                           ))}
                         </>
                       )}
                       
                       {availableCategories.merchCategories.length > 0 && (
                         <>
                           <div className="font-medium text-sm mb-2 mt-4">Merch Categories:</div>
                           {availableCategories.merchCategories.map((category) => (
                             <label key={category} className="flex items-center">
                               <input
                                 type="checkbox"
                                 checked={newDiscount.targetCategories.includes(category)}
                                 onChange={(e) => {
                                   if (e.target.checked) {
                                     setNewDiscount({
                                       ...newDiscount,
                                       targetCategories: [...newDiscount.targetCategories, category]
                                     });
                                   } else {
                                     setNewDiscount({
                                       ...newDiscount,
                                       targetCategories: newDiscount.targetCategories.filter(c => c !== category)
                                     });
                                   }
                                 }}
                                 className="mr-2"
                               />
                               {category}
                             </label>
                           ))}
                         </>
                       )}
                     </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Usage (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newDiscount.maxUsage}
                    onChange={(e) => setNewDiscount({...newDiscount, maxUsage: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingDiscount(null);
                    setNewDiscount({
                      name: '',
                      type: 'PERCENTAGE',
                      percentage: '',
                      amount: '',
                      startDate: '',
                      startTime: '',
                      endDate: '',
                      endTime: '',
                      maxUsage: '',
                      discountType: 'MANUAL_CODE',
                      targetType: 'ALL_PRODUCTS',
                      targetCategories: [],
                      targetProducts: [],
                      applicableProducts: []
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingDiscount ? 'Update Discount' : 'Create Discount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discounts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Active Discounts</h2>
        </div>
        
        {discounts.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="text-4xl mb-4">🎫</div>
            <p>No discounts created yet.</p>
            <p className="text-sm">Create your first discount to start offering promotions to customers.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {discounts.map((discount) => (
              <div key={discount.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{discount.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(discount.status)}`}>
                        {discount.status}
                      </span>
                    </div>
                                         <div className="mt-1 text-sm text-gray-600">
                       <span className="font-medium">
                         {discount.type === 'PERCENTAGE' 
                           ? `${discount.percentage}% off` 
                           : `$${discount.amount} off`
                         }
                       </span>
                       <span className="mx-2">•</span>
                       <span>{getTypeLabel(discount.type)}</span>
                       <span className="mx-2">•</span>
                       <span className={`px-2 py-1 text-xs rounded-full ${
                         discount.discountType === 'AUTOMATIC' 
                           ? 'bg-green-100 text-green-800' 
                           : 'bg-blue-100 text-blue-800'
                       }`}>
                         {discount.discountType === 'AUTOMATIC' ? 'Auto' : 'Manual'}
                       </span>
                       {discount.discountType === 'MANUAL_CODE' && (
                         <>
                           <span className="mx-2">•</span>
                           <span>Code: <span className="font-mono bg-gray-100 px-1 rounded">{discount.code}</span></span>
                         </>
                       )}
                       <span className="mx-2">•</span>
                       <span>Used {discount.usageCount} times</span>
                       {discount.maxUsage && (
                         <>
                           <span className="mx-2">•</span>
                           <span>Max {discount.maxUsage}</span>
                         </>
                       )}
                     </div>
                     <div className="mt-1 text-xs text-gray-500">
                       <span>Target: {discount.targetType === 'ALL_PRODUCTS' ? 'All Products' : 
                         discount.targetType === 'CATEGORIES' ? `Categories: ${discount.targetCategories.join(', ')}` :
                         'Specific Products'}</span>
                     </div>
                    {discount.startDate && discount.endDate && (
                      <div className="mt-1 text-xs text-gray-500">
                        Valid: {new Date(discount.startDate).toLocaleDateString()}
                        {discount.startTime && ` at ${discount.startTime}`} - {new Date(discount.endDate).toLocaleDateString()}
                        {discount.endTime && ` at ${discount.endTime}`}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditDiscount(discount)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteDiscount(discount.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-xl mr-4">
              🎫
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Discounts</p>
              <p className="text-2xl font-bold text-gray-900">
                {discounts.filter(d => d.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl mr-4">
              📊
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {discounts.reduce((sum, d) => sum + d.usageCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl mr-4">
              💰
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue Saved</p>
              <p className="text-2xl font-bold text-gray-900">$0</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 