const fs = require('fs');
const path = require('path');

const rootDir = '/Users/andela/projects/ihub';

function searchFiles(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchFiles(fullPath);
      } else {
        const ageInMs = Date.now() - stat.mtimeMs;
        const ageInMins = ageInMs / 1000 / 60;
        
        // Print files modified in last 120 mins
        if (ageInMins < 120) {
          console.log(`Recently modified: ${fullPath} (${ageInMins.toFixed(1)} mins ago)`);
        }
        
        // Search content
        if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.txt') || file.endsWith('.md')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.toLowerCase().includes('public speaking') || content.toLowerCase().includes('public_speaking_mastery')) {
            console.log(`Found content match in: ${fullPath}`);
          }
        }
      }
    } catch (e) {}
  }
}

console.log('Searching...');
searchFiles(rootDir);
console.log('Search complete.');
