require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT name, "minVal", "maxVal", step FROM parameters', (err, res) => {
  if (err) console.error(err);
  else console.log(res.rows);
  pool.end();
});
