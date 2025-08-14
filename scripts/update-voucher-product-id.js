require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
// Import the voucher config functions
const voucherConfigPath = path.join(process.cwd(), 'src', 'lib', 'voucher-config.ts');
let getVoucherProductId;

// Simple implementation for the script
function getVoucherProductIdFromEnv() {
  const envVoucherId = process.env.VOUCHER_PRODUCT_ID;
  if (envVoucherId) {
    return envVoucherId;
  }

  const environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
  
  if (environment === 'production') {
    return 'Y5DOR2EGDQEXOOB572HO74UT'; // Production voucher ID
  } else {
    return 'P523TCCIJN4PAV2MP3R2EGS2'; // Sandbox voucher ID
  }
}

getVoucherProductId = getVoucherProductIdFromEnv;

async function updateVoucherProductId() {
  try {
    console.log('🔄 Updating voucher product ID in products.json...');
    
    const voucherId = getVoucherProductId();
    console.log(`Environment: ${process.env.SQUARE_ENVIRONMENT || 'sandbox'}`);
    console.log(`Voucher ID: ${voucherId}`);
    
    // Read the current products.json file
    const productsPath = path.join(process.cwd(), 'src', 'data', 'products.json');
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    
    // Find the voucher product and update its ID
    const voucherProduct = productsData.find(product => 
      product.productType === 'voucher' || 
      product.title.toLowerCase().includes('voucher')
    );
    
    if (voucherProduct) {
      const oldId = voucherProduct.id;
      const oldSquareId = voucherProduct.squareId;
      
      // Update the voucher product
      voucherProduct.id = voucherId;
      voucherProduct.squareId = voucherId;
      voucherProduct.updatedAt = new Date().toISOString();
      
      console.log(`✅ Updated voucher product:`);
      console.log(`   Old ID: ${oldId} → New ID: ${voucherId}`);
      console.log(`   Old Square ID: ${oldSquareId} → New Square ID: ${voucherId}`);
      
      // Write the updated data back to the file
      fs.writeFileSync(productsPath, JSON.stringify(productsData, null, 2));
      console.log('✅ products.json updated successfully');
      
    } else {
      console.log('❌ No voucher product found in products.json');
      console.log('Creating new voucher product entry...');
      
      // Create a new voucher product entry
      const newVoucherProduct = {
        id: voucherId,
        title: "Gift Voucher",
        price: 0,
        description: "Custom gift voucher - choose your own amount",
        image: "/voucher-image.svg",
        inStock: true,
        artist: "",
        genre: "",
        productType: "voucher",
        merchCategory: "",
        curationTags: [],
        isPreorder: false,
        squareId: voucherId,
        isFromSquare: true,
        isVariablePricing: true,
        minPrice: 5,
        maxPrice: 500,
        updatedAt: new Date().toISOString()
      };
      
      // Add to the beginning of the products array
      productsData.unshift(newVoucherProduct);
      
      // Write the updated data back to the file
      fs.writeFileSync(productsPath, JSON.stringify(productsData, null, 2));
      console.log('✅ Created new voucher product in products.json');
    }
    
  } catch (error) {
    console.error('❌ Error updating voucher product ID:', error);
  }
}

updateVoucherProductId();
