const fs = require('fs');
const path = require('path');

const geminiDir = '/Users/andela/.gemini';

function searchRecursive(dir) {
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
        searchRecursive(fullPath);
      } else {
        if (file.endsWith('.jsonl') || file.endsWith('.json') || file.endsWith('.txt') || file.endsWith('.log')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('Complete Public Speaking Mastery')) {
            console.log(`FOUND MATCH IN FILE: ${fullPath}`);
            // Let's print out the exact occurrence and surrounding characters, or the full line.
            const idx = content.indexOf('Complete Public Speaking Mastery');
            // We want to print the whole JSON object if it's JSON or JSONL.
            if (file.endsWith('.jsonl')) {
              const lines = content.split('\n');
              for (const line of lines) {
                if (line.includes('Complete Public Speaking Mastery')) {
                  console.log('Line length:', line.length);
                  try {
                    const parsed = JSON.parse(line);
                    console.log('Parsed content:', JSON.stringify(parsed, null, 2));
                  } catch (e) {
                    console.log('Raw line excerpt:', line.substring(0, 1000));
                  }
                }
              }
            } else {
              console.log('Excerpt:', content.substring(Math.max(0, idx - 100), idx + 2000));
            }
          }
        }
      }
    } catch (e) {}
  }
}

console.log('Searching all of .gemini...');
searchRecursive(geminiDir);
console.log('Search complete.');
