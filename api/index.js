// api/index.js
// Vercel Serverless Function entrypoint for AgriConnect Express Platform

const db = require('../backend/db');
const { app } = require('../backend/server');

module.exports = async (req, res) => {
  // Ensure database initialization is complete before handling serverless requests
  try {
    await db.init();
  } catch (err) {
    console.error('Database connection error in Vercel function:', err);
    return res.status(500).json({ success: false, message: 'Database initialization failed.' });
  }

  // Forward request to Express app
  return app(req, res);
};
