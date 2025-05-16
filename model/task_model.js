const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true }, // in bytes
  type: { type: String } // MIME type (e.g. application/pdf, image/png)
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 255
  },

  description: {
    type: String,
    default: ""
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null
  },

  deadline: {
    type: Date,
    required: true
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },

  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "cancelled"],
    default: "pending"
  },

  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  files: {
    type: [fileSchema],
    default: []
  },

  planConstraints: {
    maxFiles: { type: Number, default: 5 },           // limits based on plan
    maxStorage: { type: Number, default: 10 * 1024 * 1024 } // 10MB default limit
  },

  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    comment: String,
    commentedAt: { type: Date, default: Date.now }
  }],

  isVisibleToAssignee: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

// Prevent duplicate task per user with same title and deadline
taskSchema.index({ assignedTo: 1, title: 1, deadline: 1 }, { unique: false });

// Optimize for queries
taskSchema.index({ status: 1, assignedTo: 1 });
taskSchema.index({ deadline: 1 });

module.exports = mongoose.model("Task", taskSchema);
