/**
 * REAL-TIME COMMUNICATION (SOCKET.IO)
 * This module enables "push" capabilities. Instead of the browser asking for updates
 * every few seconds, the server can "push" data (like notifications) instantly 
 * to the user.
 */

const { Server } = require("socket.io");

let io; // Global variable to hold the socket instance

/**
 * INITIALIZE SOCKET.IO
 * Sets up the WebSocket server on top of the existing HTTP server.
 */
const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            // SECURITY: Only allow the frontend website to connect to this socket
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // 1. Connection Event: Triggered whenever a user opens the LMS in their browser
    io.on("connection", (socket) => {
        console.log("New WebSocket Connection Established:", socket.id);

        /**
         * ROOM JOINING
         * To send a private notification to "User 5", the user joins a virtual room
         * named "user_5". This keeps messages private to the intended recipient.
         */
        socket.on("join", (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined their private notification room`);
        });

        // 2. Disconnect Event: Cleanup when user closes the tab
        socket.on("disconnect", () => {
            console.log("User disconnected from WebSocket");
        });
    });

    return io;
};

/**
 * ACCESSOR FUNCTION
 * Allows other parts of the app (like NotificationController) to grab the
 * socket instance and send messages without needing to pass the variable around.
 */
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized! Call initSocket first.");
    }
    return io;
};

module.exports = { initSocket, getIO };

