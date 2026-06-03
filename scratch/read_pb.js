const fs = require('fs');
const path = require('path');

const pbFile = '/Users/andela/.gemini/antigravity-ide/conversations/b92eae7c-0721-4c18-9a9d-7746f5356f72.pb';

try {
  if (fs.existsSync(pbFile)) {
    console.log('Reading PB file...');
    const buffer = fs.readFileSync(pbFile);
    const text = buffer.toString('utf8');
    console.log('PB text size:', text.length);
    
    // Find references to public speaking
    const idx = text.indexOf('Complete Public Speaking Mastery');
    if (idx !== -1) {
      console.log('Found course title in PB!');
      // Find the JSON block starting with { "title": "Complete Public Speaking Mastery"
      const jsonStart = text.indexOf('{', idx - 100);
      if (jsonStart !== -1) {
        // Let's extract the JSON block. Since the block can be very large, let's look for matching brackets.
        let bracketCount = 0;
        let jsonStr = '';
        for (let i = jsonStart; i < text.length; i++) {
          const char = text[i];
          if (char === '{') bracketCount++;
          if (char === '}') bracketCount--;
          jsonStr += char;
          if (bracketCount === 0) {
            break;
          }
        }
        console.log('FOUND COMPLETE JSON BLOCK:');
        console.log(jsonStr);
      } else {
        console.log('Could not find starting bracket near title.');
      }
    } else {
      console.log('Could not find title in PB.');
    }
  } else {
    console.log('PB file does not exist.');
  }
} catch (e) {
  console.error('Error:', e);
}
