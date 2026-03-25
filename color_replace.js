const fs = require('fs');
const path = require('path');

const replacements = [
  ['#0F0E0E', '#1A1A2E'],
  ['#667085', '#9097A6'],
  ['#D1D8E0', '#E5E9F0'],
  ['#F6F6F6', '#F4F5F7'],
];

const dirs = [
  'C:\\Famedya_Crm\\fa_medya_crm_lar\\resources\\js\\pages',
  'C:\\Famedya_Crm\\fa_medya_crm_lar\\resources\\js\\components',
];

const skipFiles = ['DashboardLayout.jsx', 'AdminLayout.jsx', 'DashboardPage.jsx'];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      if (skipFiles.includes(file)) continue;
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [from, to] of replacements) {
        if (content.includes(from)) {
          content = content.replaceAll(from, to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDir(dirs[0]);
processDir(dirs[1]);
console.log('Done');
