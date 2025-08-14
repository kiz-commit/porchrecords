#!/usr/bin/env node

const fetch = require('node-fetch');

async function testBrowserAuth() {
  console.log('Testing browser authentication...');
  
  // First, login to get fresh cookies
  console.log('\n1. Logging in...');
  const loginResponse = await fetch('http://localhost:3000/api/admin/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  
  if (!loginResponse.ok) {
    console.log('❌ Login failed:', await loginResponse.text());
    return;
  }
  
  const loginData = await loginResponse.json();
  console.log('✅ Login successful:', loginData);
  
  // Get cookies from the response
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('Cookies received:', cookies);
  
  // Test inventory API with cookies
  console.log('\n2. Testing inventory API with cookies...');
  const inventoryResponse = await fetch('http://localhost:3000/api/admin/inventory', {
    headers: {
      'Cookie': cookies
    }
  });
  
  if (inventoryResponse.ok) {
    const inventoryData = await inventoryResponse.json();
    console.log('✅ Inventory API working');
    console.log('Products found:', inventoryData.products?.length || 0);
    if (inventoryData.products && inventoryData.products.length > 0) {
      console.log('First product:', inventoryData.products[0].title);
    }
  } else {
    console.log('❌ Inventory API failed:', await inventoryResponse.text());
  }
}

testBrowserAuth().catch(console.error); 