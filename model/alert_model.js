const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  type: { 
    type: String, 
    enum: ["low_performance", "high_idle_time", "missed_tasks", "suspicious_field_activity", "geo_fence_breach"],
    required: true
  },
  severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  message: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  isAcknowledged: { type: Boolean, default: false },
  acknowledgedAt: { type: Date, default: null }
}, { timestamps: true });

alertSchema.index({ employeeId: 1, isAcknowledged: 1 });
alertSchema.index({ type: 1 });

module.exports = mongoose.model("Alert", alertSchema);
