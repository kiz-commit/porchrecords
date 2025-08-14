import { SquareClient, SquareEnvironment } from 'square';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

async function addVoucherImage() {
  try {
    console.log('🎫 Adding image to voucher product in Square...\n');

    const voucherId = 'P523TCCIJN4PAV2MP3R2EGS2';
    
    // First, let's create a simple voucher image or use an existing one
    // For now, we'll use the logo.png as a base
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo file not found. Creating a simple voucher image...');
      // We'll create a simple text-based voucher image
      return;
    }

    console.log('📤 Uploading voucher image to Square...');
    
    // Read the logo file
    const imageBuffer = fs.readFileSync(logoPath);
    const base64Image = imageBuffer.toString('base64');
    
    // Create image object
    const imageId = `#voucher-image-${Date.now()}`;
    
    const batchUpsertBody = {
      batches: [
        {
          objects: [
            {
              type: 'IMAGE',
              id: imageId,
              presentAtAllLocations: true,
              imageData: {
                name: 'Gift Voucher',
                caption: 'Porch Records Gift Voucher',
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      idempotencyKey: `create-voucher-image-${Date.now()}`,
    };

    try {
      const imageResponse = await client.catalog.batchUpsert(batchUpsertBody);
      const createdImage = imageResponse.objects?.find((obj) => obj.type === 'IMAGE');
      
      if (createdImage) {
        console.log(`✅ Created voucher image (ID: ${createdImage.id})`);
        
        // Now update the voucher product to include this image
        console.log('🔗 Associating image with voucher product...');
        
        const updateVoucherBody = {
          batches: [
            {
              objects: [
                {
                  type: 'ITEM',
                  id: voucherId,
                  presentAtAllLocations: true,
                  itemData: {
                    name: 'Voucher',
                    description: 'Custom gift voucher - choose your own amount',
                    imageIds: [createdImage.id],
                    variations: [
                      {
                        type: 'ITEM_VARIATION',
                        id: `${voucherId}-variation`,
                        presentAtAllLocations: true,
                        itemVariationData: {
                          itemId: voucherId,
                          name: 'Voucher',
                          pricingType: 'VARIABLE_PRICING',
                          priceMoney: {
                            amount: BigInt(0),
                            currency: 'AUD',
                          },
                          trackInventory: false,
                          inventoryAlertType: 'NONE',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
          idempotencyKey: `update-voucher-with-image-${Date.now()}`,
        };

        const updateResponse = await client.catalog.batchUpsert(updateVoucherBody);
        const updatedItem = updateResponse.objects?.find((obj) => obj.type === 'ITEM');
        
        if (updatedItem) {
          console.log('✅ Successfully associated image with voucher product');
          console.log(`   Voucher ID: ${updatedItem.id}`);
          console.log(`   Image ID: ${createdImage.id}`);
        } else {
          console.log('❌ Failed to associate image with voucher product');
        }
      } else {
        console.log('❌ Failed to create voucher image');
      }
    } catch (error) {
      console.error('❌ Error creating/updating voucher image:', error);
    }

  } catch (error) {
    console.error('❌ Error adding voucher image:', error);
  }
}

addVoucherImage(); 