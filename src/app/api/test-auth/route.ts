import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Log all cookies
  const cookies = request.cookies;
  console.log('All cookies:', cookies.getAll());
  
  // Check specific cookies
  const sessionToken = cookies.get('session-token')?.value;
  const authToken = cookies.get('auth-token')?.value;
  
  console.log('Session token:', sessionToken ? 'Present' : 'Missing');
  console.log('Auth token:', authToken ? 'Present' : 'Missing');
  
  return NextResponse.json({
    cookies: cookies.getAll().map(c => ({ name: c.name, value: c.value ? 'Present' : 'Missing' })),
    sessionToken: sessionToken ? 'Present' : 'Missing',
    authToken: authToken ? 'Present' : 'Missing',
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer')
  });
} 