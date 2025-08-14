#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { getDatabase } = require('./src/lib/database');

async function checkSession() {
  try {
    console.log('Checking session in database...');
    
    const database = await getDatabase();
    
    // Check if admin_security table exists
    const tables = await database.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tables.map(t => t.name));
    
    // Check admin_security table structure
    const adminSecurityStructure = await database.all("PRAGMA table_info(admin_security)");
    console.log('\nAdmin security table structure:', adminSecurityStructure);
    
    // Check for any sessions
    const sessions = await database.all("SELECT username, session_token, session_expires_at FROM admin_security WHERE session_token IS NOT NULL");
    console.log('\nSessions in database:', sessions);
    
    // Check for admin user
    const adminUser = await database.get("SELECT * FROM admin_security WHERE username = 'admin'");
    console.log('\nAdmin user record:', adminUser);
    
  } catch (error) {
    console.error('Error checking session:', error);
  }
}

checkSession(); 