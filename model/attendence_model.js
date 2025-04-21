const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  punchIn: {
    time: Date,
    location: {
      lat: Number,
      lng: Number
    },
    photoUrl: String, // optional selfie
  },
  punchOut: {
    time: Date,
    location: {
      lat: Number,
      lng: Number
    },
    photoUrl: String, // optional selfie
  },
  totalHours: {
    type: Number, // in decimal (e.g. 7.5 hrs)
    default: 0
  },
  status: {
    type: String,
    enum: ["present", "half-day", "absent", "leave", "weekend", "holiday"],
    default: "absent"
  },
  verified: {
    type: Boolean,
    default: false // for HR to confirm if needed
  },
  subscriptionFeatures: {
    locationTracking: Boolean,
    photoRequired: Boolean
  }
}, {
  timestamps: true
});

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true }); // prevent duplicate entries per day

module.exports = mongoose.model("Attendance", attendanceSchema);
