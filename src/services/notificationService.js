import { io } from "socket.io-client";

class NotificationService {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    // Connect to Socket.IO server with JWT token
    this.socket = io(SOCKET_URL, {
      auth: { token },
      query: { token },
      transports: ["websocket", "polling"],
    });

    // Connection events
    this.socket.on("connect", () => {
      console.log("✓ Connected to notifications");
    });

    this.socket.on("connected", (data) => {
      console.log("✓ Server confirmed:", data.message);
    });

    this.socket.on("disconnect", () => {
      console.log("✗ Disconnected from notifications");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    // Listen for notifications
    this.socket.on("notification", (notification) => {
      console.log("📬 New notification:", notification);
      this.notifyListeners(notification);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to notifications
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(notification) {
    this.listeners.forEach((callback) => callback(notification));
  }
}

const instance = new NotificationService();
export default instance;
