# 💬 ChatUp | Real-Time Messaging Platform

A full-stack, real-time chat application designed for low-latency message delivery, online presence tracking, and background job processing.

## 🚀 System Architecture & Flow

This application is architected to handle real-time WebSocket traffic alongside persistent database storage, utilizing background workers for deferred tasks to keep the event loop unblocked.

* **Real-Time Engine:** Built on Node.js and Socket.io, utilizing in-memory structures for active session and socket mapping. Handshakes are authenticated using JWTs, mapping users to distinct socket rooms.
* **Database & Persistence:** Utilizes MongoDB (via Mongoose) as the primary data store for chats, messages, and unread counts. Real-time message events are saved to the database to ensure strict data integrity before delivery confirmations are dispatched.
* **Background Job Queue (BullMQ + Redis):** Implements **BullMQ** backed by **Redis** (via `ioredis`) to manage scheduled message queues. When a message is scheduled for future delivery, it is queued as a delayed job in Redis. A background worker processes the job when its timer expires and broadcasts it to the chat.
* **Fault Tolerance:** The backend is configured to handle Redis offline status gracefully in local development environments. It attempts to connect to Redis up to 3 times on boot, and falls back to running the rest of the application (Express server & Socket.io) if Redis is unavailable.
* **Scale-Out Strategy:** Currently running as a single-node setup. To scale horizontally, the system is designed to migrate toward using the Socket.io Redis adapter (`@socket.io/redis-adapter`) to sync states across multiple node clusters.

## 💻 Tech Stack

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose)
* **Caching & Queue:** Redis / BullMQ
* **Real-time:** Socket.io

### Frontend
* **Framework:** React.js (Vite)
* **Styling:** CSS
* **HTTP Client:** Axios
* **Real-time:** Socket.io-client

## ⚙️ Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DineshS36/chatup.git
   cd chatup
   ```

2. **Setup the Backend (Root Directory):**
   * Install dependencies:
     ```bash
     npm install
     ```
   * Create a `.env` file at the root:
     ```env
     PORT=5000
     MONGODB_URI=mongodb+srv://<username>:<password>@yourcluster.mongodb.net/dbname
     JWT_SECRET=your_jwt_secret_key
     CLIENT_URL=http://localhost:5173
     # Provide a local Redis URL or a cloud Redis URL (e.g., Upstash with rediss:// for TLS)
     REDIS_URL=rediss://default:password@your-upstash-endpoint.upstash.io:6379
     ```
   * Start the development server (uses `nodemon`):
     ```bash
     npm run dev
     ```

3. **Setup the Frontend:**
   * Navigate to the frontend directory:
     ```bash
     cd chat-frontend
     ```
   * Install dependencies:
     ```bash
     npm install
     ```
   * Start the React development server:
     ```bash
     npm run dev
     ```
