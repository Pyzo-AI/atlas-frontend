import { io } from "socket.io-client";

class NotificationService {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.statusListeners = new Set();
    this.token = null;
    this.connectionCount = 0;
  }

  connect(token) {
    if (!token) return;
    
    // If token changed, disconnect previous
    if (this.token && this.token !== token) {
      this.disconnect(true);
    }
    
    this.token = token;
    this.connectionCount++;

    if (this.socket) {
      if (this.socket.connected) {
        // Trigger connected manually for the new hook if already connected
        this.notifyStatusListeners(true);
      }
      return;
    }
    const SOCKET_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "") + "/notifications";
    console.log("🔌 Connecting to Notification Socket:", SOCKET_URL);

    // Connect to Socket.IO server
    // We pass token in BOTH query and auth to be safe
    this.socket = io(SOCKET_URL, {
      auth: { token },
      query: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Socket connected");
      this.notifyStatusListeners(true);
    });

    this.socket.on("connected", (data) => {
      console.log("✅ Server confirmed connection:", data.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      this.notifyStatusListeners(false);
    });

    this.socket.on("connect_error", (error) => {
      console.error("⚠️ Socket connection error:", error);
      this.notifyStatusListeners(false);
    });

    // Listen for notifications
    this.socket.on("notification", (notification) => {
      console.log("📬 Received real-time notification:", notification);
      this.notifyListeners(notification);
    });
  }

  disconnect(force = false) {
    this.connectionCount--;
    if ((this.connectionCount <= 0 || force) && this.socket) {
      console.log("🔌 Disconnecting Socket");
      this.socket.disconnect();
      this.socket = null;
      this.connectionCount = 0;
      this.token = null;
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners(notification) {
    this.listeners.forEach((listener) => listener(notification));
  }

  // Helper for status updates
  subscribeStatus(callback) {
    this.statusListeners = this.statusListeners || new Set();
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  notifyStatusListeners(isConnected) {
    if (this.statusListeners) {
      this.statusListeners.forEach((listener) => listener(isConnected));
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
