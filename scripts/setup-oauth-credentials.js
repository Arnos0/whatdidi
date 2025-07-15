#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env.local');

console.log('\n🔐 OAuth Credentials Setup\n');
console.log('This script will help you add your OAuth credentials to .env.local');
console.log('Your credentials will be stored locally and never shared.\n');

rl.question('Enter your Google Client ID: ', (clientId) => {
  rl.question('Enter your Google Client Secret: ', (clientSecret) => {
    
    // Read current .env.local
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the placeholders
    envContent = envContent.replace(
      'GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE',
      `GOOGLE_CLIENT_ID=${clientId.trim()}`
    );
    
    envContent = envContent.replace(
      'GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE',
      `GOOGLE_CLIENT_SECRET=${clientSecret.trim()}`
    );
    
    // Write back
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Google OAuth credentials have been added to .env.local');
    console.log('\nNext steps:');
    console.log('1. Restart the server: ./stop-dev.sh && ./start-dev.sh');
    console.log('2. Go to http://localhost:3002/settings');
    console.log('3. Click "Connect Email Account" and select Gmail\n');
    
    rl.close();
  });
});