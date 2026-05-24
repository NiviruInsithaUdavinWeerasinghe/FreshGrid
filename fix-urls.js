const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory()
        ? walkSync(dirFile, filelist)
        : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log(`File not found, skipping: ${dirFile}`);
      }
    }
  });
  return filelist;
};

const frontendSrc = path.join(__dirname, 'frontend', 'src');
const files = walkSync(frontendSrc).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace 'http://localhost:5000' and "http://localhost:5000" with (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  if (content.includes("'http://localhost:5000")) {
    content = content.replace(/'http:\/\/localhost:5000/g, "(import.meta.env.VITE_API_URL || 'http://localhost:5000') + '");
    changed = true;
  }
  if (content.includes('"http://localhost:5000')) {
    content = content.replace(/"http:\/\/localhost:5000/g, "(import.meta.env.VITE_API_URL || 'http://localhost:5000') + \"");
    changed = true;
  }
  
  // Replace `http://localhost:5000 inside backticks with ${import.meta.env.VITE_API_URL || 'http://localhost:5000'}
  if (content.includes('`http://localhost:5000')) {
    content = content.replace(/`http:\/\/localhost:5000/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}");
    changed = true;
  }

  // Handle case where API is assigned to it exactly, e.g. const API = 'http://localhost:5000/api...';
  // The above replaces it with const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api...'; which is correct JS syntax.

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
