// Simple script to copy vercel.json to dist folder
const fs = require('fs');
const path = require('path');

try {
  if (fs.existsSync('vercel.json')) {
    // Make sure the dist directory exists
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync('vercel.json', path.join('dist', 'vercel.json'));
    console.log('Successfully copied vercel.json to dist folder');
  } else {
    console.log('vercel.json file not found, skipping copy');
  }
} catch (error) {
  console.error('Error copying vercel.json:', error);
  process.exit(1);
}
