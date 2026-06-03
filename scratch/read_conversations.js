const fs = require('fs');
const path = require('path');

const convDir = '/Users/andela/.gemini/antigravity-ide/conversations';

try {
  if (fs.existsSync(convDir)) {
    const files = fs.readdirSync(convDir);
    console.log('Conversations directory files:', files);
    for (const file of files) {
      const fullPath = path.join(convDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('Complete Public Speaking Mastery')) {
          console.log(`FOUND MATCH IN CONVERSATION FILE: ${fullPath}`);
          console.log('File length:', content.length);
        }
      }
    }
  } else {
    console.log('Conversations directory does not exist.');
  }
} catch (e) {
  console.error('Error:', e);
}
