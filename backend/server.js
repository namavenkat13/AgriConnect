// backend/server.js
// AgriConnect Express & Socket.IO Web Server

require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');

const db = require('./db');
const { initSockets } = require('./sockets');
const { router: authRouter } = require('./routes/auth');
const { router: ratesRouter, startMarketSimulator } = require('./routes/rates');
const centresRouter = require('./routes/centres');
const bookingsRouter = require('./routes/bookings');
const queueRouter = require('./routes/queue');
const notificationsRouter = require('./routes/notifications');
const mandiRouter = require('./routes/mandi');
const receiptsRouter = require('./routes/receipts');
const { getISTDateString } = require('./utils/timezone');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Setup sockets and room handlers
initSockets(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve frontend static assets
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/rates', ratesRouter);
app.use('/api/centres', centresRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/queue', queueRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/mandi', mandiRouter);
app.use('/api/receipts', receiptsRouter);

// Analytics API for Admin Dashboard
app.get('/api/analytics', async (req, res) => {
  try {
    const today = getISTDateString();

    // Summary counts
    const totalToday = await db.get(
      "SELECT COUNT(*) as count, COALESCE(SUM(final_quantity_kg), 0) as total_kg, COALESCE(SUM(final_amount), 0) as total_payout FROM bookings WHERE slot_date = ? AND booking_status != 'cancelled'",
      [today]
    );

    const farmersServed = await db.get(
      "SELECT COUNT(*) as count FROM bookings WHERE slot_date = ? AND (booking_status = 'completed' OR procurement_status IN ('accepted', 'rejected'))",
      [today]
    );

    // Bookings per hour today (congestion analysis)
    const hourlyBookings = await db.query(
      `SELECT slot_time, COUNT(*) as count 
       FROM bookings 
       WHERE slot_date = ? AND booking_status != 'cancelled' 
       GROUP BY slot_time 
       ORDER BY slot_time ASC`,
      [today]
    );

    // Crop breakdown
    const cropBreakdown = await db.query(
      `SELECT crop_name, COUNT(*) as bookings_count, COALESCE(SUM(estimated_quantity_kg), 0) as est_total_kg 
       FROM bookings 
       WHERE slot_date = ? 
       GROUP BY crop_name 
       ORDER BY bookings_count DESC 
       LIMIT 6`,
      [today]
    );

    res.json({
      success: true,
      today,
      metrics: {
        total_bookings: totalToday ? Number(totalToday.count) : 0,
        farmers_served: farmersServed ? Number(farmersServed.count) : 0,
        total_procured_kg: totalToday ? Number(totalToday.total_kg) : 0,
        total_payout_inr: totalToday ? Number(totalToday.total_payout) : 0,
        avg_wait_time_mins: 18 // Benchmark average wait time
      },
      hourly_congestion: hourlyBookings,
      crop_breakdown: cropBreakdown
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
});

// HTML page routing fallbacks
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(frontendDir, 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendDir, 'admin.html'));
});

app.get('/mandi', (req, res) => {
  res.sendFile(path.join(frontendDir, 'mandi.html'));
});

// Catch-all 404 handler for unmatched API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

const PORT = process.env.PORT || 3000;

// Initialize Database & Boot Server
async function startServer() {
  try {
    await db.init();
    
    // Start background market ticker simulator (auto price fluctuation)
    if (process.env.VERCEL !== '1') {
      startMarketSimulator();
    }

    server.listen(PORT, () => {
      console.log(`\n🌾 ===================================================`);
      console.log(`   AgriConnect Platform Server running on port ${PORT}`);
      console.log(`   👉 Local URL: http://localhost:${PORT}`);
      console.log(`   👉 Public Mandi Rates & Login: http://localhost:${PORT}/index.html`);
      console.log(`   👉 Farmer Dashboard: http://localhost:${PORT}/dashboard.html`);
      console.log(`   👉 Admin/Staff Portal: http://localhost:${PORT}/admin.html`);
      console.log(`🌾 ===================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Automatically start server for local development and continuous hosts (e.g. Railway),
// but permit clean serverless import on Vercel
if (process.env.VERCEL !== '1') {
  startServer();
}

module.exports = { app, server, startServer };
