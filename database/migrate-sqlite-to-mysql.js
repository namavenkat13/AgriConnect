// database/migrate-sqlite-to-mysql.js
// Migration Utility: Safely copies existing tables and records from local SQLite (agriconnect.db)
// into your TiDB Cloud Serverless MySQL database.
//
// Usage:
//   node database/migrate-sqlite-to-mysql.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { DatabaseSync } = require('node:sqlite');

async function migrate() {
  console.log('🌾 ===================================================');
  console.log('   AgriConnect SQLite to TiDB/MySQL Data Migration');
  console.log('🌾 ===================================================\n');

  const sqlitePath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'agriconnect.db');
  if (!fs.existsSync(sqlitePath)) {
    console.error(`❌ SQLite database file not found at: ${sqlitePath}`);
    process.exit(1);
  }

  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPass = process.env.DB_PASS;
  const dbName = process.env.DB_NAME || 'agriconnect';
  const dbPort = parseInt(process.env.DB_PORT || '4000', 10);

  if (!dbHost || dbHost === 'localhost') {
    console.log('ℹ️  Note: DB_HOST is currently set to:', dbHost);
    console.log('   To migrate to TiDB Cloud, set your TiDB credentials in .env or run with:');
    console.log('   DB_HOST=gateway01.xxx.tidbcloud.com DB_USER=xxx.root DB_PASS=xxx DB_PORT=4000 node database/migrate-sqlite-to-mysql.js\n');
  }

  console.log(`📡 Connecting to MySQL database at ${dbHost}:${dbPort}/${dbName}...`);

  const isCloudHost = Boolean(
    process.env.DB_SSL === 'true' ||
    (dbHost && (
      dbHost.includes('tidbcloud') ||
      dbHost.includes('aivencloud') ||
      dbHost.includes('planetscale') ||
      dbHost.includes('amazonaws.com')
    ))
  );

  const poolOptions = {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPass,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 5,
    multipleStatements: true
  };

  if (isCloudHost && process.env.DB_SSL !== 'false') {
    poolOptions.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  }

  let pool;
  try {
    pool = mysql.createPool(poolOptions);
    const conn = await pool.getConnection();
    console.log('✅ Connected to target MySQL/TiDB database successfully.\n');
    conn.release();
  } catch (err) {
    console.error('❌ Failed to connect to MySQL/TiDB:', err.message);
    process.exit(1);
  }

  // 1. Initialize schema
  console.log('🔨 Executing schema.sql on target database...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schemaSql);
  console.log('✅ Base schema created/verified.\n');

  // 2. Open SQLite database
  console.log(`📂 Reading source SQLite database (${sqlitePath})...`);
  const sqliteDb = new DatabaseSync(sqlitePath);

  const tables = [
    'procurement_centres',
    'crop_rates',
    'users',
    'farmer_crops',
    'centre_staff',
    'slots',
    'bookings',
    'procurement_records',
    'payments',
    'receipts',
    'queue_status',
    'notifications'
  ];

  for (const table of tables) {
    try {
      // Check if table exists in SQLite
      const tableCheck = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
      if (!tableCheck) {
        console.log(`   ⏭  Table '${table}' not found in SQLite, skipping.`);
        continue;
      }

      const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
      if (!rows || rows.length === 0) {
        console.log(`   ⚪ Table '${table}': 0 rows to copy.`);
        continue;
      }

      const columns = Object.keys(rows[0]);
      const colPlaceholders = columns.map(() => '?').join(', ');
      const updateClause = columns.map(c => `\`${c}\`=VALUES(\`${c}\`)`).join(', ');

      const insertSql = `INSERT INTO \`${table}\` (\`${columns.join('`, `')}\`) VALUES (${colPlaceholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;

      let migratedCount = 0;
      for (const row of rows) {
        const values = columns.map(c => row[c] === undefined ? null : row[c]);
        await pool.query(insertSql, values);
        migratedCount++;
      }

      console.log(`   ✔ Table '${table}': ${migratedCount} rows copied successfully.`);
    } catch (tblErr) {
      console.error(`   ⚠️  Error copying table '${table}':`, tblErr.message);
    }
  }

  console.log('\n🌾 ===================================================');
  console.log('   Data migration completed successfully!');
  console.log('🌾 ===================================================\n');

  await pool.end();
}

migrate().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
