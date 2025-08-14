import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET() {
  return NextResponse.json({
    squareToken: process.env.SQUARE_ACCESS_TOKEN ? 'Set' : 'Not set',
    squareAppId: process.env.SQUARE_APPLICATION_ID || 'Not set',
    squareLocationId: process.env.SQUARE_LOCATION_ID || 'Not set',
    tokenStart: process.env.SQUARE_ACCESS_TOKEN ? process.env.SQUARE_ACCESS_TOKEN.substring(0, 10) + '...' : 'N/A'
  });
} 