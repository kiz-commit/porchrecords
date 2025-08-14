import { SquareClient, SquareError } from 'square';
import 'dotenv/config';

// Initialize the client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: 'sandbox'
});

async function createGenreCustomAttribute() {
  try {
    const response = await client.catalog.batchUpsert({
      batches: [
        {
          objects: [
            {
              type: 'CUSTOM_ATTRIBUTE_DEFINITION',
              id: '#genre-definition',
              customAttributeDefinitionData: {
                name: 'Genre',
                key: 'porchrecords_genre',
                allowedObjectTypes: ['ITEM'],
                type: 'STRING',
                sellerVisibility: 'SELLER_VISIBILITY_READ_WRITE_VALUES',
                appVisibility: 'APP_VISIBILITY_READ_WRITE_VALUES',
              },
            },
          ],
        },
      ],
      // A new idempotency key is needed for each attempt to create this definition
      idempotencyKey: 'genre-custom-attribute-def-15', 
    });

    console.log('Successfully created custom attribute definition:');
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    if (error instanceof SquareError) {
      console.error('Error creating custom attribute definition:');
      // The API errors are in an array under the `errors` property
      console.error(JSON.stringify(error.errors, null, 2));
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}

createGenreCustomAttribute(); 