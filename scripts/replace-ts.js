const fs = require('fs');

// See https://github.com/vercel/ncc/issues/642

let content = fs.readFileSync('dist/index.js', 'utf-8');
content = content.replace(/require\("typescript"\)/g, '{}');
fs.writeFileSync('dist/index.js', content);
