const fs = require('fs');
const path = require('path');

const rootDir = '/Users/andela/.gemini';

function searchFiles(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }
  for (const file of files) {
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchFiles(fullPath);
      } else {
        if (stat.size > 10 * 1024 * 1024) continue; // skip files > 10MB
        const buffer = fs.readFileSync(fullPath);
        const text = buffer.toString('utf8');
        const searchTerms = [
          'Stress Management for Beginners',
          'Calm Your Mind in Minutes',
          'Mental Health & Loneliness'
        ];
        
        for (const term of searchTerms) {
          const idx = text.toLowerCase().indexOf(term.toLowerCase());
          if (idx !== -1) {
            console.log(`\n==================================================`);
            console.log(`FOUND TERM "${term}" IN FILE: ${fullPath}`);
            console.log(`File size: ${stat.size} bytes`);
            
            // Try to extract the JSON block or surrounding text
            // Find '{' before the match
            let startIdx = idx;
            while (startIdx >= 0 && text[startIdx] !== '{') {
              startIdx--;
            }
            if (startIdx >= 0) {
              console.log(`Found starting bracket '{' at index ${startIdx}`);
              // Parse out JSON by counting matching braces
              let braces = 0;
              let jsonStr = '';
              for (let i = startIdx; i < text.length; i++) {
                const char = text[i];
                if (char === '{') braces++;
                if (char === '}') braces--;
                jsonStr += char;
                if (braces === 0) {
                  break;
                }
              }
              console.log(`---------------- EXTRACTED CONTENT START ----------------`);
              console.log(jsonStr);
              console.log(`----------------- EXTRACTED CONTENT END -----------------`);
            } else {
              console.log(`Could not find starting bracket '{'. printing excerpt:`);
              console.log(text.substring(Math.max(0, idx - 200), Math.min(text.length, idx + 4000)));
            }
          }
        }
      }
    } catch (e) {}
  }
}

console.log('Searching .gemini directory...');
searchFiles(rootDir);
console.log('Search complete.');
