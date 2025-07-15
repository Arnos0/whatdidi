#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env.local');

console.log('\n🔐 Microsoft OAuth Credentials Setup\n');
console.log('This script will help you add your Microsoft OAuth credentials to .env.local');
console.log('Get these from Azure Portal > App registrations > Your App\n');

rl.question('Enter your Microsoft Client ID (Application ID): ', (clientId) => {
  rl.question('Enter your Microsoft Client Secret (Value, not ID): ', (clientSecret) => {
    
    // Read current .env.local
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the placeholders or add if missing
    if (envContent.includes('# MICROSOFT_CLIENT_ID=')) {
      envContent = envContent.replace(
        '# MICROSOFT_CLIENT_ID=',
        `MICROSOFT_CLIENT_ID=${clientId.trim()}`
      );
    } else if (envContent.includes('MICROSOFT_CLIENT_ID=')) {
      envContent = envContent.replace(
        /MICROSOFT_CLIENT_ID=.*/,
        `MICROSOFT_CLIENT_ID=${clientId.trim()}`
      );
    }
    
    if (envContent.includes('# MICROSOFT_CLIENT_SECRET=')) {
      envContent = envContent.replace(
        '# MICROSOFT_CLIENT_SECRET=',
        `MICROSOFT_CLIENT_SECRET=${clientSecret.trim()}`
      );
    } else if (envContent.includes('MICROSOFT_CLIENT_SECRET=')) {
      envContent = envContent.replace(
        /MICROSOFT_CLIENT_SECRET=.*/,
        `MICROSOFT_CLIENT_SECRET=${clientSecret.trim()}`
      );
    }
    
    // Write back
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Microsoft OAuth credentials have been added to .env.local');
    console.log('\nNext steps:');
    console.log('1. The server will automatically reload');
    console.log('2. Go to http://localhost:3002/settings');
    console.log('3. Click "Connect Email Account" and select Outlook\n');
    
    rl.close();
  });
});