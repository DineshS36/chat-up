require('dotenv').config();
const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

// --- CONFIGURATION ---
const URL = 'http://localhost:5000'; // Change to your deployed URL if testing production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const MAX_CLIENTS = 1000; // Start with 1,000 for local testing. Increase to 10,000+ on a real server
const CLIENT_CREATION_INTERVAL_MS = 10; // Connect a new user every 10ms
const EMIT_INTERVAL_MS = 10000; // How often each user sends a heartbeat

let clientCount = 0;
let connectionCount = 0;

console.log(`\n🚀 Starting ChatUp Load Test...`);
console.log(`Target: ${MAX_CLIENTS} Concurrent Users\n`);

const createClient = (userId) => {
    // 1. Generate a valid JWT for this virtual user so the server accepts the connection
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });

    // 2. Connect via WebSockets
    const socket = io(URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false // Fail fast if the server drops it
    });

    socket.on('connect', () => {
        connectionCount++;
        // Trigger the join event so the server maps this user
        socket.emit('join', userId);
        
        if (connectionCount === MAX_CLIENTS) {
            console.log(`\n✅ SUCCESS: Successfully holding ${MAX_CLIENTS} concurrent socket connections.`);
            console.log(`Keeping connections alive to test stability. Press Ctrl+C to stop.\n`);
        }
    });

    socket.on('disconnect', (reason) => {
        connectionCount--;
    });

    socket.on('connect_error', (err) => {
        console.error(`❌ Connection Error for ${userId}: ${err.message}`);
    });

    // 3. Keep the connection alive and simulate background activity
    setInterval(() => {
        if (socket.connected) {
            socket.emit('heartbeat', userId);
        }
    }, EMIT_INTERVAL_MS);
};

// --- SPINNER & PROGRESS ---
const interval = setInterval(() => {
    clientCount++;
    
    // Create a dummy MongoDB ObjectId-like string for the user ID
    const fakeUserId = '60d5ec49f1b2c8b1f8e4e' + clientCount.toString().padStart(3, '0');
    createClient(fakeUserId);

    if (clientCount >= MAX_CLIENTS) {
        clearInterval(interval);
    }
}, CLIENT_CREATION_INTERVAL_MS);

// --- MONITORING ---
setInterval(() => {
    if (connectionCount < MAX_CLIENTS) {
        process.stdout.write(`\r🔌 Connected Clients: ${connectionCount} / ${MAX_CLIENTS}...`);
    }
}, 500);
