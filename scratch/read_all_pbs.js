const fs = require('fs');
const path = require('path');

const convDir = '/Users/andela/.gemini/antigravity-ide/conversations';

try {
  if (fs.existsSync(convDir)) {
    const files = fs.readdirSync(convDir);
    console.log(`Checking ${files.length} PB files...`);
    for (const file of files) {
      if (!file.endsWith('.pb')) continue;
      const fullPath = path.join(convDir, file);
      const buffer = fs.readFileSync(fullPath);
      const text = buffer.toString('utf8');
      if (text.toLowerCase().includes('public speaking') || text.toLowerCase().includes('public_speaking_mastery')) {
        console.log(`FOUND MATCH IN PB FILE: ${fullPath}`);
        // Let's print out the index and excerpt
        const idx = text.toLowerCase().indexOf('public speaking');
        console.log('Excerpt:', text.substring(Math.max(0, idx - 100), idx + 2000));
      }
    }
    console.log('Finished checking PB files.');
  } else {
    console.log('Conversations directory does not exist.');
  }
} catch (e) {
  console.error('Error:', e);
}
