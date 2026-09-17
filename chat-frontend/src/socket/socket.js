import { io } from "socket.io-client";

// Read from Vite environment variable with a localhost fallback for local development
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create Socket.IO instance with autoConnect: false to prevent unauthenticated handshake failures on the login page
const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["polling", "websocket"],
    withCredentials: true,
    auth: (cb) => {
        cb({
            token: localStorage.getItem("token") || "",
        });
    },
});

export default socket;