"use client";

import { useState, useEffect, useCallback } from 'react';
import { type TaxonomyItem } from '@/lib/taxonomy-utils';
import EmojiPicker from './EmojiPicker';

interface TaxonomyManagerProps {
  initialType?: TaxonomyItem['type'];
}

export default function TaxonomyManager({ initialType = 'mood' }: TaxonomyManagerProps) {
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeType, setActiveType] = useState<TaxonomyItem['type']>(initialType);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draggedItem, setDraggedItem] = useState<TaxonomyItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    emoji: '',
    color: '',
    description: ''
  });

  const [stats, setStats] = useState({
    genres: 0,
    moods: 0,
    categories: 0,
    tags: 0
  });

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/taxonomy?type=${activeType}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
      
      // Load stats
      const statsResponse = await fetch('/api/admin/taxonomy');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.metadata?.byType || { categories: 0, tags: 0 });
      }
    } catch (error) {
      console.error('Error loading taxonomy items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const payload = {
        ...formData,
        type: activeType
      };

      const url = editingItem 
        ? `/api/admin/taxonomy/${editingItem.id}`
        : '/api/admin/taxonomy';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await loadItems();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleEdit = (item: TaxonomyItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      emoji: item.emoji || '',
      color: item.color || '',
      description: item.description || ''
    });
    setIsCreating(true);
  };

  const handleDelete = async (item: TaxonomyItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/taxonomy/${item.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadItems();
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', emoji: '', color: '', description: '' });
    setEditingItem(null);
    setIsCreating(false);
  };

  const handleDragStart = (e: React.DragEvent, item: TaxonomyItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetItem: TaxonomyItem) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      return;
    }

    const currentItems = [...items];
    const draggedIndex = currentItems.findIndex(item => item.id === draggedItem.id);
    const targetIndex = currentItems.findIndex(item => item.id === targetItem.id);
    
    // Reorder array
    currentItems.splice(draggedIndex, 1);
    currentItems.splice(targetIndex, 0, draggedItem);
    
    // Update local state immediately for responsiveness
    setItems(currentItems);
    
    // Send reorder request
    try {
      const orderedIds = currentItems.map(item => item.id);
      await fetch('/api/admin/taxonomy/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeType, orderedIds })
      });
    } catch (error) {
      console.error('Error reordering items:', error);
      // Reload to get correct order
      loadItems();
    }
    
    setDraggedItem(null);
  };

  // Legacy migration removed for production readiness

  const typeLabels = {
    genre: 'Genres',
    mood: 'Moods',
    category: 'Categories',
    tag: 'Tags'
  };

  if (isLoading) {
    return <div className="text-center py-20">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Taxonomy Management</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(stats).map(([type, count]) => (
          <div key={type} className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{count}</div>
            <div className="text-sm text-gray-600 capitalize">{type}</div>
          </div>
        ))}
      </div>

      {/* Type Selector */}
      <div className="flex gap-2 border-b">
        {Object.entries(typeLabels).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setActiveType(type as TaxonomyItem['type'])}
            className={`px-4 py-2 font-medium transition-colors ${
              activeType === type
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {label} ({stats[type as keyof typeof stats] || 0})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit' : 'Add'} {typeLabels[activeType].slice(0, -1)}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Enter ${activeType} name`}
                  required
                />
              </div>

              {activeType === 'mood' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emoji
                  </label>
                  <EmojiPicker
                    value={formData.emoji}
                    onChange={(emoji) => setFormData(prev => ({ ...prev, emoji }))}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? 'Update' : 'Add'}
                </button>
                {(editingItem || isCreating) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Items List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {typeLabels[activeType]} ({items.length})
                </h2>
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add New
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No {activeType}s found. Add your first one!
                </div>
              ) : (
                items.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, item)}
                    className={`p-4 flex items-center justify-between cursor-move hover:bg-gray-50 transition-colors ${
                      draggedItem?.id === item.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400 font-mono text-sm">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      
                      {item.emoji && (
                        <div className="text-xl">{item.emoji}</div>
                      )}
                      
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500">{item.description}</div>
                        )}
                      </div>
                      
                      {item.color && (
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}