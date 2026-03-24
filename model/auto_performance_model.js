const mongoose = require("mongoose");

const autoPerformanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  tasksDelayed: {
    type: Number,
    default: 0
  },
  tasksInProgress: {
    type: Number,
    default: 0
  },
  attendanceStatus: {
    type: String,
    enum: ["present", "half-day", "absent", "leave", "weekend", "holiday", "none"],
    default: "none"
  },
  totalHoursWorked: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, { timestamps: true });

autoPerformanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("AutoPerformance", autoPerformanceSchema);
