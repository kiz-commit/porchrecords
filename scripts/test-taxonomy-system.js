const fs = require('fs');
const path = require('path');

// Test script to verify the taxonomy system is working
async function testTaxonomySystem() {
  console.log('🧪 Testing Taxonomy System...\n');

  try {
    // Test 1: Check if taxonomy API is accessible
    console.log('1. Testing taxonomy API endpoint...');
    const response = await fetch('http://localhost:3000/api/admin/taxonomy');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API is working');
      console.log(`   Found ${data.items?.length || 0} taxonomy items`);
      console.log(`   Metadata:`, data.metadata);
    } else {
      console.log('❌ API not responding correctly');
      return;
    }

    // Test 2: Check if legacy moods file exists
    console.log('\n2. Checking legacy mood data...');
    const moodsPath = path.join(process.cwd(), 'src', 'data', 'moods.json');
    if (fs.existsSync(moodsPath)) {
      const moods = JSON.parse(fs.readFileSync(moodsPath, 'utf8'));
      console.log('✅ Legacy moods file found');
      console.log(`   Contains ${moods.length} moods:`, moods);
    } else {
      console.log('⚠️  Legacy moods file not found');
    }

    // Test 3: Test adding a new mood via API
    console.log('\n3. Testing adding a new mood...');
    const testMood = {
      name: 'Test Mood',
      type: 'mood',
      emoji: '🧪',
      color: '#FF6B6B',
      description: 'A test mood for validation'
    };

    const addResponse = await fetch('http://localhost:3000/api/admin/taxonomy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMood)
    });

    if (addResponse.ok) {
      const addData = await addResponse.json();
      console.log('✅ Successfully added test mood');
      console.log(`   New mood ID: ${addData.item?.id}`);
      
      // Clean up: delete the test mood
      if (addData.item?.id) {
        await fetch(`http://localhost:3000/api/admin/taxonomy/${addData.item.id}`, {
          method: 'DELETE'
        });
        console.log('🧹 Cleaned up test mood');
      }
    } else {
      const errorData = await addResponse.json();
      console.log('❌ Failed to add test mood:', errorData.error);
    }

    console.log('\n🎉 Taxonomy system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the Next.js server is running: npm run dev');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testTaxonomySystem();
}

module.exports = { testTaxonomySystem };