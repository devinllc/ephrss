const mongoose = require("mongoose");
const dotenv = require("dotenv");
const debug = require("debug")("app:mongoose");

// Load .env
dotenv.config();
// Load config from .env or fallback
const mongoUri = `${process.env.MONGODB_URI || "mongodb://localhost:27017"}/${process.env.DB_NAME || "test"}`;

console.log("Connecting to:", mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // wait 5 seconds before throwing error
  socketTimeoutMS: 45000, // 45 seconds socket timeout

})
    .then(() => {
        debug("✅ MongoDB connected successfully.");
    })
    .catch((err) => {
        debug("❌ MongoDB connection error:", err);
    });

module.exports = mongoose.connection;
