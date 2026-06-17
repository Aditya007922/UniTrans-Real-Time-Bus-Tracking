import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function useSocket(serverUrl) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Socket.IO server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from Socket.IO server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [serverUrl]);

  return socket;
}

export default useSocket;
