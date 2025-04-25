const mongoose = require("mongoose");

const locationPointSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const dailyLocationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
    index: true,
  },
  date: {
    type: String, // e.g. "2025-04-21"
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    index: true,
  },
  latestLocation: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    accuracy: {
      type: Number,
      min: 0,
    },
    speed: {
      type: Number,
      min: 0,
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
    isCharging: {
      type: Boolean,
      default: false,
    },
  },
  locationHistory: {
    type: [locationPointSchema],
    default: [],
  },
  isInsideAllowedZone: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

dailyLocationSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyLocation", dailyLocationSchema);
