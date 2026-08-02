import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const url = new URL(process.env.DATABASE_URL);
const dbName = url.pathname.slice(1);

async function ensureDatabase() {
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`base ${dbName} creada`);
  }
  await admin.end();
}

async function applySchema() {
  const sql = await readFile(fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8');
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(sql);
  await client.end();
}

await ensureDatabase();
await applySchema();
console.log('esquema aplicado');
