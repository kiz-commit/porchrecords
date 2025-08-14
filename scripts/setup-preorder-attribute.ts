import { SquareClient, SquareError } from 'square';
import 'dotenv/config';

// Initialize the client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: 'sandbox'
});

async function createPreorderCustomAttribute() {
  try {
    const response = await client.catalog.batchUpsert({
      batches: [
        {
          objects: [
            {
              type: 'CUSTOM_ATTRIBUTE_DEFINITION',
              id: '#preorder-definition',
              customAttributeDefinitionData: {
                name: 'Pre-order',
                key: 'pre-order',
                allowedObjectTypes: ['ITEM'],
                type: 'BOOLEAN',
                sellerVisibility: 'SELLER_VISIBILITY_READ_WRITE_VALUES',
                appVisibility: 'APP_VISIBILITY_READ_WRITE_VALUES',
              },
            },
          ],
        },
      ],
      idempotencyKey: 'preorder-custom-attribute-def-1', 
    });

    console.log('Successfully created pre-order custom attribute definition:');
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    if (error instanceof SquareError) {
      console.error('Error creating pre-order custom attribute definition:');
      console.error(JSON.stringify(error.errors, null, 2));
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}

createPreorderCustomAttribute(); 