const fs = require('fs');
const parser = require('@babel/parser');
const src = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
try {
  parser.parse(src, { sourceType: 'module', plugins: ['jsx'] });
  console.log('ok');
} catch (e) {
  console.error('msg', e.message);
  if (e.loc) console.error('loc', e.loc.line, e.loc.column);
  process.exit(1);
}
