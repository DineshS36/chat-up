const mongoose = require('mongoose');
const dns = require('dns');

// On Windows, local router DNS may fail to resolve MongoDB Atlas _mongodb._tcp SRV records.
// Setting public DNS fallback (Google / Cloudflare) ensures reliable resolution.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if unable to set custom DNS servers
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;