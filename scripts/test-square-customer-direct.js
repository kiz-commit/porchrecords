const { SquareClient, SquareEnvironment } = require('square');
require('dotenv').config();

const client = new SquareClient({
  environment: SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN,
});

async function testCustomerAPI() {
  try {
    console.log('Testing Square Customer API directly...\n');

    // Test 1: Try to list customers
    console.log('1. Testing listCustomers...');
    try {
      const listResult = await client.customers.listCustomers();
      console.log('✓ List customers successful:', JSON.stringify(listResult, null, 2));
    } catch (error) {
      console.log('✗ List customers failed:', error.message);
    }

    // Test 2: Try to search customers
    console.log('\n2. Testing searchCustomers...');
    try {
      const searchResult = await client.customers.searchCustomers({
        filter: {
          emailAddress: {
            exact: 'test@example.com'
          }
        }
      });
      console.log('✓ Search customers successful:', JSON.stringify(searchResult, null, 2));
    } catch (error) {
      console.log('✗ Search customers failed:', error.message);
    }

    // Test 3: Try to create a customer
    console.log('\n3. Testing createCustomer...');
    try {
      const createResult = await client.customers.createCustomer({
        emailAddress: 'test@example.com',
        givenName: 'Test',
        familyName: 'Customer'
      });
      console.log('✓ Create customer successful:', JSON.stringify(createResult, null, 2));
    } catch (error) {
      console.log('✗ Create customer failed:', error.message);
    }

    // Test 4: Check if we can access customers through a different method
    console.log('\n4. Checking alternative customer access...');
    try {
      // Try accessing customers as a catalog object
      const customerCatalog = await client.catalog.searchItems({
        objectTypes: ['CUSTOMER']
      });
      console.log('✓ Customer catalog search:', JSON.stringify(customerCatalog, null, 2));
    } catch (error) {
      console.log('✗ Customer catalog search failed:', error.message);
    }

    // Test 5: Check what's actually available in the customers object
    console.log('\n5. Exploring customers object structure...');
    console.log('Type of client.customers:', typeof client.customers);
    console.log('Keys in client.customers:', Object.keys(client.customers));
    
    if (typeof client.customers === 'object') {
      console.log('Methods in client.customers:');
      for (const key in client.customers) {
        if (typeof client.customers[key] === 'function') {
          console.log(`- ${key}: function`);
        } else {
          console.log(`- ${key}: ${typeof client.customers[key]}`);
        }
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCustomerAPI(); 