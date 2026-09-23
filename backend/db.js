// backend/db.js - Database connection module
// Supports raw MySQL (via mysql2/promise) and built-in SQLite (via node:sqlite) fallback.
// No ORM is used; all operations are transparent parameterized raw SQL.

const path = require('path');
const fs = require('fs');
require('dotenv').config();

let pool = null;
let sqliteDb = null;
let currentDialect = process.env.DB_TYPE || 'sqlite';
let initPromise = null;

/**
 * Initialize database and execute schema if needed.
 * Returns cached promise so serverless invocations don't re-initialize redundantly.
 */
function init() {
  if (!initPromise) {
    initPromise = _doInit();
  }
  return initPromise;
}

async function _doInit() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  if (currentDialect === 'mysql') {
    try {
      const mysql = require('mysql2/promise');

      const isCloudHost = Boolean(
        process.env.DB_SSL === 'true' ||
        (process.env.DB_HOST && (
          process.env.DB_HOST.includes('tidbcloud') ||
          process.env.DB_HOST.includes('aivencloud') ||
          process.env.DB_HOST.includes('planetscale') ||
          process.env.DB_HOST.includes('amazonaws.com')
        ))
      );

      const poolOptions = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'agriconnect',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        multipleStatements: true
      };

      if (isCloudHost && process.env.DB_SSL !== 'false') {
        poolOptions.ssl = {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true
        };
      }

      pool = mysql.createPool(poolOptions);

      // Test connection
      const connection = await pool.getConnection();
      console.log('✅ Connected to MySQL Server database successfully.');
      connection.release();

      // Execute schema statements
      await pool.query(schemaSql);
      console.log('✅ MySQL schema & base seeds verified.');

      // Migrations: ensure password_hint column exists
      try {
        const [uCols] = await pool.query("SHOW COLUMNS FROM users LIKE 'password_hint'");
        if (!uCols || uCols.length === 0) {
          await pool.query('ALTER TABLE users ADD COLUMN password_hint VARCHAR(255) NULL AFTER password_hash');
        }
      } catch (e) {}

      try {
        const [sCols] = await pool.query("SHOW COLUMNS FROM centre_staff LIKE 'password_hint'");
        if (!sCols || sCols.length === 0) {
          await pool.query('ALTER TABLE centre_staff ADD COLUMN password_hint VARCHAR(255) NULL AFTER password_hash');
        }
      } catch (e) {}

      try {
        await pool.query('DROP TABLE IF EXISTS webauthn_credentials;');
      } catch (e) {}

      // Seed / Sync Pan-India Procurement Centres from centres_data.json
      const centresDataPath = path.join(__dirname, '..', 'database', 'centres_data.json');
      if (fs.existsSync(centresDataPath)) {
        try {
          const centresList = JSON.parse(fs.readFileSync(centresDataPath, 'utf8'));
          const [countCentres] = await pool.query('SELECT COUNT(*) as count FROM procurement_centres');
          if (countCentres[0].count < centresList.length) {
            for (const c of centresList) {
              await pool.query(
                `INSERT INTO procurement_centres 
                 (centre_id, state, city, centre_name, location, daily_capacity, opening_time, closing_time) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                   centre_name=VALUES(centre_name), 
                   state=VALUES(state), 
                   city=VALUES(city),
                   location=VALUES(location),
                   daily_capacity=VALUES(daily_capacity)`,
                [
                  c.centre_id,
                  c.state || '',
                  c.city || '',
                  c.centre_name,
                  c.location || '',
                  c.daily_capacity || 60,
                  c.opening_time || '08:00:00',
                  c.closing_time || '17:00:00'
                ]
              );
            }
            console.log(`✅ Seeded ${centresList.length} procurement centres in MySQL.`);
          }
        } catch (loadErr) {
          console.error('Error loading centres_data.json in MySQL:', loadErr);
        }
      }

      // Seed / Sync All Crop Rates from crops_data.json
      const cropsDataPath = path.join(__dirname, '..', 'database', 'crops_data.json');
      if (fs.existsSync(cropsDataPath)) {
        try {
          const cropsList = JSON.parse(fs.readFileSync(cropsDataPath, 'utf8'));
          for (const c of cropsList) {
            await pool.query(
              `INSERT INTO crop_rates (rate_id, crop_name, price_per_quintal, previous_price)
               VALUES (?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
                 crop_name=VALUES(crop_name),
                 price_per_quintal=VALUES(price_per_quintal)`,
              [c.rate_id, c.crop_name, c.price_per_quintal, c.previous_price]
            );
          }
          console.log(`✅ Seeded / Verified ${cropsList.length} crops in MySQL crop_rates.`);
        } catch (loadErr) {
          console.error('Error loading crops_data.json in MySQL:', loadErr);
        }
      }

      // Seed centre_staff if empty
      const [countStaff] = await pool.query('SELECT COUNT(*) as count FROM centre_staff');
      if (countStaff[0].count === 0) {
        await pool.query(
          `INSERT INTO centre_staff (id, centre_id, name, phone, password_hash, role) VALUES 
           (1, 1, 'Rajesh Sharma', '9999999999', '$2a$10$XxhGih/x7H.LOMIZ4IA4QOKWtn49HwhgbpNJuUw0LIu7g.k9gXgey', 'mandi_admin'),
           (2, 1, 'Suresh Verma', '9999988888', '$2a$10$YFSIIdJ4AxW3Hu5qd90GEu9PZOdh8zW3QlmHlbGlM0Jwd7dKassPC', 'mandi_member')
           ON DUPLICATE KEY UPDATE name=VALUES(name)`
        );
      }

      return;
    } catch (err) {
      console.warn(`⚠️ MySQL connection failed (${err.message}). Falling back to built-in SQLite engine...`);
      currentDialect = 'sqlite';
    }
  }

  // SQLite Initialization (using native Node.js sqlite)
  const { DatabaseSync } = require('node:sqlite');
  const dbFile = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'agriconnect.db');
  sqliteDb = new DatabaseSync(dbFile);
  console.log(`✅ Using native SQLite database at: ${dbFile}`);

  // Create tables in SQLite
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone_number TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_hint TEXT,
      role TEXT DEFAULT 'farmer',
      village TEXT,
      id_proof_number TEXT,
      centre_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farmer_crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL,
      crop_name TEXT NOT NULL,
      FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS procurement_centres (
      centre_id INTEGER PRIMARY KEY AUTOINCREMENT,
      centre_name TEXT NOT NULL,
      state TEXT,
      city TEXT,
      location TEXT,
      daily_capacity INTEGER DEFAULT 60,
      opening_time TEXT DEFAULT '08:00:00',
      closing_time TEXT DEFAULT '17:00:00'
    );

    CREATE TABLE IF NOT EXISTS crop_rates (
      rate_id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_name TEXT NOT NULL,
      price_per_quintal REAL NOT NULL,
      previous_price REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS centre_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      centre_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_hint TEXT,
      role TEXT DEFAULT 'mandi_member',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (centre_id) REFERENCES procurement_centres(centre_id)
    );

    CREATE TABLE IF NOT EXISTS slots (
      slot_id INTEGER PRIMARY KEY AUTOINCREMENT,
      centre_id INTEGER NOT NULL,
      slot_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      max_bookings INTEGER DEFAULT 20,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (centre_id) REFERENCES procurement_centres(centre_id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER,
      centre_id INTEGER NOT NULL,
      slot_id INTEGER,
      crop_name TEXT NOT NULL,
      estimated_quantity_kg REAL,
      slot_date TEXT NOT NULL,
      slot_time TEXT NOT NULL,
      queue_number INTEGER,
      channel TEXT DEFAULT 'online',
      approval_status TEXT DEFAULT 'pending',
      booking_status TEXT DEFAULT 'booked',
      procurement_status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'pending',
      registered_by_staff_id INTEGER,
      walkin_name TEXT,
      walkin_phone TEXT,
      final_quantity_kg REAL,
      final_amount REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(user_id),
      FOREIGN KEY (centre_id) REFERENCES procurement_centres(centre_id),
      FOREIGN KEY (slot_id) REFERENCES slots(slot_id),
      FOREIGN KEY (registered_by_staff_id) REFERENCES centre_staff(id)
    );

    CREATE TABLE IF NOT EXISTS procurement_records (
      record_id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      actual_quantity_kg REAL NOT NULL,
      quality_grade TEXT NOT NULL,
      agreed_price_per_unit REAL NOT NULL,
      final_amount REAL NOT NULL,
      adjustment_reason TEXT,
      recorded_by_staff_id INTEGER,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT NOT NULL,
      payment_status TEXT DEFAULT 'paid',
      transaction_ref TEXT,
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      image_data TEXT,
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
    );

    CREATE TABLE IF NOT EXISTS queue_status (
      queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
      centre_id INTEGER NOT NULL,
      slot_date TEXT NOT NULL,
      now_serving_number INTEGER DEFAULT 0,
      FOREIGN KEY (centre_id) REFERENCES procurement_centres(centre_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER,
      booking_id INTEGER,
      message TEXT NOT NULL,
      channel TEXT DEFAULT 'app',
      is_read INTEGER DEFAULT 0,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(user_id),
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
    );
  `);

  // SQLite Migrations & Cleanup
  try {
    // Drop deprecated WebAuthn/Passkey table if present
    sqliteDb.exec('DROP TABLE IF EXISTS webauthn_credentials;');

    // Ensure password_hint column exists in users
    const userCols = sqliteDb.prepare('PRAGMA table_info(users)').all();
    if (!userCols.some(c => c.name === 'password_hint')) {
      sqliteDb.exec('ALTER TABLE users ADD COLUMN password_hint TEXT;');
    }

    // Ensure password_hint column exists in centre_staff
    const staffCols = sqliteDb.prepare('PRAGMA table_info(centre_staff)').all();
    if (!staffCols.some(c => c.name === 'password_hint')) {
      sqliteDb.exec('ALTER TABLE centre_staff ADD COLUMN password_hint TEXT;');
    }

    const tableCols = sqliteDb.prepare('PRAGMA table_info(procurement_centres)').all();
    const hasState = tableCols.some(c => c.name === 'state');
    if (!hasState) {
      sqliteDb.exec('ALTER TABLE procurement_centres ADD COLUMN state TEXT;');
      sqliteDb.exec('ALTER TABLE procurement_centres ADD COLUMN city TEXT;');
    }

    const hasCentreId = userCols.some(c => c.name === 'centre_id');
    if (!hasCentreId) {
      sqliteDb.exec('ALTER TABLE users ADD COLUMN centre_id INTEGER;');
    }

    // Migrations for bookings table
    const bookingCols = sqliteDb.prepare('PRAGMA table_info(bookings)').all();
    const bColNames = bookingCols.map(c => c.name);
    if (!bColNames.includes('channel')) sqliteDb.exec("ALTER TABLE bookings ADD COLUMN channel TEXT DEFAULT 'online';");
    if (!bColNames.includes('approval_status')) sqliteDb.exec("ALTER TABLE bookings ADD COLUMN approval_status TEXT DEFAULT 'pending';");
    if (!bColNames.includes('registered_by_staff_id')) sqliteDb.exec('ALTER TABLE bookings ADD COLUMN registered_by_staff_id INTEGER;');
    if (!bColNames.includes('walkin_name')) sqliteDb.exec('ALTER TABLE bookings ADD COLUMN walkin_name TEXT;');
    if (!bColNames.includes('walkin_phone')) sqliteDb.exec('ALTER TABLE bookings ADD COLUMN walkin_phone TEXT;');
    if (!bColNames.includes('slot_id')) sqliteDb.exec('ALTER TABLE bookings ADD COLUMN slot_id INTEGER;');

    // Ensure at most one mandi_admin can be assigned per centre
    sqliteDb.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_centre_staff_admin ON centre_staff (centre_id) WHERE role = 'mandi_admin';");

    // Ensure farmer_id is nullable in SQLite for offline walk-ins
    const farmerIdCol = bookingCols.find(c => c.name === 'farmer_id');
    if (farmerIdCol && farmerIdCol.notnull === 1) {
      sqliteDb.exec(`
        PRAGMA foreign_keys=off;
        CREATE TABLE IF NOT EXISTS bookings_temp (
          booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
          farmer_id INTEGER,
          centre_id INTEGER NOT NULL,
          slot_id INTEGER,
          crop_name TEXT NOT NULL,
          estimated_quantity_kg REAL,
          slot_date TEXT NOT NULL,
          slot_time TEXT NOT NULL,
          queue_number INTEGER,
          channel TEXT DEFAULT 'online',
          approval_status TEXT DEFAULT 'pending',
          booking_status TEXT DEFAULT 'booked',
          procurement_status TEXT DEFAULT 'pending',
          payment_status TEXT DEFAULT 'pending',
          registered_by_staff_id INTEGER,
          walkin_name TEXT,
          walkin_phone TEXT,
          final_quantity_kg REAL,
          final_amount REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO bookings_temp SELECT booking_id, farmer_id, centre_id, slot_id, crop_name, estimated_quantity_kg, slot_date, slot_time, queue_number, channel, approval_status, booking_status, procurement_status, payment_status, registered_by_staff_id, walkin_name, walkin_phone, final_quantity_kg, final_amount, created_at FROM bookings;
        DROP TABLE bookings;
        ALTER TABLE bookings_temp RENAME TO bookings;
        PRAGMA foreign_keys=on;
      `);
    }

    // Migrations for procurement_records table
    const procCols = sqliteDb.prepare('PRAGMA table_info(procurement_records)').all();
    const pColNames = procCols.map(c => c.name);
    if (!pColNames.includes('final_amount')) sqliteDb.exec('ALTER TABLE procurement_records ADD COLUMN final_amount REAL;');
    if (!pColNames.includes('adjustment_reason')) sqliteDb.exec('ALTER TABLE procurement_records ADD COLUMN adjustment_reason TEXT;');
  } catch (colErr) {
    console.error('Migration error:', colErr);
  }

  // Seed / Sync Pan-India Procurement Centres from centres_data.json
  const centresDataPath = path.join(__dirname, '..', 'database', 'centres_data.json');
  if (fs.existsSync(centresDataPath)) {
    try {
      const centresList = JSON.parse(fs.readFileSync(centresDataPath, 'utf8'));
      const countCentres = sqliteDb.prepare('SELECT COUNT(*) as count FROM procurement_centres').get();
      if (countCentres.count < centresList.length) {
        const upsertCentre = sqliteDb.prepare(`
          INSERT OR REPLACE INTO procurement_centres 
          (centre_id, state, city, centre_name, location, daily_capacity, opening_time, closing_time) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const c of centresList) {
          upsertCentre.run(
            c.centre_id,
            c.state || '',
            c.city || '',
            c.centre_name,
            c.location || '',
            c.daily_capacity || 60,
            c.opening_time || '08:00:00',
            c.closing_time || '17:00:00'
          );
        }
        console.log(`✅ Seeded ${centresList.length} procurement centres across all Indian states and cities.`);
      }
    } catch (loadErr) {
      console.error('Error loading centres_data.json:', loadErr);
    }
  }

  // Seed / Sync All Crop Rates from crops_data.json
  const cropsDataPath = path.join(__dirname, '..', 'database', 'crops_data.json');
  if (fs.existsSync(cropsDataPath)) {
    try {
      const cropsList = JSON.parse(fs.readFileSync(cropsDataPath, 'utf8'));
      const upsertRate = sqliteDb.prepare(`
        INSERT INTO crop_rates (rate_id, crop_name, price_per_quintal, previous_price, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(rate_id) DO UPDATE SET
          crop_name=excluded.crop_name
      `);
      for (const c of cropsList) {
        upsertRate.run(c.rate_id, c.crop_name, c.price_per_quintal, c.previous_price);
      }
      console.log(`✅ Seeded / Verified ${cropsList.length} crops in crop_rates.`);
    } catch (loadErr) {
      console.error('Error loading crops_data.json:', loadErr);
    }
  } else {
    const countRates = sqliteDb.prepare('SELECT COUNT(*) as count FROM crop_rates').get();
    if (countRates.count === 0) {
      const insertRate = sqliteDb.prepare('INSERT INTO crop_rates (rate_id, crop_name, price_per_quintal, previous_price) VALUES (?, ?, ?, ?)');
      insertRate.run(1, 'Wheat (Sharbati)', 2450.00, 2410.00);
      insertRate.run(2, 'Paddy (Basmati)', 3850.00, 3900.00);
    }
  }

  // Seed Users if empty
  const countUsers = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get();
  if (countUsers.count === 0) {
    const insertUser = sqliteDb.prepare('INSERT INTO users (user_id, full_name, phone_number, password_hash, role, village, id_proof_number) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertUser.run(1, 'Mandi Officer Rajesh Sharma', '9999999999', '$2a$10$XxhGih/x7H.LOMIZ4IA4QOKWtn49HwhgbpNJuUw0LIu7g.k9gXgey', 'staff', 'Central Mandi Complex', 'OFFICER-MH-8821');
    insertUser.run(2, 'Ramesh Kumar Patil', '9876543210', '$2a$10$gehYsdOeHuhy1jNokpSYgOXiYr9bAGjVP0iXa9/G4bybk47zViTaW', 'farmer', 'Dindori, Nashik', 'AADHAAR-8921-4412-9018');

    const insertFarmerCrop = sqliteDb.prepare('INSERT INTO farmer_crops (id, farmer_id, crop_name) VALUES (?, ?, ?)');
    insertFarmerCrop.run(1, 2, 'Tomato (Hybrid)');
    insertFarmerCrop.run(2, 2, 'Onion (Red Nashik)');
    insertFarmerCrop.run(3, 2, 'Wheat (Sharbati)');
  }

  // Seed centre_staff if empty
  const countStaff = sqliteDb.prepare('SELECT COUNT(*) as count FROM centre_staff').get();
  if (countStaff.count === 0) {
    const insertStaff = sqliteDb.prepare('INSERT INTO centre_staff (id, centre_id, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)');
    insertStaff.run(1, 1, 'Rajesh Sharma', '9999999999', '$2a$10$XxhGih/x7H.LOMIZ4IA4QOKWtn49HwhgbpNJuUw0LIu7g.k9gXgey', 'mandi_admin');
    insertStaff.run(2, 1, 'Suresh Verma', '9999988888', '$2a$10$YFSIIdJ4AxW3Hu5qd90GEu9PZOdh8zW3QlmHlbGlM0Jwd7dKassPC', 'mandi_member');
  }

  console.log('✅ SQLite database initialized with schema and seed data.');
}

