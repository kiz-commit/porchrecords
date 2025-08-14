const { SquareClient, SquareEnvironment } = require('square');
require('dotenv').config();

const client = new SquareClient({
  environment: SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN,
});

async function testSquareCustomerAPI() {
  try {
    console.log('Testing Square Customer API methods...\n');

    // Check what methods are available on the customers object
    console.log('Available customer methods:');
    console.log(Object.getOwnPropertyNames(client.customers));
    console.log('\n');

    // Try to list customers
    console.log('Attempting to list customers...');
    try {
      const listResponse = await client.customers.listCustomers();
      console.log('List customers response:', JSON.stringify(listResponse, null, 2));
    } catch (error) {
      console.log('List customers error:', error.message);
    }

    // Try to search customers
    console.log('\nAttempting to search customers...');
    try {
      const searchResponse = await client.customers.searchCustomers({
        filter: {
          emailAddress: {
            exact: 'test@example.com'
          }
        }
      });
      console.log('Search customers response:', JSON.stringify(searchResponse, null, 2));
    } catch (error) {
      console.log('Search customers error:', error.message);
    }

    // Try to create a customer
    console.log('\nAttempting to create a customer...');
    try {
      const createResponse = await client.customers.createCustomer({
        emailAddress: 'test@example.com',
        givenName: 'Test',
        familyName: 'Customer'
      });
      console.log('Create customer response:', JSON.stringify(createResponse, null, 2));
    } catch (error) {
      console.log('Create customer error:', error.message);
    }

    // Check if there are any other customer-related methods
    console.log('\nChecking for other customer-related methods...');
    const methods = Object.getOwnPropertyNames(client.customers);
    methods.forEach(method => {
      console.log(`- ${method}`);
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSquareCustomerAPI(); 