import { getDatabase } from './database';

export interface TaxonomyItem {
  id: string;
  name: string;
  type: 'genre' | 'mood' | 'tag' | 'product_type' | 'merch_category';
  emoji?: string;
  color?: string;
  description?: string;
  parentId?: string;
  order?: number;
  usageCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export async function getTaxonomyByType(type: TaxonomyItem['type']): Promise<TaxonomyItem[]> {
  const database = await getDatabase();
  
  const items = await database.all(`
    SELECT 
      id,
      name,
      type,
      emoji,
      color,
      description,
      parent_id as parentId,
      order_index as "order",
      usage_count as usageCount,
      is_active as isActive,
      created_at as createdAt,
      updated_at as updatedAt
    FROM taxonomy 
    WHERE type = ? AND is_active = 1
    ORDER BY order_index ASC, name ASC
  `, [type]);

  return items.map(item => ({
    ...item,
    isActive: Boolean(item.isActive),
    usageCount: item.usageCount || 0,
    order: item.order || 0
  }));
}

export async function getTaxonomyById(id: string): Promise<TaxonomyItem | null> {
  const database = await getDatabase();
  
  const item = await database.get(`
    SELECT 
      id,
      name,
      type,
      emoji,
      color,
      description,
      parent_id as parentId,
      order_index as "order",
      usage_count as usageCount,
      is_active as isActive,
      created_at as createdAt,
      updated_at as updatedAt
    FROM taxonomy 
    WHERE id = ?
  `, [id]);

  if (!item) return null;

  return {
    ...item,
    isActive: Boolean(item.isActive),
    usageCount: item.usageCount || 0,
    order: item.order || 0
  };
}

export async function getAllTaxonomyItems(includeInactive: boolean = false): Promise<TaxonomyItem[]> {
  const database = await getDatabase();
  
  const whereClause = includeInactive ? '' : 'WHERE is_active = 1';
  
  const items = await database.all(`
    SELECT 
      id,
      name,
      type,
      emoji,
      color,
      description,
      parent_id as parentId,
      order_index as "order",
      usage_count as usageCount,
      is_active as isActive,
      created_at as createdAt,
      updated_at as updatedAt
    FROM taxonomy 
    ${whereClause}
    ORDER BY type ASC, order_index ASC, name ASC
  `);

  return items.map(item => ({
    ...item,
    isActive: Boolean(item.isActive),
    usageCount: item.usageCount || 0,
    order: item.order || 0
  }));
}

export async function addTaxonomyItem(item: Omit<TaxonomyItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxonomyItem> {
  const database = await getDatabase();
  
  // Check for duplicate names within the same type
  const existing = await database.get(`
    SELECT id FROM taxonomy 
    WHERE name = ? AND type = ? AND is_active = 1
  `, [item.name, item.type]);
  
  if (existing) {
    throw new Error(`${item.type} "${item.name}" already exists`);
  }

  const id = generateId();
  const now = new Date().toISOString();

  await database.run(`
    INSERT INTO taxonomy (
      id, name, type, emoji, color, description, parent_id, 
      order_index, usage_count, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    item.name,
    item.type,
    item.emoji || null,
    item.color || null,
    item.description || null,
    item.parentId || null,
    item.order || 0,
    item.usageCount || 0,
    item.isActive ? 1 : 0,
    now,
    now
  ]);

  return {
    ...item,
    id,
    createdAt: now,
    updatedAt: now
  };
}

export async function updateTaxonomyItem(id: string, updates: Partial<Omit<TaxonomyItem, 'id' | 'createdAt'>>): Promise<TaxonomyItem> {
  const database = await getDatabase();
  
  // Check if item exists
  const existing = await getTaxonomyById(id);
  if (!existing) {
    throw new Error('Taxonomy item not found');
  }

  // Check for duplicate names if name is being updated
  if (updates.name) {
    const duplicate = await database.get(`
      SELECT id FROM taxonomy 
      WHERE name = ? AND type = ? AND id != ? AND is_active = 1
    `, [updates.name, existing.type, id]);
    
    if (duplicate) {
      throw new Error(`${existing.type} "${updates.name}" already exists`);
    }
  }

  const now = new Date().toISOString();
  
  // Build dynamic update query
  const updateFields = [];
  const updateValues = [];
  
  if (updates.name !== undefined) {
    updateFields.push('name = ?');
    updateValues.push(updates.name);
  }
  if (updates.emoji !== undefined) {
    updateFields.push('emoji = ?');
    updateValues.push(updates.emoji);
  }
  if (updates.color !== undefined) {
    updateFields.push('color = ?');
    updateValues.push(updates.color);
  }
  if (updates.description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(updates.description);
  }
  if (updates.parentId !== undefined) {
    updateFields.push('parent_id = ?');
    updateValues.push(updates.parentId);
  }
  if (updates.order !== undefined) {
    updateFields.push('order_index = ?');
    updateValues.push(updates.order);
  }
  if (updates.usageCount !== undefined) {
    updateFields.push('usage_count = ?');
    updateValues.push(updates.usageCount);
  }
  if (updates.isActive !== undefined) {
    updateFields.push('is_active = ?');
    updateValues.push(updates.isActive ? 1 : 0);
  }
  
  updateFields.push('updated_at = ?');
  updateValues.push(now);
  updateValues.push(id);

  await database.run(`
    UPDATE taxonomy 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `, updateValues);

  return getTaxonomyById(id) as Promise<TaxonomyItem>;
}

export async function deleteTaxonomyItem(id: string): Promise<boolean> {
  const database = await getDatabase();
  
  // Soft delete by setting isActive to false
  const result = await database.run(`
    UPDATE taxonomy 
    SET is_active = 0, updated_at = ?
    WHERE id = ?
  `, [new Date().toISOString(), id]);

  return (result.changes || 0) > 0;
}

export async function reorderTaxonomyItems(type: TaxonomyItem['type'], orderedIds: string[]): Promise<void> {
  const database = await getDatabase();
  
  for (let i = 0; i < orderedIds.length; i++) {
    await database.run(`
      UPDATE taxonomy 
      SET order_index = ?, updated_at = ?
      WHERE id = ? AND type = ?
    `, [i, new Date().toISOString(), orderedIds[i], type]);
  }
}

export async function getTaxonomyStats(): Promise<{
  totalCount: number;
  byType: {
    genres: number;
    moods: number;
    tags: number;
    productTypes: number;
    merchCategories: number;
  };
}> {
  const database = await getDatabase();
  
  const stats = await database.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN type = 'genre' THEN 1 ELSE 0 END) as genres,
      SUM(CASE WHEN type = 'mood' THEN 1 ELSE 0 END) as moods,
      SUM(CASE WHEN type = 'tag' THEN 1 ELSE 0 END) as tags,
      SUM(CASE WHEN type = 'product_type' THEN 1 ELSE 0 END) as productTypes,
      SUM(CASE WHEN type = 'merch_category' THEN 1 ELSE 0 END) as merchCategories
    FROM taxonomy 
    WHERE is_active = 1
  `);

  return {
    totalCount: stats.total || 0,
    byType: {
      genres: stats.genres || 0,
      moods: stats.moods || 0,
      tags: stats.tags || 0,
      productTypes: stats.productTypes || 0,
      merchCategories: stats.merchCategories || 0
    }
  };
}
