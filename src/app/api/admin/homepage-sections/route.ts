import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { withAdminAuth } from '@/lib/route-protection';

// GET - Retrieve all homepage sections or specific section by ID
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('id');
    const database = await getDatabase();

    if (sectionId) {
      // Get specific section by ID
      const section = await database.get(
        'SELECT * FROM homepage_sections WHERE id = ?',
        [sectionId]
      );

      if (!section) {
        return NextResponse.json(
          { error: 'Homepage section not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: section.id,
        section_type: section.section_type,
        section_data: JSON.parse(section.section_data),
        order_index: section.order_index,
        is_active: Boolean(section.is_active),
        created_at: section.created_at,
        updated_at: section.updated_at
      });
    } else {
      // Get all sections ordered by order_index
      const sections = await database.all(
        'SELECT * FROM homepage_sections ORDER BY order_index ASC'
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
    }
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage sections' },
      { status: 500 }
    );
  }
});

// POST - Create new homepage section
export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { section_type, section_data, order_index, is_active = true } = body;

    if (!section_type || !section_data) {
      return NextResponse.json(
        { error: 'section_type and section_data are required' },
        { status: 400 }
      );
    }

    const database = await getDatabase();

    // If order_index is not provided, get the next available order
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined) {
      const maxOrderResult = await database.get(
        'SELECT MAX(order_index) as max_order FROM homepage_sections'
      );
      finalOrderIndex = (maxOrderResult?.max_order || 0) + 1;
    }

    // Insert new section
    const result = await database.run(`
      INSERT INTO homepage_sections (section_type, section_data, order_index, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [section_type, JSON.stringify(section_data), finalOrderIndex, is_active ? 1 : 0]);

    // Get the created section
    const newSection = await database.get(
      'SELECT * FROM homepage_sections WHERE id = ?',
      [result.lastID]
    );

    return NextResponse.json({
      message: 'Homepage section created successfully',
      section: {
        id: newSection.id,
        section_type: newSection.section_type,
        section_data: JSON.parse(newSection.section_data),
        order_index: newSection.order_index,
        is_active: Boolean(newSection.is_active),
        created_at: newSection.created_at,
        updated_at: newSection.updated_at
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating homepage section:', error);
    return NextResponse.json(
      { error: 'Failed to create homepage section' },
      { status: 500 }
    );
  }
});

// PUT - Update homepage section
export const PUT = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id, section_type, section_data, order_index, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'section id is required' },
        { status: 400 }
      );
    }

    const database = await getDatabase();

    // Check if section exists
    const existingSection = await database.get(
      'SELECT * FROM homepage_sections WHERE id = ?',
      [id]
    );

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Homepage section not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (section_type !== undefined) {
      updates.push('section_type = ?');
      params.push(section_type);
    }

    if (section_data !== undefined) {
      updates.push('section_data = ?');
      params.push(JSON.stringify(section_data));
    }

    if (order_index !== undefined) {
      updates.push('order_index = ?');
      params.push(order_index);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    // Update section
    await database.run(`
      UPDATE homepage_sections 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    // Get the updated section
    const updatedSection = await database.get(
      'SELECT * FROM homepage_sections WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      message: 'Homepage section updated successfully',
      section: {
        id: updatedSection.id,
        section_type: updatedSection.section_type,
        section_data: JSON.parse(updatedSection.section_data),
        order_index: updatedSection.order_index,
        is_active: Boolean(updatedSection.is_active),
        created_at: updatedSection.created_at,
        updated_at: updatedSection.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating homepage section:', error);
    return NextResponse.json(
      { error: 'Failed to update homepage section' },
      { status: 500 }
    );
  }
});

// DELETE - Delete homepage section
export const DELETE = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('id');

    if (!sectionId) {
      return NextResponse.json(
        { error: 'section id parameter is required' },
        { status: 400 }
      );
    }

    const database = await getDatabase();

    // Check if section exists
    const existingSection = await database.get(
      'SELECT * FROM homepage_sections WHERE id = ?',
      [sectionId]
    );

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Homepage section not found' },
        { status: 404 }
      );
    }

    // Delete section
    await database.run(
      'DELETE FROM homepage_sections WHERE id = ?',
      [sectionId]
    );

    // Reorder remaining sections
    await database.run(`
      UPDATE homepage_sections 
      SET order_index = order_index - 1 
      WHERE order_index > ?
    `, [existingSection.order_index]);

    return NextResponse.json({
      message: 'Homepage section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting homepage section:', error);
    return NextResponse.json(
      { error: 'Failed to delete homepage section' },
      { status: 500 }
    );
  }
});

// PATCH - Reorder sections
export const PATCH = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { sections } = body; // Array of { id, order_index }

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'sections array is required' },
        { status: 400 }
      );
    }

    const database = await getDatabase();

    // Validate all sections
    for (const section of sections) {
      if (!section.id || section.order_index === undefined) {
        return NextResponse.json(
          { error: 'Each section must have id and order_index' },
          { status: 400 }
        );
      }
    }

    // Update all sections in a transaction
    await database.run('BEGIN TRANSACTION');

    try {
      for (const section of sections) {
        await database.run(`
          UPDATE homepage_sections 
          SET order_index = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [section.order_index, section.id]);
      }

      await database.run('COMMIT');
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }

    return NextResponse.json({
      message: `${sections.length} section(s) reordered successfully`
    });
  } catch (error) {
    console.error('Error reordering homepage sections:', error);
    return NextResponse.json(
      { error: 'Failed to reorder homepage sections' },
      { status: 500 }
    );
  }
}); 