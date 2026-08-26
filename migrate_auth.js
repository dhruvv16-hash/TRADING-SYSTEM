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

  const targetImport = 'import { auth } from \'@/lib/auth\'';
  const newImport = 'import { auth } from \'@clerk/nextjs/server\'';

  if (content.includes(targetImport)) {
    content = content.replace(targetImport, newImport);
    changed = true;
  }

  if (content.includes('const session = await auth()') && content.includes('session?.user?.id')) {
    content = content.replace(/const session = await auth\(\)/g, 'const { userId } = await auth()');
    content = content.replace(/if \(\!session\?\.user\?\.id\) throw new Error\("Unauthorized"\)/g, 'if (!userId) throw new Error("Unauthorized")');
    content = content.replace(/if \(\!session\?\.user\?\.id\) redirect\("\/login"\)/g, 'if (!userId) redirect(/login)');
    
    // For general session.user.id usage
    content = content.replace(/session\?\.user\?\.id/g, 'userId');
    content = content.replace(/session\.user\.id/g, 'userId');
    
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
});

