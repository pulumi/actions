const fs = require('fs');

let content = fs.readFileSync('dist/index.js', 'utf-8');
content = content.replace(/require\("typescript"\)/g, '{}');
fs.writeFileSync('dist/index.js', content);
