const socketIO = require('socket.io');

let io;

/**
 * Initialize Socket.io for real-time notifications
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.io instance
 */
const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`✅ New client connected: ${socket.id}`);

    // User joins their personal room (for user-specific notifications)
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get Socket.io instance
 * @returns {Object} Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Send notification to a specific user
 * @param {String} userId - User ID
 * @param {String} event - Event name
 * @param {Object} data - Notification data
 */
const sendNotification = (userId, event, data) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  sendNotification
};