/**
 * Ensures slots exist for a given centre and date.
 * Creates hourly slots based on centre hours and daily capacity if not already created.
 */
async function ensureSlotsForCentre(centreId, dateStr) {
  let existing = await query('SELECT * FROM slots WHERE centre_id = ? AND slot_date = ? ORDER BY start_time ASC', [centreId, dateStr]);
  if (existing && existing.length > 0) {
    return existing;
  }

  const centre = await get('SELECT daily_capacity, opening_time, closing_time FROM procurement_centres WHERE centre_id = ?', [centreId]);
  const openingTime = (centre && centre.opening_time) || '08:00:00';
  const closingTime = (centre && centre.closing_time) || '17:00:00';
  const dailyCapacity = (centre && centre.daily_capacity) || 60;

  const startH = parseInt(openingTime.split(':')[0], 10) || 8;
  const endH = parseInt(closingTime.split(':')[0], 10) || 17;
  const totalSlots = Math.max(1, endH - startH);
  const perSlotCap = Math.max(1, Math.ceil(dailyCapacity / totalSlots));

  for (let h = startH; h < endH; h++) {
    const startTime = `${String(h).padStart(2, '0')}:00:00`;
    const endTime = `${String(h + 1).padStart(2, '0')}:00:00`;
    await query(
      'INSERT INTO slots (centre_id, slot_date, start_time, end_time, max_bookings) VALUES (?, ?, ?, ?, ?)',
      [centreId, dateStr, startTime, endTime, perSlotCap]
    );
  }

  return await query('SELECT * FROM slots WHERE centre_id = ? AND slot_date = ? ORDER BY start_time ASC', [centreId, dateStr]);
}

/**
 * Execute raw SQL query with parameters.
 * Returns array of rows for SELECT, or { insertId, affectedRows } for INSERT/UPDATE/DELETE.
 */
async function query(sql, params = []) {
  if (currentDialect === 'mysql' && pool) {
    const [result] = await pool.query(sql, params);
    if (Array.isArray(result)) {
      return result;
    }
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  }

  // SQLite execution
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params);
  } else {
    const stmt = sqliteDb.prepare(sql);
    const result = stmt.run(...params);
    return {
      insertId: Number(result.lastInsertRowid),
      affectedRows: Number(result.changes)
    };
  }
}

/**
 * Get single row helper
 */
async function get(sql, params = []) {
  const rows = await query(sql, params);
  if (Array.isArray(rows)) {
    return rows[0] || null;
  }
  return rows || null;
}

module.exports = {
  init,
  query,
  get,
  ensureSlotsForCentre,
  getDialect: () => currentDialect
};
