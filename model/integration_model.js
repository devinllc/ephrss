const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  platform: { type: String, enum: ['slack', 'whatsapp', 'zapier', 'custom'], required: true },
  webhookUrl: { type: String, required: true },
  events: [{ type: String }], // e.g. ["task_completed", "employee_onboarded", "high_idle_alert"]
  isActive: { type: Boolean, default: true },
  secretKey: { type: String } // For verifying webhook payloads optionally
}, { timestamps: true });
integrationSchema.index({ companyId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model("Integration", integrationSchema);
