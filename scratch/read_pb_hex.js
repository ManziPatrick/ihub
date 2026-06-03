const fs = require('fs');
const path = require('path');

const pbFile = '/Users/andela/.gemini/antigravity-ide/conversations/b92eae7c-0721-4c18-9a9d-7746f5356f72.pb';

try {
  if (fs.existsSync(pbFile)) {
    const buffer = fs.readFileSync(pbFile);
    const text = buffer.toString('utf8');
    console.log('PB text size:', text.length);
    
    // Case-insensitive search
    const terms = ['public speaking', 'public_speaking_mastery', 'foundation of public speaking', 'recovering from mistakes'];
    for (const term of terms) {
      const idx = text.toLowerCase().indexOf(term.toLowerCase());
      console.log(`Term "${term}": found at index`, idx);
      if (idx !== -1) {
        console.log('Excerpt around match:', text.substring(idx - 100, idx + 300));
      }
    }
  } else {
    console.log('PB file does not exist.');
  }
} catch (e) {
  console.error('Error:', e);
}
