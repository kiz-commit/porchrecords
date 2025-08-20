'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  artist: string;
  price: number;
  description: string;
  image: string;
  genre: string;
  mood?: string;
  images?: { id: string; url: string }[];
  imageIds?: string[];
  isVisible?: boolean;
  stockQuantity?: number;
  stockStatus?: string;
  productType?: 'record' | 'merch' | 'accessory';
  merchCategory?: string;
  size?: string;
  color?: string;
}

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    price: 0,
    description: '',
    genre: '',
    mood: '',
    isVisible: true,
    productType: 'record' as 'record' | 'merch' | 'accessory',
    merchCategory: '',
    size: '',
    color: ''
  });
  // Add state for images order
  const [imagesOrder, setImagesOrder] = useState<{ id: string; url: string }[]>([]);
  // Variation sync state
  const [variations, setVariations] = useState<any[] | null>(null);
  const [syncingVars, setSyncingVars] = useState(false);
  // Add state for dropdown options
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);

  useEffect(() => {
    const initializePage = async () => {
      const { id } = await params;
      setProductId(id);
      
      // Fetch genres and moods from unified taxonomy
      const fetchOptions = async () => {
        try {
          const [genresRes, moodsRes] = await Promise.all([
            fetch('/api/admin/taxonomy?type=genre'),
            fetch('/api/admin/taxonomy?type=mood')
          ]);

          if (genresRes.ok) {
            const genresData = await genresRes.json();
            const genreNames = Array.isArray(genresData.items)
              ? genresData.items.map((g: { name: string }) => g.name)
              : [];
            setGenres(genreNames);
          }

          if (moodsRes.ok) {
            const moodsData = await moodsRes.json();
            const moodNames = Array.isArray(moodsData.items)
              ? moodsData.items.map((m: { name: string }) => m.name)
              : [];
            setMoods(moodNames);
          }
        } catch (error) {
          console.error('Error fetching dropdown options:', error);
        }
      };
      
      const fetchProduct = async () => {
        try {
          const response = await fetch(`/api/admin/products/${id}`);
          if (response.ok) {
            const data = await response.json();
            setProduct(data.product);
            setFormData({
              title: data.product.title || '',
              artist: data.product.artist || '',
              price: data.product.price || 0,
              description: data.product.description || '',
              genre: data.product.genre || '',
              mood: data.product.mood || '',
              isVisible: data.product.isVisible !== false,
              productType: data.product.productType || 'record',
              merchCategory: data.product.merchCategory || '',
              size: data.product.size || '',
              color: data.product.color || ''
            });
            setImagesOrder(data.product.images || []);
            // Load saved variations if any
            try {
              const saved = (data.product as any).variations;
              if (saved && Array.isArray(saved)) setVariations(saved);
              else if (typeof saved === 'string') setVariations(JSON.parse(saved));
            } catch {}
          } else {
            console.error('Failed to fetch product');
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchOptions();
      fetchProduct();
    };
    initializePage();
  }, [params]);

  // Sorting handlers
  const moveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= imagesOrder.length) return;
    const newOrder = [...imagesOrder];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    setImagesOrder(newOrder);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageOrder: imagesOrder.map(img => img.id)
        }),
      });
      if (response.ok) {
        router.push('/admin/products');
      } else {
        console.error('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setSaving(false);
    }
  };

  // Sync variations from Square for this product
  const syncVariations = async () => {
    if (!productId) return;
    setSyncingVars(true);
    setVariations(null);
    try {
      const res = await fetch(`/api/admin/sync/variations?squareId=${productId}`, { method: 'POST' });
      const data = await res.json();
      const result = data?.summary?.results?.[0];
      if (result?.status === 'success') {
        setVariations(result.variations || []);
      } else {
        setVariations([]);
      }
    } catch (err) {
      console.error('Variation sync failed', err);
      setVariations([]);
    } finally {
      setSyncingVars(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Product Not Found</h1>
          <button
            onClick={() => router.push('/admin/products')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <button
            onClick={() => router.push('/admin/products')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Products
          </button>
        </div>

        {/* Show Square product images */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images (from Square)</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {imagesOrder.length > 0 ? (
              imagesOrder.map((img, idx) => (
                <div key={img.id} className="relative group">
                  <Image
                    src={img.url}
                    alt={`Product image ${idx + 1}`}
                    className="w-32 h-32 object-cover rounded shadow border"
                    width={128}
                    height={128}
                    onError={e => (e.currentTarget.src = '/store.webp')}
                  />
                  <div className="absolute top-1 right-1 flex gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      className="bg-white border rounded p-1 text-xs shadow hover:bg-gray-100"
                      onClick={() => moveImage(idx, idx - 1)}
                      disabled={idx === 0}
                      title="Move left"
                    >←</button>
                    <button
                      type="button"
                      className="bg-white border rounded p-1 text-xs shadow hover:bg-gray-100"
                      onClick={() => moveImage(idx, idx + 1)}
                      disabled={idx === imagesOrder.length - 1}
                      title="Move right"
                    >→</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded shadow">
                <span className="text-gray-400 text-sm text-center">No Images<br/>in Square</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Images are managed through Square. To add or change images, please update the product in Square.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-2">
                  Artist
                </label>
                <input
                  type="text"
                  id="artist"
                  name="artist"
                  value={formData.artist}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (AUD)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <select
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a genre</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-2">
                  Mood
                </label>
                <select
                  id="mood"
                  name="mood"
                  value={formData.mood}
                  onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a mood</option>
                  {moods.map(mood => (
                    <option key={mood} value={mood}>{mood}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type
                </label>
                <select
                  id="productType"
                  name="productType"
                  value={formData.productType}
                  onChange={(e) => setFormData(prev => ({ ...prev, productType: e.target.value as 'record' | 'merch' | 'accessory' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="record">Records</option>
                  <option value="merch">Merch</option>
                  <option value="accessory">Accessories</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Merch variations + fields */}
            {formData.productType === 'merch' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="merchCategory" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="merchCategory"
                    name="merchCategory"
                    value={formData.merchCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, merchCategory: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="Hats">Hats</option>
                    <option value="Totes">Totes</option>
                    <option value="Stickers">Stickers</option>
                    <option value="Posters">Posters</option>
                    <option value="Pins">Pins</option>
                    <option value="Vinyl Accessories">Vinyl Accessories</option>
                    <option value="Home Goods">Home Goods</option>
                    <option value="Limited Edition">Limited Edition</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Variations (from Square)</label>
                    <button
                      type="button"
                      onClick={syncVariations}
                      className="px-3 py-1.5 text-sm bg-black text-white rounded hover:opacity-90"
                      disabled={syncingVars}
                    >
                      {syncingVars ? 'Syncing…' : 'Sync Variations'}
                    </button>
                  </div>
                  {variations === null && (
                    <p className="text-sm text-gray-500">No variations loaded yet. Click Sync Variations.</p>
                  )}
                  {variations && variations.length === 0 && (
                    <p className="text-sm text-gray-500">No variations found in Square for this item.</p>
                  )}
                  {variations && variations.length > 0 && (
                    <div className="border rounded divide-y">
                      {variations.map(v => (
                        <div key={v.id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div className="font-mono">{v.name}</div>
                          <div className="text-gray-600">${'{'}Number(v.price).toFixed(2){'}'}</div>
                          <div className="text-gray-600">{v.stockQuantity} in stock ({v.stockStatus})</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Visibility and Preorder Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isVisible"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Show in Store</span>
                </label>
              </div>

            </div>

            {/* Preorder Management Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-blue-600 text-lg mr-3">📅</div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Preorder Management</h4>
                  <p className="text-sm text-blue-700">
                    To set up preorders for this product, use the{' '}
                    <a 
                      href="/admin/preorders" 
                      className="underline hover:text-blue-900 font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Preorders Admin Page
                    </a>
                    {' '}where you can manage preorder dates, quantities, and settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 