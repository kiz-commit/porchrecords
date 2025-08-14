#!/usr/bin/env node

/**
 * Cleanup script to remove all test data from the database
 * This will give us a fresh start for testing the new database system
 */

const { getDatabase, initializeDatabase } = require('../src/lib/database.ts');

async function cleanupTestData() {
  console.log('🧹 Starting cleanup of test data...\n');

  try {
    // Initialize database
    await initializeDatabase();
    const database = await getDatabase();

    // Get all pages first
    const pages = await database.all('SELECT id, title, slug FROM pages');
    console.log(`Found ${pages.length} pages in database`);

    // Delete all pages
    await database.run('DELETE FROM pages');
    console.log('✅ Deleted all pages');

    // Delete all shows
    const shows = await database.all('SELECT id, title FROM shows');
    console.log(`Found ${shows.length} shows in database`);
    await database.run('DELETE FROM shows');
    console.log('✅ Deleted all shows');

    // Delete all products
    const products = await database.all('SELECT id, title FROM products');
    console.log(`Found ${products.length} products in database`);
    await database.run('DELETE FROM products');
    console.log('✅ Deleted all products');

    // Delete all preorders
    const preorders = await database.all('SELECT product_id FROM preorders');
    console.log(`Found ${preorders.length} preorders in database`);
    await database.run('DELETE FROM preorders');
    console.log('✅ Deleted all preorders');

    // Delete all merch categories
    const merchCategories = await database.all('SELECT product_id FROM merch_categories');
    console.log(`Found ${merchCategories.length} merch categories in database`);
    await database.run('DELETE FROM merch_categories');
    console.log('✅ Deleted all merch categories');

    // Delete all media
    const media = await database.all('SELECT id, name FROM media');
    console.log(`Found ${media.length} media items in database`);
    await database.run('DELETE FROM media');
    console.log('✅ Deleted all media');

    // Keep genres and moods as they are reference data
    const genres = await database.all('SELECT name FROM genres');
    const moods = await database.all('SELECT name FROM moods');
    console.log(`Keeping ${genres.length} genres and ${moods.length} moods (reference data)`);

    // Keep navigation as it's important for site structure
    const navigation = await database.all('SELECT id, label FROM navigation');
    console.log(`Keeping ${navigation.length} navigation items (site structure)`);

    // Create a default welcome page
    const defaultPage = {
      id: 'welcome-page',
      title: 'Welcome to Porch Records',
      slug: 'welcome',
      description: 'Welcome to Porch Records - your destination for quality music and community.',
      metaTitle: 'Welcome - Porch Records',
      metaDescription: 'Welcome to Porch Records, your destination for quality music and community.',
      isPublished: true,
      isDraft: false,
      sections: JSON.stringify([
        {
          id: 'welcome-hero',
          type: 'hero',
          title: 'Welcome to Porch Records',
          content: 'Your destination for quality music and community',
          order: 1,
          isVisible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          config: {
            hero: {
              backgroundImage: '/hero-image.jpg',
              textColor: 'white',
              textAlignment: 'center',
              buttonText: 'Explore Music',
              buttonLink: '/store',
              buttonStyle: 'primary',
              overlayOpacity: 0.3,
              overlayColor: '#000000',
              fullHeight: true,
              scrollIndicator: true
            }
          }
        },
        {
          id: 'welcome-text',
          type: 'text',
          title: 'About Porch Records',
          content: `Since 2019, we've been investing energy into building unique and high quality experiences in under-utilised spaces across Kaurna Country.

Founders of The Porch Sessions - travelling backyard festivals across the country - the Porch brand has now evolved and matured into a new realm of national and international shows - underpinned by the same ethos, of bringing incredible music to this city in the most beautiful settings.

These projects are the brainchildren of Sharni Honor, an award winning devotee to the independent sector of the music industry. An advocate, a champion of artistry and a genuine complete lover of music.

Porch Records co-owns and operates independent creative space, Summertown Studio - coffee, coworking, retail & event space.

We run a record store, open seven days a week specialising in jazz, funk, soul & international grooves and we DJ on wax in our spare time.

We live and breathe quality music & just love to make nice times happen.`,
          order: 2,
          isVisible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          config: {
            text: {
              textAlignment: 'left',
              textSize: 'medium',
              backgroundColor: 'transparent',
              textColor: 'inherit',
              padding: 'large',
              maxWidth: 'lg'
            }
          }
        }
      ]),
      versions: JSON.stringify([]),
      template: '',
      tags: JSON.stringify(['welcome', 'home']),
      publishAt: null,
      unpublishAt: null,
      clonedFrom: null,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    await database.run(`
      INSERT INTO pages (
        id, title, slug, description, meta_title, meta_description,
        is_published, is_draft, sections, versions, template, tags,
        publish_at, unpublish_at, cloned_from, created_at, last_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      defaultPage.id,
      defaultPage.title,
      defaultPage.slug,
      defaultPage.description,
      defaultPage.metaTitle,
      defaultPage.metaDescription,
      defaultPage.isPublished ? 1 : 0,
      defaultPage.isDraft ? 1 : 0,
      defaultPage.sections,
      defaultPage.versions,
      defaultPage.template,
      defaultPage.tags,
      defaultPage.publishAt,
      defaultPage.unpublishAt,
      defaultPage.clonedFrom,
      defaultPage.createdAt,
      defaultPage.lastModified
    ]);

    console.log('✅ Created default welcome page');

    // Get final stats
    const finalPages = await database.all('SELECT COUNT(*) as count FROM pages');
    const finalShows = await database.all('SELECT COUNT(*) as count FROM shows');
    const finalProducts = await database.all('SELECT COUNT(*) as count FROM products');
    const finalMedia = await database.all('SELECT COUNT(*) as count FROM media');

    console.log('\n📊 Final Database State:');
    console.log(`  📄 Pages: ${finalPages[0].count}`);
    console.log(`  🎵 Shows: ${finalShows[0].count}`);
    console.log(`  🛍️  Products: ${finalProducts[0].count}`);
    console.log(`  🖼️  Media: ${finalMedia[0].count}`);
    console.log(`  🎼 Genres: ${genres.length}`);
    console.log(`  😊 Moods: ${moods.length}`);
    console.log(`  🧭 Navigation: ${navigation.length}`);

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Test creating a new page');
    console.log('  2. Test editing the welcome page');
    console.log('  3. Verify all functionality works correctly');
    console.log('  4. The database is now clean and ready for testing');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupTestData();
}

module.exports = { cleanupTestData }; 