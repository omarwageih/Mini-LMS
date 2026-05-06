/**
 * Socket.io Configuration
 * This file handles real-time communication between the server and clients.
 * It is primarily used for push notifications and instant UI updates.
 */

const { Server } = require("socket.io");

let io;

/**
 * Initializes the Socket.io server
 * @param {http.Server} server - The HTTP server instance
 */
const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            // Allow frontend to connect via WebSocket
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Handle new client connections
    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        // Listen for a 'join' event where a user joins a private room based on their ID
        // This allows the server to send targeted notifications to specific users
        socket.on("join", (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined their room`);
        });

        // Handle client disconnection
        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });

    return io;
};

/**
 * Returns the initialized Socket.io instance
 * Used by controllers to emit events from anywhere in the app
 */
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIO };

