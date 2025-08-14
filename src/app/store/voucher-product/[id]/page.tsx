import { notFound } from 'next/navigation';
import VoucherProductClient from './VoucherProductClient';
import fs from 'fs';
import path from 'path';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VoucherProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  
  try {
    // Fetch from the cache API (includes all products, including vouchers)
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/cache`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      notFound();
    }
    
    const data = await response.json();
    // Strip the 'square_' prefix from the id to match the Square API format
    const squareId = id.replace('square_', '');
    const voucherProduct = data.products?.find((p: any) => p.id === squareId && p.productType === 'voucher');
    
    if (!voucherProduct) {
      notFound();
    }

    // Format the product data for the voucher component
    const formattedProduct = {
      id: voucherProduct.id,
      title: voucherProduct.title || 'Gift Voucher',
      description: voucherProduct.description || 'Perfect gift for music lovers! Choose your own amount.',
      image: voucherProduct.image || '/voucher-image.svg',
      isVariablePricing: true,
      minPrice: 10,
      maxPrice: 500
    };

    return <VoucherProductClient product={formattedProduct} />;
    
  } catch (error) {
    console.error('Error loading voucher product from API:', error);
    notFound();
  }
} 