#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to check if a file contains withAdminAuth
function hasAdminAuth(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('withAdminAuth') || content.includes('verifyAdminAuth');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return false;
  }
}

// Function to check if a file exports HTTP methods
function hasHttpExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('export async function GET') || 
           content.includes('export async function POST') ||
           content.includes('export async function PATCH') ||
           content.includes('export async function DELETE') ||
           content.includes('export const GET') ||
           content.includes('export const POST') ||
           content.includes('export const PATCH') ||
           content.includes('export const DELETE');
  } catch (error) {
    return false;
  }
}

// Function to recursively find all route.ts files in admin API
function findAdminApiRoutes(dir, baseDir = '') {
  const routes = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(baseDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        routes.push(...findAdminApiRoutes(fullPath, relativePath));
      } else if (item === 'route.ts') {
        routes.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return routes;
}

// Main execution
console.log('🔍 Checking Admin API Security...\n');

const adminApiDir = path.join(process.cwd(), 'src', 'app', 'api', 'admin');
const routes = findAdminApiRoutes(adminApiDir);

console.log(`Found ${routes.length} admin API route files:\n`);

const unprotected = [];
const protected = [];

for (const route of routes) {
  const fullPath = path.join(adminApiDir, route);
  const hasAuth = hasAdminAuth(fullPath);
  const hasExports = hasHttpExports(fullPath);
  
  if (hasExports) {
    if (hasAuth) {
      protected.push(route);
      console.log(`✅ ${route} - PROTECTED`);
    } else {
      unprotected.push(route);
      console.log(`❌ ${route} - UNPROTECTED`);
    }
  }
}

console.log(`\n📊 Security Summary:`);
console.log(`✅ Protected routes: ${protected.length}`);
console.log(`❌ Unprotected routes: ${unprotected.length}`);
console.log(`📈 Security coverage: ${Math.round((protected.length / (protected.length + unprotected.length)) * 100)}%`);

if (unprotected.length > 0) {
  console.log(`\n🚨 CRITICAL: ${unprotected.length} routes need authentication:`);
  unprotected.forEach(route => {
    console.log(`   - ${route}`);
  });
  
  console.log(`\n💡 To fix, add authentication to each route:`);
  console.log(`   1. Import: import { withAdminAuth } from '@/lib/route-protection';`);
  console.log(`   2. Wrap handlers: export const GET = withAdminAuth(getHandler);`);
  console.log(`   3. For sensitive ops: export const POST = withAdminAuth(postHandler, true);`);
} else {
  console.log(`\n🎉 All admin API routes are properly protected!`);
}

console.log(`\n🔧 Run this script again after making changes to verify security.`); 