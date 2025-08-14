import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const genresPath = path.join(process.cwd(), 'src', 'data', 'genres.json');

// DELETE - Remove a genre
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const genreToDelete = decodeURIComponent(id);
    if (!fs.existsSync(genresPath)) {
      return NextResponse.json({ error: 'No genres file found' }, { status: 404 });
    }
    let genres: string[] = JSON.parse(fs.readFileSync(genresPath, 'utf8'));
    genres = genres.filter(genre => genre !== genreToDelete);
    fs.writeFileSync(genresPath, JSON.stringify(genres, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete genre' }, { status: 500 });
  }
}

// PUT - Edit a genre
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const oldGenre = decodeURIComponent(id);
    const { newGenre } = await request.json();
    if (!newGenre) return NextResponse.json({ error: 'New genre is required' }, { status: 400 });
    if (!fs.existsSync(genresPath)) {
      return NextResponse.json({ error: 'No genres file found' }, { status: 404 });
    }
    let genres: string[] = JSON.parse(fs.readFileSync(genresPath, 'utf8'));
    const idx = genres.indexOf(oldGenre);
    if (idx === -1) return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    genres[idx] = newGenre;
    fs.writeFileSync(genresPath, JSON.stringify(genres, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to edit genre' }, { status: 500 });
  }
} 