#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

// Simulate the cookie parsing logic from the middleware
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    // Split by comma first to separate different cookies
    const cookiePairs = cookieHeader.split(',');
    cookiePairs.forEach(cookiePair => {
      // Then split by semicolon to get individual cookie parts
      const parts = cookiePair.split(';');
      const firstPart = parts[0].trim();
      const [name, value] = firstPart.split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });
  }
  return cookies;
}

// Test with the cookies we received
const cookieHeader = "session-token=40233692bca1c60c9ed0e7c57e06ad97b3376531cd8982fce82d3a83c8881710ba056828e6767c1b8a99a40215f62c05d6b013fb8a5789bf6f0aa46fb74734cb; Path=/; Expires=Sun, 10 Aug 2025 19:01:38 GMT; Max-Age=28800; HttpOnly; SameSite=strict, auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiYXV0aGVudGljYXRlZCI6dHJ1ZSwicmVxdWlyZXMyRkEiOmZhbHNlLCJ0d29GYWN0b3JWZXJpZmllZCI6ZmFsc2UsImlhdCI6MTc1NDgyMzY5OCwiZXhwIjoxNzU0ODUyNDk4fQ.E-paQMTbl9w4GvIE2u4xShv-bZ4gTfZ21-JL-4fuEGY; Path=/; Expires=Sun, 10 Aug 2025 19:01:38 GMT; Max-Age=28800; HttpOnly; SameSite=strict";

console.log('Testing cookie parsing...');
const cookies = parseCookies(cookieHeader);
console.log('Parsed cookies:', cookies);

console.log('\nSession token:', cookies['session-token']);
console.log('Auth token:', cookies['auth-token']);

// Test JWT decoding
if (cookies['auth-token']) {
  const jwtToken = cookies['auth-token'];
  const base64Url = jwtToken.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  
  const payload = JSON.parse(jsonPayload);
  console.log('\nJWT payload:', payload);
  
  // Check if JWT has expired
  const now = Math.floor(Date.now() / 1000);
  console.log('Current time:', now);
  console.log('JWT expires at:', payload.exp);
  console.log('JWT expired:', payload.exp < now);
} 