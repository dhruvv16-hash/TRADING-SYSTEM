require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT name, language, code FROM strategies ORDER BY "createdAt" DESC LIMIT 1', (err, res) => {
  if (err) console.error(err);
  else {
    const row = res.rows[0];
    console.log('Name:', row.name);
    console.log('Language:', row.language);
    console.log('---');
    console.log(row.code.split('\n').slice(0, 15).join('\n'));
  }
  pool.end();
});
