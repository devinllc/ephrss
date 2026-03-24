const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  actionType: { type: String, required: true }, // 'task_started', 'punched_in', 'document_uploaded'
  description: { type: String, required: true },
  ipAddress: { type: String },
  deviceInfo: { type: String }
}, { timestamps: true });
activityLogSchema.index({ employeeId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
