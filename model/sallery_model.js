const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  month: {
    type: Number, // 1 to 12
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  paidDays: Number,
  presentDays: Number,
  leaveDays: Number,
  absentDays: Number,
  overtimeHours: Number,
  deductions: {
    type: Number,
    default: 0
  },
  bonuses: {
    type: Number,
    default: 0
  },
  finalPay: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "generated", "paid"],
    default: "pending"
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: Date
});

salarySchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Salary", salarySchema);
