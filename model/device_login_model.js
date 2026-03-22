const mongoose = require("mongoose");

const deviceLoginSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true // Encrypted or plain? In flutter it's saved as raw strings. It's terrible for security but mirrors Flutter logic exactly. Better to just store token or device association securely. We will store it as requested.
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("DeviceLogin", deviceLoginSchema);
