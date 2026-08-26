require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT id FROM strategies ORDER BY "createdAt" DESC LIMIT 1', (err, res) => {
  if (!err) {
    const strategyId = res.rows[0].id;
    console.log('Strategy ID:', strategyId);
    pool.query('SELECT name, "minVal", "maxVal", step FROM parameters WHERE "strategyId" = ', [strategyId], (err, res) => {
      console.log('Parameters:', res.rows);
      pool.end();
    });
  }
});
