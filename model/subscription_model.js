const mongoose = require("mongoose");

const usageMetricsSchema = new mongoose.Schema({
  watchTime: { type: Number, default: 0 },       // in minutes
  downloads: { type: Number, default: 0 },
  logins: { type: Number, default: 0 },
  lastLogin: { type: Date }
}, { _id: false });

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // or "Employee", "Customer"
    required: true
  },

  planName: {
    type: String,
    required: true
  },

  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    default: null
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  billingCycle: {
    type: String,
    enum: ["daily", "weekly", "monthly", "quarterly", "annually"],
    default: "monthly"
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: ["active", "cancelled", "expired", "pending", "paused", "refunded"],
    default: "pending"
  },

  autoRenew: {
    type: Boolean,
    default: true
  },

  paymentMethod: {
    type: String,
    enum: ["credit_card", "paypal", "upi", "wallet", "cash", "bank_transfer"],
    default: "upi"
  },

  transactionId: {
    type: String,
    default: null
  },

  cancelledAt: {
    type: Date,
    default: null
  },

  refund: {
    status: {
      type: String,
      enum: ["requested", "processed", "rejected", null],
      default: null
    },
    refundedAt: {
      type: Date,
      default: null
    },
    amount: {
      type: Number,
      default: 0
    },
    reason: {
      type: String,
      default: null
    }
  },

  promoCode: {
    type: String,
    default: null
  },

  discountAmount: {
    type: Number,
    default: 0
  },

  usageMetrics: usageMetricsSchema,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null
  }

}, { timestamps: true });

// Unique index to avoid duplicate subscriptions for the same month/year
subscriptionSchema.index({ user: 1, startDate: 1, endDate: 1 }, { unique: true });

// Indexes for performance
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
