import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const genresPath = path.join(process.cwd(), 'src', 'data', 'genres.json');

// GET - List all genres
export async function GET() {
  try {
    if (!fs.existsSync(genresPath)) {
      return NextResponse.json({ genres: [] });
    }
    const data = fs.readFileSync(genresPath, 'utf8');
    const genres: string[] = JSON.parse(data);
    return NextResponse.json({ genres });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load genres' }, { status: 500 });
  }
}

// POST - Add a new genre
export async function POST(request: NextRequest) {
  try {
    const { genre } = await request.json();
    if (!genre) return NextResponse.json({ error: 'Genre is required' }, { status: 400 });
    let genres: string[] = [];
    if (fs.existsSync(genresPath)) {
      genres = JSON.parse(fs.readFileSync(genresPath, 'utf8'));
    }
    if (genres.includes(genre)) {
      return NextResponse.json({ error: 'Genre already exists' }, { status: 400 });
    }
    genres.push(genre);
    fs.writeFileSync(genresPath, JSON.stringify(genres, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add genre' }, { status: 500 });
  }
} 