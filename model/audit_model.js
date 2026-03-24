const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  performedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'roleModel', required: true },
  roleModel: { type: String, enum: ['Admin', 'Employee'], required: true },
  action: { type: String, required: true }, // e.g. "payroll_approved", "subscription_modified", "employee_terminated"
  targetResource: { type: String }, // collection name or resource ID
  changes: { type: mongoose.Schema.Types.Mixed }, // before/after JSON snapshot
  ipAddress: { type: String },
}, { timestamps: true });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
