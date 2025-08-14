// Voucher configuration utility
// Handles different voucher product IDs for sandbox vs production environments

export function getVoucherProductId(): string {
  // Check if a specific voucher ID is set in environment
  const envVoucherId = process.env.VOUCHER_PRODUCT_ID;
  if (envVoucherId) {
    return envVoucherId;
  }

  // Fallback to environment-specific IDs
  const environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
  
  if (environment === 'production') {
    return 'Y5DOR2EGDQEXOOB572HO74UT'; // Production voucher ID
  } else {
    return 'P523TCCIJN4PAV2MP3R2EGS2'; // Sandbox voucher ID
  }
}

export function isVoucherProduct(productId: string): boolean {
  const voucherId = getVoucherProductId();
  return productId === voucherId;
}

export function getVoucherConfig() {
  return {
    productId: getVoucherProductId(),
    environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
    isProduction: process.env.SQUARE_ENVIRONMENT === 'production'
  };
}
