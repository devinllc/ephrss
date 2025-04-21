const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: "employee",
    required: true
  },
  dob: Date,
  gender: {
    type: String,
    enum: ["male", "female", "other"]
  },
  department: String,
  employmentType: {
    type: String,
    enum: ["full-time", "part-time", "contract", "intern"]
  },
  address: String,
  emergencyContact: String,
  joiningDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    default: 0
  },
  bankDetails: {
    accountNumber: String,
    ifsc: String
  },
  picture: {
    type: String,
    default: "" 
  },
  status: {
    type: String,
    enum: ["active", "inactive", "terminated", "on-leave"],
    default: "active"
  },
  deviceId: {
    type: String, // First device identifier
    default: null
  },
  isLocked: {
    type: Boolean,
    default: false // Set to true to prevent further logins
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin", 
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Employee", employeeSchema);
