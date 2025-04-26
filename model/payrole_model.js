const mongoose = require("mongoose");

const allowanceSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., HRA, Travel, etc.
  amount: { type: Number, required: true }
}, { _id: false });

const deductionSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., PF, ESI, Professional Tax
  amount: { type: Number, required: true }
}, { _id: false });

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  totalWorkingDays: {
    type: Number,
    required: true
  },
  daysPresent: {
    type: Number,
    default: 0
  },
  daysLeaveApproved: {
    type: Number,
    default: 0
  },
  basicSalary: {
    type: Number,
    required: true
  },

  allowances: [allowanceSchema], // Custom allowances
  deductions: [deductionSchema], // Custom deductions (including PF, ESI, Tax)

  grossSalary: { type: Number, default: 0 },   // Basic + Allowances
  totalDeductions: { type: Number, default: 0 }, 
  netSalary: { type: Number, default: 0 },      // Gross - Deductions

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null
  },

  paymentDate: {
    type: Date,
    default: null
  }

}, { timestamps: true });

// To prevent duplicate payroll entries for same month/year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Payroll", payrollSchema);
