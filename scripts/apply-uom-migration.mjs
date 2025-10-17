import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration - REQUIRES ENVIRONMENT VARIABLES
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - SUPABASE_URL');
  if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please set these environment variables before running this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyUOMMigration() {
  try {
    console.log('🚀 Applying UOM tables migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251008000001_create_uom_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
        throw error;
      }
    }
    
    console.log('✅ UOM tables migration completed successfully!');
    console.log('');
    console.log('📋 Created tables:');
    console.log('   - uom_units (available units of measure)');
    console.log('   - uom_conversions (conversion factors between units)');
    console.log('   - uom_pricing (UOM-specific pricing per area)');
    console.log('');
    console.log('📋 Updated products table with UOM fields:');
    console.log('   - base_uom, moq_uom, pricing_uom, enable_uom_conversions');
    console.log('');
    console.log('📋 Default UOM units inserted:');
    console.log('   - pcs, box, carton, kg, gram, liter, ml, dozen, pack, bottle');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyUOMMigration();