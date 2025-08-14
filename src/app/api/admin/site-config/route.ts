import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { withAdminAuth } from '@/lib/route-protection';

// GET - Retrieve all site configuration or specific config by key
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const configKey = searchParams.get('key');
    const database = await getDatabase();

    if (configKey) {
      // Get specific configuration by key
      const config = await database.get(
        'SELECT config_key, config_value, created_at, updated_at FROM site_config WHERE config_key = ?',
        [configKey]
      );

      if (!config) {
        return NextResponse.json(
          { error: 'Configuration not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        config_key: config.config_key,
        config_value: JSON.parse(config.config_value),
        created_at: config.created_at,
        updated_at: config.updated_at
      });
    } else {
      // Get all configurations
      const configs = await database.all(
        'SELECT config_key, config_value, created_at, updated_at FROM site_config ORDER BY config_key'
      );

      // Parse JSON values and organize by category
      const organizedConfigs: Record<string, any> = {};
      configs.forEach(config => {
        const [category, key] = config.config_key.split('.');
        if (!organizedConfigs[category]) {
          organizedConfigs[category] = {};
        }
        organizedConfigs[category][key] = JSON.parse(config.config_value);
      });

      return NextResponse.json({
        configurations: organizedConfigs,
        count: configs.length
      });
    }
  } catch (error) {
    console.error('Error fetching site configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site configuration' },
      { status: 500 }
    );
  }
}

// POST - Create or update site configuration
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { config_key, config_value } = body;

    if (!config_key || config_value === undefined) {
      return NextResponse.json(
        { error: 'config_key and config_value are required' },
        { status: 400 }
      );
    }

    const database = await getDatabase();

    // Validate config_key format (should be category.key)
    if (!config_key.includes('.')) {
      return NextResponse.json(
        { error: 'config_key must be in format "category.key"' },
        { status: 400 }
      );
    }

    // Insert or update configuration
    await database.run(`
      INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, [config_key, JSON.stringify(config_value)]);

    // Get the updated configuration
    const updatedConfig = await database.get(
      'SELECT config_key, config_value, created_at, updated_at FROM site_config WHERE config_key = ?',
      [config_key]
    );

    return NextResponse.json({
      message: 'Configuration updated successfully',
      config: {
        config_key: updatedConfig.config_key,
        config_value: JSON.parse(updatedConfig.config_value),
        created_at: updatedConfig.created_at,
        updated_at: updatedConfig.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating site configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update site configuration' },
      { status: 500 }
    );
  }
}

// PUT - Update multiple configurations at once
async function putHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { configurations } = body;

    if (!configurations || !Array.isArray(configurations)) {
      return NextResponse.json(
        { error: 'configurations array is required' },
        { status: 400 }
      );
    }

    const database = await getDatabase();

    // Validate all configurations
    for (const config of configurations) {
      if (!config.config_key || config.config_value === undefined) {
        return NextResponse.json(
          { error: 'Each configuration must have config_key and config_value' },
          { status: 400 }
        );
      }

      if (!config.config_key.includes('.')) {
        return NextResponse.json(
          { error: `config_key "${config.config_key}" must be in format "category.key"` },
          { status: 400 }
        );
      }
    }

    // Update all configurations in a transaction
    await database.run('BEGIN TRANSACTION');

    try {
      for (const config of configurations) {
        await database.run(`
          INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [config.config_key, JSON.stringify(config.config_value)]);
      }

      await database.run('COMMIT');
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }

    return NextResponse.json({
      message: `${configurations.length} configuration(s) updated successfully`
    });
  } catch (error) {
    console.error('Error updating multiple configurations:', error);
    return NextResponse.json(
      { error: 'Failed to update configurations' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific configuration
async function deleteHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const configKey = searchParams.get('key');

    if (!configKey) {
      return NextResponse.json(
        { error: 'config_key parameter is required' },
        { status: 400 }
      );
    }

    const database = await getDatabase();

    // Check if configuration exists
    const existingConfig = await database.get(
      'SELECT config_key FROM site_config WHERE config_key = ?',
      [configKey]
    );

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Delete configuration
    await database.run(
      'DELETE FROM site_config WHERE config_key = ?',
      [configKey]
    );

    return NextResponse.json({
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting site configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete site configuration' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const GET = withAdminAuth(getHandler);
export const POST = withAdminAuth(postHandler, true);
export const PUT = withAdminAuth(putHandler, true);
export const DELETE = withAdminAuth(deleteHandler, true); 