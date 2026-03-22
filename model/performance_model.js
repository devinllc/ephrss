const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  evaluator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  reviewPeriod: {
    type: String, // e.g., "Q1 2025" or "March 2025"
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  feedback: {
    type: String,
    required: true
  },
  goalsAchieved: {
    type: [String],
    default: []
  },
  areasOfImprovement: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Performance", performanceSchema);
