const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const punchSchema = new mongoose.Schema({
  time: Date,
  location: locationSchema,
  photoUrl: String
}, { _id: false });

const subscriptionFeaturesSchema = new mongoose.Schema({
  locationTracking: Boolean,
  photoRequired: Boolean
}, { _id: false });

const STATUS_TYPES = Object.freeze({
  PRESENT: "present",
  HALF_DAY: "half-day",
  ABSENT: "absent",
  LEAVE: "leave",
  WEEKEND: "weekend",
  HOLIDAY: "holiday",
});

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  punchIn: punchSchema,
  punchOut: punchSchema,
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(STATUS_TYPES),
    default: STATUS_TYPES.ABSENT
  },
  verified: {
    type: Boolean,
    default: false
  },
  subscriptionFeatures: subscriptionFeaturesSchema
}, {
  timestamps: true
});

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });

attendanceSchema.pre("save", function (next) {
  this.date = new Date(this.date.setHours(0, 0, 0, 0)); // normalize date
  next();
});

module.exports = mongoose.model("Attendance", attendanceSchema);
