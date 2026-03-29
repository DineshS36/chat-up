import { io } from "socket.io-client";

// Read from Vite environment variable with a localhost fallback for local development
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Pass options to ensure HTTPS and proxy compatibility via Render/Vercel
const socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"]
});

export default socket;