// backend/sockets/index.js
// Socket.IO real-time event handlers and room coordination

const smsUtil = require('../utils/sms');

let io = null;

function initSockets(socketIO) {
  io = socketIO;
  smsUtil.setSocketIO(io);

  io.on('connection', (socket) => {
    // Join a user room for targeted notifications
    socket.on('join_user', (userId) => {
      if (userId) {
        const room = `user_${userId}`;
        socket.join(room);
        // console.log(`Socket ${socket.id} joined user room: ${room}`);
      }
    });

    // Join a centre room for live queue tracking
    socket.on('join_centre', (centreId) => {
      if (centreId) {
        const room = `centre_${centreId}`;
        socket.join(room);
        // console.log(`Socket ${socket.id} joined centre room: ${room}`);
      }
    });

    // Leave a centre room
    socket.on('leave_centre', (centreId) => {
      if (centreId) {
        socket.leave(`centre_${centreId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

/**
 * Broadcast queue update to all viewers of a specific procurement centre
 */
function broadcastQueueUpdate(centreId, queueData) {
  if (io) {
    io.to(`centre_${centreId}`).emit('queue_update', {
      centre_id: centreId,
      ...queueData,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Broadcast rate update globally to all connected clients (landing page + dashboards)
 */
function broadcastRateUpdate(rateData) {
  if (io) {
    io.emit('rate_update', {
      ...rateData,
      timestamp: new Date().toISOString()
    });
  }
}

function getIO() {
  return io;
}

module.exports = {
  initSockets,
  broadcastQueueUpdate,
  broadcastRateUpdate,
  getIO
};
