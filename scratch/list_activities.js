const { Client } = require('pg');
require('dotenv').config();

const dbPassword = process.env.SUPABASE_DB_PASSWORD || '1119181661deisy';
const dbHost = process.env.SUPABASE_DB_HOST || 'aws-0-us-west-2.pooler.supabase.com';
const dbPort = process.env.SUPABASE_DB_PORT || '6543';
const projectId = 'ugjoduiodlaxjdxcevxh';
const dbUser = `postgres.${projectId}`;

const connectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres`;

async function query() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(`
    SELECT DISTINCT nombre FROM catalogo_actividades ORDER BY nombre;
  `);
  console.log(res.rows.map(r => r.nombre));
  await client.end();
}

query().catch(console.error);
