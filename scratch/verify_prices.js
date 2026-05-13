const { Client } = require('pg');
require('dotenv').config();

const dbPassword = process.env.SUPABASE_DB_PASSWORD || '1119181661deisy';
const dbHost = process.env.SUPABASE_DB_HOST || 'aws-0-us-west-2.pooler.supabase.com';
const dbPort = process.env.SUPABASE_DB_PORT || '6543';
const projectId = 'ugjoduiodlaxjdxcevxh';
const dbUser = `postgres.${projectId}`;

const connectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres`;

async function verify() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(`
    SELECT ca.nombre as actividad, cai.tipo, cai.nombre, 
           cai.cantidad, cai.precio_unitario,
           ROUND(cai.cantidad * cai.precio_unitario, 0) as subtotal_item
    FROM catalogo_apu_items cai
    JOIN catalogo_actividades ca ON ca.id = cai.catalogo_actividad_id
    ORDER BY ca.nombre, cai.tipo, cai.orden
    LIMIT 50;
  `);
  console.table(res.rows);
  await client.end();
}

verify().catch(console.error);
