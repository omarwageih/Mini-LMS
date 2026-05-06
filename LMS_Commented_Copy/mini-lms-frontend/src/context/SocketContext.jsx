/**
 * SOCKET.IO CONTEXT
 * This provides a global "real-time" connection to every component in the app.
 * It allows the frontend to listen for instant notifications from the server.
 */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Create the context "bucket"
const SocketContext = createContext();

/**
 * Custom Hook: useSocket()
 * Allows any component to easily grab the active socket connection.
 */
export const useSocket = () => useContext(SocketContext);

/**
 * PROVIDER COMPONENT
 * Wraps the entire app. It opens the WebSocket when the user logs in
 * and closes it when they log out.
 */
export const SocketProvider = ({ children, userId }) => {
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        // If no user is logged in, don't open a socket
        if (!userId) {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        // 1. Avoid double-connections
        if (socketRef.current) return; 

        // 2. Open the connection to the backend
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
            withCredentials: true // Required for secure sessions
        });

        // 3. Setup Connection Event
        newSocket.on('connect', () => {
            console.log('✅ Real-time link established');
            // Tell the server "I am User X, put me in my private room"
            newSocket.emit('join', userId);
        });

        // 4. Handle unexpected disconnections
        newSocket.on('disconnect', (reason) => {
            console.warn('❌ Real-time link broken:', reason);
            if (reason === 'io server disconnect' || reason === 'transport close') {
                socketRef.current = null;
                setSocket(null);
            }
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        // CLEANUP: Close the socket if the component is destroyed
        return () => {
            if (newSocket) {
                newSocket.close();
                socketRef.current = null;
                setSocket(null);
            }
        };
    }, [userId]); // Re-run whenever the logged-in UserID changes

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
