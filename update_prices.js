const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'backend', 'src');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove price / discountPrice logic, or set to 0
    content = content.replace(/price:\s*\d+/g, 'price: 0');
    content = content.replace(/discountPrice:\s*\d+/g, 'discountPrice: 0');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Updated prices in:', filePath);
    }
}

function walkDir(d) {
    const files = fs.readdirSync(d);
    for (const f of files) {
        const fullPath = path.join(d, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (f.startsWith('seed') && f.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

walkDir(dir);
