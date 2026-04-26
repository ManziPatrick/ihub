const fs = require('fs');
const path = require('path');

const excludeDirs = ['.git', 'node_modules', 'dist', 'build', '.next', '.gemini', '.vite'];
const excludeExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.mp4', '.webp', '.pdf', '.zip'];

function preserveCaseReplace(str) {
  return str.replace(/codemande/gi, match => {
    if (match === 'codemande') return 'ihub';
    if (match === 'Codemande') return 'Ihub';
    if (match === 'CODEMANDE') return 'IHUB';
    if (match === 'CodeMande') return 'IHub';
    return 'ihub'; // fallback
  });
}

function processFile(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (excludeExts.includes(ext)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Quick check to avoid replacing if not present
    if (content.match(/codemande/i)) {
      let original = content;
      content = preserveCaseReplace(content);
      if (content !== original) {
         fs.writeFileSync(filePath, content, 'utf8');
         console.log('Replaced in', filePath);
      }
    }
  } catch (e) {
    // console.error('Error processing file:', filePath, e.message);
  }
}

function walkDir(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }
  
  for (const f of files) {
    if (excludeDirs.includes(f)) continue;
    const fullPath = path.join(dir, f);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        processFile(fullPath);
      }
    } catch (e) {}
  }
}

walkDir(path.join(__dirname, 'backend'));
walkDir(path.join(__dirname, 'frontend'));
walkDir(path.join(__dirname, 'docs'));
processFile(path.join(__dirname, 'README.md'));
processFile(path.join(__dirname, 'netlify.toml'));
processFile(path.join(__dirname, 'docker-compose.yml'));
processFile(path.join(__dirname, 'package.json'));

console.log("Renaming completed.");
