import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// GET - Retrieve all active homepage sections for public display
export async function GET() {
  try {
    const database = await getDatabase();

    // Get all active sections ordered by order_index
    const sections = await database.all(
      'SELECT * FROM homepage_sections WHERE is_active = 1 ORDER BY order_index ASC'
    );

    const parsedSections = sections.map(section => ({
      id: section.id,
      section_type: section.section_type,
      section_data: JSON.parse(section.section_data),
      order_index: section.order_index,
      is_active: Boolean(section.is_active),
      created_at: section.created_at,
      updated_at: section.updated_at
    }));

    return NextResponse.json({
      sections: parsedSections,
      count: sections.length
    });
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage sections' },
      { status: 500 }
    );
  }
} 