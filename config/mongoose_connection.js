const mongoose = require("mongoose");
const dotenv = require("dotenv");
const debug = require("debug")("app:mongoose");

// Load .env
dotenv.config();
// Load config from .env or fallback
const mongoUri = `${process.env.MONGODB_URI || "mongodb://localhost:27017"}/${process.env.DB_NAME || "test"}`;

console.log("Connecting to:", mongoUri);

// Global mongoose connection cache (for Vercel/serverless)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectMongo() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).then((mongoose) => {
      debug("✅ MongoDB connected successfully.");
      return mongoose;
    }).catch((err) => {
      debug("❌ MongoDB connection error:", err);
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Immediately start connecting (keep your auto-connect behavior)
connectMongo();

module.exports = mongoose.connection;
