// Simple script to copy vercel.json to dist folder
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

try {
  const vercelJsonPath = path.join(rootDir, 'vercel.json');
  const distPath = path.join(rootDir, 'dist');
  
  if (fs.existsSync(vercelJsonPath)) {
    // Make sure the dist directory exists
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(vercelJsonPath, path.join(distPath, 'vercel.json'));
    console.log('Successfully copied vercel.json to dist folder');
  } else {
    console.log('vercel.json file not found, skipping copy');
  }
} catch (error) {
  console.error('Error copying vercel.json:', error);
  process.exit(1);
}
