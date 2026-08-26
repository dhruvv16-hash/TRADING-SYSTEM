const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('const session = await auth()') && content.includes('const userId = (session?.user')) {
    content = content.replace(/const session = await auth\(\)\s*const userId = \(session\?\.user as \{ id\?: string \}\)\?\.id/g, 'const { userId } = await auth()');
    changed = true;
  }
  
  // also fix redirect
  if (content.includes('if (!userId) redirect(\'/login\')')) {
     // do nothing
  } else if (content.includes('const { userId } = await auth()') && !content.includes('redirect')) {
     content = content.replace('const { userId } = await auth()', 'const { userId } = await auth()\n  if (!userId) throw new Error(\'Unauthorized\')');
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
});

