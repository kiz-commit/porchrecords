import fs from 'fs';
import path from 'path';

export interface TaxonomyItem {
  id: string;
  name: string;
  type: 'genre' | 'mood' | 'category' | 'tag';
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

export interface TaxonomyCollection {
  items: TaxonomyItem[];
  lastUpdated: string;
  version: string;
}

const TAXONOMY_PATH = path.join(process.cwd(), 'src', 'data', 'taxonomy.json');

// Default moods with emojis based on the existing moods
const DEFAULT_MOODS: Omit<TaxonomyItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: "Island time", type: "mood", emoji: "🏝️", color: "#4ECDC4", description: "Relaxed, tropical vibes", isActive: true, order: 1 },
  { name: "4 to the floor", type: "mood", emoji: "🕺", color: "#FF6B6B", description: "Steady, danceable rhythm", isActive: true, order: 2 },
  { name: "Poolside", type: "mood", emoji: "🏊", color: "#45B7D1", description: "Chill, summer vibes", isActive: true, order: 3 },
  { name: "Slow focus", type: "mood", emoji: "🧘", color: "#96CEB4", description: "Meditative, concentrated", isActive: true, order: 4 },
  { name: "Memory lane", type: "mood", emoji: "💭", color: "#DDA0DD", description: "Nostalgic, reflective", isActive: true, order: 5 },
  { name: "Expansions", type: "mood", emoji: "🌌", color: "#FFD93D", description: "Growing, evolving soundscapes", isActive: true, order: 6 }
];

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getTaxonomyData(): TaxonomyCollection {
  try {
    if (!fs.existsSync(TAXONOMY_PATH)) {
      // Initialize with default data
      const defaultData: TaxonomyCollection = {
        items: DEFAULT_MOODS.map(mood => ({
          ...mood,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      };
      saveTaxonomyData(defaultData);
      return defaultData;
    }

    const data = fs.readFileSync(TAXONOMY_PATH, 'utf8');
    return JSON.parse(data) as TaxonomyCollection;
  } catch (error) {
    console.error('Error reading taxonomy data:', error);
    throw new Error('Failed to load taxonomy data');
  }
}

export function saveTaxonomyData(data: TaxonomyCollection): void {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(TAXONOMY_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TAXONOMY_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving taxonomy data:', error);
    throw new Error('Failed to save taxonomy data');
  }
}

export function getTaxonomyByType(type: TaxonomyItem['type']): TaxonomyItem[] {
  const data = getTaxonomyData();
  return data.items
    .filter(item => item.type === type && item.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getTaxonomyById(id: string): TaxonomyItem | null {
  const data = getTaxonomyData();
  return data.items.find(item => item.id === id) || null;
}

export function addTaxonomyItem(item: Omit<TaxonomyItem, 'id' | 'createdAt' | 'updatedAt'>): TaxonomyItem {
  const data = getTaxonomyData();
  
  // Check for duplicate names within the same type
  const existing = data.items.find(existing => 
    existing.name.toLowerCase() === item.name.toLowerCase() && 
    existing.type === item.type && 
    existing.isActive
  );
  
  if (existing) {
    throw new Error(`${item.type} "${item.name}" already exists`);
  }

  const newItem: TaxonomyItem = {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.items.push(newItem);
  saveTaxonomyData(data);
  
  return newItem;
}

export function updateTaxonomyItem(id: string, updates: Partial<Omit<TaxonomyItem, 'id' | 'createdAt'>>): TaxonomyItem {
  const data = getTaxonomyData();
  const itemIndex = data.items.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    throw new Error('Taxonomy item not found');
  }

  // Check for duplicate names if name is being updated
  if (updates.name) {
    const existing = data.items.find(existing => 
      existing.id !== id &&
      existing.name.toLowerCase() === updates.name!.toLowerCase() && 
      existing.type === data.items[itemIndex].type && 
      existing.isActive
    );
    
    if (existing) {
      throw new Error(`${data.items[itemIndex].type} "${updates.name}" already exists`);
    }
  }

  const updatedItem = {
    ...data.items[itemIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  data.items[itemIndex] = updatedItem;
  saveTaxonomyData(data);
  
  return updatedItem;
}

export function deleteTaxonomyItem(id: string): boolean {
  const data = getTaxonomyData();
  const itemIndex = data.items.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return false;
  }

  // Soft delete by setting isActive to false
  data.items[itemIndex] = {
    ...data.items[itemIndex],
    isActive: false,
    updatedAt: new Date().toISOString()
  };

  saveTaxonomyData(data);
  return true;
}

export function reorderTaxonomyItems(type: TaxonomyItem['type'], orderedIds: string[]): void {
  const data = getTaxonomyData();
  
  orderedIds.forEach((id, index) => {
    const itemIndex = data.items.findIndex(item => item.id === id && item.type === type);
    if (itemIndex !== -1) {
      data.items[itemIndex] = {
        ...data.items[itemIndex],
        order: index,
        updatedAt: new Date().toISOString()
      };
    }
  });

  saveTaxonomyData(data);
}

// Migration helper to convert old format to new format
export function migrateLegacyData(): void {
  try {
    // Migrate moods
    const oldMoodsPath = path.join(process.cwd(), 'src', 'data', 'moods.json');
    if (fs.existsSync(oldMoodsPath)) {
      const oldMoods: string[] = JSON.parse(fs.readFileSync(oldMoodsPath, 'utf8'));
      const data = getTaxonomyData();
      
      oldMoods.forEach((moodName, index) => {
        const existing = data.items.find(item => 
          item.name.toLowerCase() === moodName.toLowerCase() && 
          item.type === 'mood'
        );
        
        if (!existing) {
          const newMood: TaxonomyItem = {
            id: generateId(),
            name: moodName,
            type: 'mood',
            emoji: '', // Will be set manually in admin
            isActive: true,
            order: index,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          data.items.push(newMood);
        }
      });
      
      saveTaxonomyData(data);
      console.log(`Migrated ${oldMoods.length} legacy moods`);
    }

    // Migrate genres
    const oldGenresPath = path.join(process.cwd(), 'src', 'data', 'genres.json');
    if (fs.existsSync(oldGenresPath)) {
      const oldGenres: string[] = JSON.parse(fs.readFileSync(oldGenresPath, 'utf8'));
      const data = getTaxonomyData();
      
      oldGenres.forEach((genreName, index) => {
        const existing = data.items.find(item => 
          item.name.toLowerCase() === genreName.toLowerCase() && 
          item.type === 'genre'
        );
        
        if (!existing) {
          const newGenre: TaxonomyItem = {
            id: generateId(),
            name: genreName,
            type: 'genre',
            isActive: true,
            order: index,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          data.items.push(newGenre);
        }
      });
      
      saveTaxonomyData(data);
      console.log(`Migrated ${oldGenres.length} legacy genres`);
    }
  } catch (error) {
    console.error('Error migrating legacy data:', error);
  }
}