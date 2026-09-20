const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ejs = require('ejs');
function check(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) check(file);
    else if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', file]);
    else if (file.endsWith('.ejs')) ejs.compile(fs.readFileSync(file, 'utf8'), { filename: file });
  }
}
for (const dir of ['src', 'public/js', 'netlify/functions', 'views', 'scripts']) check(dir);
console.log('JavaScript y plantillas EJS verificados. Netlify empaquetará la función y publicará public/.');
