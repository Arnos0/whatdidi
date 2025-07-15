#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmailAccounts() {
  console.log('\n📧 Checking Email Accounts...\n');
  
  const { data: accounts, error } = await supabase
    .from('email_accounts')
    .select('id, provider, email, scan_enabled, created_at, last_scan_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching accounts:', error);
    return;
  }

  if (!accounts || accounts.length === 0) {
    console.log('No email accounts found yet.');
    console.log('\nTry connecting an account at: http://localhost:3002/settings');
    return;
  }

  console.log(`Found ${accounts.length} email account(s):\n`);
  
  accounts.forEach((account, index) => {
    console.log(`${index + 1}. ${account.email}`);
    console.log(`   Provider: ${account.provider}`);
    console.log(`   Enabled: ${account.scan_enabled ? '✅' : '❌'}`);
    console.log(`   Connected: ${new Date(account.created_at).toLocaleString()}`);
    console.log(`   Last Scan: ${account.last_scan_at ? new Date(account.last_scan_at).toLocaleString() : 'Never'}`);
    console.log();
  });

  // Check if tokens are encrypted
  const { data: tokenCheck } = await supabase
    .from('email_accounts')
    .select('access_token')
    .limit(1)
    .single();

  if (tokenCheck && tokenCheck.access_token) {
    const isEncrypted = tokenCheck.access_token.length > 100 && !tokenCheck.access_token.includes('.');
    console.log(`🔐 Token Encryption: ${isEncrypted ? '✅ Encrypted' : '❌ NOT ENCRYPTED!'}`);
  }
}

checkEmailAccounts().catch(console.error);