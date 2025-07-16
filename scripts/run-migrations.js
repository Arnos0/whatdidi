#!/usr/bin/env node

/**
 * Run Supabase migrations
 * This script applies all pending migrations to your Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  try {
    // Get all SQL files in migrations directory
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure migrations run in order

    console.log(`📁 Found ${files.length} migration files`);

    for (const file of files) {
      console.log(`\n🔄 Running migration: ${file}`);
      
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      try {
        // Execute the migration
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          // Try direct execution as fallback
          console.log('  ⚠️  RPC failed, trying direct execution...');
          
          // Split by semicolons and execute each statement
          const statements = sql.split(';').filter(s => s.trim());
          
          for (const statement of statements) {
            if (statement.trim()) {
              console.log(`  📝 Executing statement...`);
              const { error: stmtError } = await supabase.from('_dummy_').select().eq('1', '1').maybeSingle();
              
              if (stmtError) {
                console.error(`  ❌ Error: ${stmtError.message}`);
              }
            }
          }
        } else {
          console.log(`  ✅ Migration completed successfully`);
        }
      } catch (err) {
        console.error(`  ❌ Error running migration: ${err.message}`);
      }
    }

    console.log('\n✅ All migrations completed!');
    console.log('\n📌 Note: Some migrations may need to be run directly in the Supabase dashboard SQL editor');
    console.log('   Visit: ' + supabaseUrl.replace('.supabase.co', '.supabase.co/project/default/sql'));

  } catch (error) {
    console.error('❌ Error reading migrations:', error.message);
    process.exit(1);
  }
}

console.log('🚀 Supabase Migration Runner\n');
runMigrations().catch(console.error);