const { Server } = require("socket.io");
const Message = require('./models/message');
const Space = require('./models/space');

let io;

function initWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-space', (spaceID) => {
    socket.join(spaceID);
    console.log(`Socket ${socket.id} joined space ${spaceID}`);
  });

  socket.on('leave-space', (spaceID) => {
    socket.leave(spaceID);
    console.log(`Socket ${socket.id} left space ${spaceID}`);
  });

  socket.on('send-message', async ({ spaceID, content, sender }) => {
    console.log('spaceID', spaceID)
    console.log('content', content)
    console.log('sender', sender)
    if (!spaceID || !content || !sender) {
      console.log('Improper message sent')
      return;
    }
    const saved = await Message.create({ space: spaceID, content, sender });


    await Space.findByIdAndUpdate(spaceID, {
      $addToSet: { messages: saved._id }
    });

    const populated = await saved.populate('sender', 'name username profilePhoto');
    io.to(spaceID).emit('new-message', populated);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
  });
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = { initWebSocket, getIO };
