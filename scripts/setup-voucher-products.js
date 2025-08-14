import { SquareClient, SquareEnvironment } from 'square';
import 'dotenv/config';

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

const voucherAmounts = [10, 20, 30, 50, 100, 200];

async function createVoucherProducts() {
  try {
    console.log('🎫 Setting up voucher products in Square...\n');

    for (const amount of voucherAmounts) {
      const itemId = `#voucher-${amount}`;
      const variationId = `#voucher-${amount}-variation`;

      const batchUpsertBody = {
        batches: [
          {
            objects: [
              {
                type: 'ITEM',
                id: itemId,
                presentAtAllLocations: true,
                itemData: {
                  name: `$${amount} Gift Voucher`,
                  description: `Porch Records gift voucher worth $${amount}. Perfect for music lovers! [HIDDEN FROM STORE]`,
                  categoryId: null,
                  variations: [
                    {
                      type: 'ITEM_VARIATION',
                      id: variationId,
                      presentAtAllLocations: true,
                      itemVariationData: {
                        itemId: itemId,
                        name: `$${amount} Voucher`,
                        pricingType: 'FIXED_PRICING',
                        priceMoney: {
                          amount: BigInt(amount * 100), // Convert to cents
                          currency: 'AUD',
                        },
                        trackInventory: false, // Vouchers don't need inventory tracking
                        inventoryAlertType: 'NONE',
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
        idempotencyKey: `create-voucher-${amount}-${Date.now()}`,
      };

      try {
        const response = await client.catalog.batchUpsert(batchUpsertBody);
        const createdItem = response.objects?.find((obj) => obj.type === 'ITEM');
        
        if (createdItem) {
          console.log(`✅ Created $${amount} voucher product (ID: ${createdItem.id})`);
        } else {
          console.log(`❌ Failed to create $${amount} voucher product`);
        }
      } catch (error) {
        console.error(`❌ Error creating $${amount} voucher:`, error);
      }
    }

    console.log('\n🎉 Voucher products setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Create voucher products in Square catalog (done above)');
    console.log('2. When customers purchase vouchers, create voucher records in your system');
    console.log('3. Use the voucher validation API during checkout');
    console.log('4. Apply discounts using Square\'s discount API or custom logic');

  } catch (error) {
    console.error('❌ Error setting up voucher products:', error);
  }
}

createVoucherProducts(); 