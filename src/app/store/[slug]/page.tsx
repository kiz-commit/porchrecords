import ProductDetailPage from '@/components/ProductDetailPage';
import { notFound } from 'next/navigation';
import Database from 'better-sqlite3';
import { StoreProduct, ProductVariation } from '@/lib/types';
import { SquareClient, SquareEnvironment } from 'square';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  try {
    // First try to find by slug, then by ID as fallback
    const db = new Database('data/porchrecords.db');
    
    try {
      // Try to find product by slug first
      let product: any = db.prepare(`
        SELECT * FROM products 
        WHERE slug = ? AND is_visible = 1
      `).get(slug);
      
      // If not found by slug, try by ID (for backward compatibility)
      if (!product) {
        product = db.prepare(`
          SELECT * FROM products 
          WHERE id = ? AND is_visible = 1
        `).get(slug);
      }
      
      if (!product) {
        notFound();
      }
      
      // If this is a merch item, use saved variations first; then fetch from Square if missing
      let variations: ProductVariation[] = [];
      let hasVariations = false;
      
      if (product.product_type === 'merch') {
        try {
          if (product.variations) {
            const saved = typeof product.variations === 'string' ? JSON.parse(product.variations) : product.variations;
            if (Array.isArray(saved)) {
              variations = saved;
              hasVariations = variations.length > 1;
            }
          }
        } catch {}
      }

      if (product.product_type === 'merch' && product.square_id && variations.length === 0) {
        try {
          const squareClient = new SquareClient({
            token: process.env.SQUARE_ACCESS_TOKEN!,
            environment: process.env.NODE_ENV === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
          });
          
          // Resolve item from variation id if needed, then get all variations
          let squareResponse = await squareClient.catalog.object.get({ objectId: product.square_id });
          if (squareResponse.object && squareResponse.object.type === 'ITEM_VARIATION') {
            const parentId = (squareResponse.object as any).itemVariationData?.itemId;
            if (parentId) squareResponse = await squareClient.catalog.object.get({ objectId: parentId });
          }
          
          if (squareResponse.object && squareResponse.object.type === 'ITEM' && squareResponse.object.itemData?.variations) {
            const locationId = process.env.SQUARE_LOCATION_ID;
            
            // Process all variations
            const variationPromises = squareResponse.object.itemData.variations.map(async (variation: any) => {
              if (variation.type !== 'ITEM_VARIATION') return null;
              
              // Get inventory for this variation
              let stockQuantity = 0;
              let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'out_of_stock';
              
              if (locationId) {
                try {
                  const inventoryResponse = await squareClient.inventory.batchGetCounts({
                    locationIds: [locationId],
                    catalogObjectIds: [variation.id],
                  });
                  
                  if (inventoryResponse.data && inventoryResponse.data.length > 0) {
                    stockQuantity = Number(inventoryResponse.data[0].quantity) || 0;
                  }
                } catch (error) {
                  console.error('Error fetching inventory for variation:', variation.id, error);
                }
              }
              
              // Determine stock status
              if (stockQuantity > 10) {
                stockStatus = 'in_stock';
              } else if (stockQuantity > 0) {
                stockStatus = 'low_stock';
              } else {
                stockStatus = 'out_of_stock';
              }
              
              const price = Number(variation.itemVariationData?.priceMoney?.amount || 0) / 100;
              
              return {
                id: variation.id,
                name: variation.itemVariationData?.name || 'Default',
                price: price,
                size: variation.itemVariationData?.name || '',
                color: '', // Could be extracted from variation name or custom attributes
                stockQuantity: stockQuantity,
                stockStatus: stockStatus,
                isAvailable: stockQuantity > 0
              };
            });
            
            const variationResults = await Promise.all(variationPromises);
            variations = variationResults.filter((v) => v !== null) as ProductVariation[];
            hasVariations = variations.length > 1;
          }
        } catch (error) {
          console.error('Error fetching variations from Square:', error);
        }
      }
      
      // Parse JSON fields
      const imageIds = product.image_ids ? JSON.parse(product.image_ids) : [];
      const images = product.images ? JSON.parse(product.images) : [];
      
      // Hydrate preorder fields from `preorders` table to ensure fresh display
      // Try multiple candidate IDs to be robust: square_id, id without 'square_' prefix, raw id
      const candidateIds: string[] = [];
      if (product.square_id) candidateIds.push(String(product.square_id));
      if (product.id) {
        const rawId = String(product.id);
        candidateIds.push(rawId.replace(/^square_/, ''));
        candidateIds.push(rawId);
      }
      const uniqueIds = Array.from(new Set(candidateIds.filter(Boolean)));
      const placeholders = uniqueIds.map(() => '?').join(',');
      const preorder = uniqueIds.length
        ? (db.prepare(`
            SELECT is_preorder, preorder_release_date, preorder_quantity, preorder_max_quantity
            FROM preorders WHERE product_id IN (${placeholders}) LIMIT 1
          `).get(...uniqueIds) as
            | { is_preorder: number; preorder_release_date: string; preorder_quantity: number; preorder_max_quantity: number }
            | undefined)
        : undefined;

      // Format the product for the frontend
      const formattedProduct: StoreProduct = {
        id: product.id,
        title: product.title,
        artist: product.artist || 'Unknown Artist',
        price: product.price,
        description: product.description || '',
        image: product.image || '/store.webp',
        images: images,
        imageIds: imageIds,
        genre: product.genre || 'Uncategorized',
        inStock: Boolean(product.in_stock),
        isPreorder: preorder ? Boolean(preorder.is_preorder) : Boolean(product.is_preorder),
        isVisible: Boolean(product.is_visible),
        squareId: product.square_id,
        productType: product.product_type || 'record',
        merchCategory: product.merch_category || '',
        size: product.size || '',
        color: product.color || '',
        mood: product.mood || '',
        format: product.format || '',
        year: product.year || '',
        label: product.label || '',
        preorderReleaseDate: (preorder && preorder.preorder_release_date) || product.preorder_release_date || '',
        preorderQuantity: ((preorder && preorder.preorder_quantity) ?? product.preorder_quantity) ?? 0,
        preorderMaxQuantity: ((preorder && preorder.preorder_max_quantity) ?? product.preorder_max_quantity) ?? 0,
        stockQuantity: product.stock_quantity || 0,
        stockStatus: product.stock_status || 'in_stock',
        isVariablePricing: Boolean(product.is_variable_pricing),
        minPrice: product.min_price,
        maxPrice: product.max_price,
        createdAt: product.created_at,
        // Internal timestamps omitted from StoreProduct type
        // lastSyncedAt: product.last_synced_at,
        // squareUpdatedAt: product.square_updated_at,
        // Add variation data
        variations: variations,
        hasVariations: hasVariations,
        selectedVariationId: variations.length > 0 ? variations[0].id : undefined
      };
      
      return <ProductDetailPage product={formattedProduct} />;
      
    } finally {
      db.close();
    }
    
  } catch (error) {
    console.error('Error loading product:', error);
    notFound();
  }
}
