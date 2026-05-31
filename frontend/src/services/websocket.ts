import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io('http://localhost:8080/ws', {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToTask(taskId: string, callback: (data: any) => void) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    const channel = `/topic/task/${taskId}`;
    //this.socket.subscribe(channel);
    this.socket.on(channel, callback);

    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);
  }

  unsubscribeFromTask(taskId: string) {
    if (!this.socket) return;

    const channel = `/topic/task/${taskId}`;
    const callbacks = this.listeners.get(channel);
    if (callbacks) {
      callbacks.forEach((callback) => {
        this.socket?.off(channel, callback);
      });
      this.listeners.delete(channel);
    }
  }

  sendMessage(destination: string, data: any) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.emit(destination, data);
  }

  onTaskUpdate(callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.on('taskUpdate', callback);
    return () => {
      this.socket?.off('taskUpdate', callback);
    };
  }

  ping() {
    this.sendMessage('/app/ping', {});
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();