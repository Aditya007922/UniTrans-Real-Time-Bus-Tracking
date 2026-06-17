import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 [SOCKET] Connected to UniTrans Server:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔌 [SOCKET] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ [SOCKET] Connection Error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinBusRoom(busId) {
    if (this.socket) {
      this.socket.emit('passenger-connect', { busId });
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

const socketService = new SocketService();
export default socketService;
