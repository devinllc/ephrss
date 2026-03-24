const Alert = require("../model/alert_model");
const Employee = require("../model/employee_model");
const { sendPushNotification } = require("../utils/firebase");

// 🚨 Alerts Retrieval
exports.getMyAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ employeeId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(alerts);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getCompanyAlerts = async (req, res) => {
  try {
    // If you explicitly wanted org hierarchies mapped, here we just return them all
    const alerts = await Alert.find({})
      .populate("employeeId", "name email designation")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(alerts);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.body.alertId,
      { isAcknowledged: true, acknowledgedAt: new Date() },
      { new: true }
    );
    res.json(alert);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

// ⚙️ Internal Alert Triggers -> Hooked to the analytics logic seamlessly
exports.funcs = {
  triggerAlert: async (employeeId, type, severity, message, meta) => {
    try {
      const alert = new Alert({
        employeeId,
        type,
        severity,
        message,
        metadata: meta || {}
      });
      await alert.save();
      
      const employee = await Employee.findById(employeeId);
      if (employee && employee.deviceId) { // or a fcmToken field if mapped to deviceId setup
         await sendPushNotification(employee.deviceId, "⚠️ System Alert", message);
      }
      return alert;
    } catch (err) {
      console.error("[ALERT ENGINE ERROR] Failed to create alert:", err.message);
    }
  }
};
