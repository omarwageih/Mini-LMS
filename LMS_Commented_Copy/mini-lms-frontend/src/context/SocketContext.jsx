import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, userId }) => {
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!userId) {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        if (socketRef.current) return; // Prevent duplicate connections

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
            withCredentials: true
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            newSocket.emit('join', userId);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (reason === 'io server disconnect' || reason === 'transport close') {
                socketRef.current = null;
                setSocket(null);
            }
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.close();
                socketRef.current = null;
                setSocket(null);
            }
        };
    }, [userId]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
