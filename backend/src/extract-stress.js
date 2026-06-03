const fs = require('fs');
const readline = require('readline');

const logFile = '/Users/andela/.gemini/antigravity-ide/brain/b92eae7c-0721-4c18-9a9d-7746f5356f72/.system_generated/logs/transcript.jsonl';

async function extract() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    try {
      const obj = JSON.parse(line);
      const content = obj.content || '';
      
      // Let's search for "Stress Management for Beginners" or "Mental Health & Loneliness" in the content
      if (content.includes('Stress Management for Beginners') || content.includes('Mental Health & Loneliness')) {
        console.log(`\n==================================================`);
        console.log(`LINE ${lineCount} - STEP ${obj.step_index} - SOURCE ${obj.source} - TYPE ${obj.type}`);
        // Log a portion of it to see if it has the raw JSON
        console.log(`Content length: ${content.length} characters`);
        
        // Print the first 1000 and last 1000 characters
        console.log('--- START EXCERPT ---');
        console.log(content.substring(0, 2000));
        console.log('--- ... ---');
        console.log(content.substring(content.length - 2000));
        console.log('--- END EXCERPT ---');
        
        // Save the full content to a file in scratch so we can examine it in full
        const outPath = `/Users/andela/projects/ihub/backend/scratch/extracted_step_${obj.step_index}.txt`;
        fs.writeFileSync(outPath, content);
        console.log(`Saved full content to ${outPath}`);
      }
    } catch (e) {
      // JSON parse error
    }
  }
}

extract();
