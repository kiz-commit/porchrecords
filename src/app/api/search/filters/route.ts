import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Load genres
    const genres = JSON.parse(readFileSync(join(process.cwd(), 'src/data/genres.json'), 'utf8'));
    
    // Load merch categories and extract unique categories
    const merchData = JSON.parse(readFileSync(join(process.cwd(), 'src/data/merchCategories.json'), 'utf8'));
    const categories = Object.values(merchData)
      .map((item: any) => item.merchCategory)
      .filter((cat: string) => cat && cat !== '')
      .filter((cat: string, index: number, arr: string[]) => arr.indexOf(cat) === index);
    
    return NextResponse.json({
      genres,
      categories
    });
  } catch (error) {
    console.error('Error loading filter data:', error);
    return NextResponse.json(
      { error: 'Failed to load filter data' },
      { status: 500 }
    );
  }
} 