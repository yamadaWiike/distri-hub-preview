/**
 * This script helps to apply all SQL migrations to the Supabase project.
 * It can be run in a development environment to set up the initial database structure.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // This should be set in your .env file

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase environment variables. Check your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key
// WARNING: Service key has admin privileges and should only be used in secure environments
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Path to migrations directory
const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

/**
 * Read and execute SQL files in the migrations directory
 */
async function applyMigrations() {
  try {
    // Get all SQL files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure files are processed in alphabetical order
    
    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${files.length} migration files:`);
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Ask for confirmation
    const answer = await new Promise((resolve) => {
      rl.question('Do you want to apply all migrations? This may modify your database. (y/n) ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Migration cancelled.');
      return;
    }
    
    // Process each file
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Applying migration: ${file}...`);
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error);
        console.log('Migration process stopped.');
        return;
      }
      
      console.log(`Migration ${file} applied successfully.`);
    }
    
    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Error applying migrations:', error);
  }
}

// Run migrations
applyMigrations();
