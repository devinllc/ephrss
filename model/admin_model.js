const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  plan: {
    type: String,
    enum: ["basic", "pro", "enterprise"],
    default: "basic"
  },
  role:{type:String,
    default:"admin"
  },
  gstin: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    required: true
  },
  totalEmployees: {
    type: Number,
    default: 0
  },
  picture: {
    type: String, // Prefer storing image URLs (e.g., from S3 or Cloudinary)
    default: ""
  },
  contactNumber: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  location: {
    latitude: Number,
    longitude: Number,
    radiusInMeters: {
      type: Number,
      default: 300, 
    },
  },
  subscription: {
    status: {
      type: String,
      enum: ["active", "inactive", "cancelled", "trial"],
      default: "trial"
    },
    expiresAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Admin", adminSchema);
