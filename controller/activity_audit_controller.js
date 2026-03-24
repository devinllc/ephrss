const ActivityLog = require("../model/activity_log_model");
const AuditLog = require("../model/audit_model");
const Employee = require("../model/employee_model");

// 8. REAL-TIME ACTIVITY SYSTEM
exports.getEmployeeLiveStatus = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ employeeId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getTeamActivity = async (req, res) => {
  try {
    // Finds logs from members mapped under the caller if they are a manager
    const teamMembers = await Employee.find({ $or: [{ managerId: req.user._id }, { adminId: req.user._id }] }).select("_id name");
    const mIds = teamMembers.map(m => m._id);
    
    const logs = await ActivityLog.find({ employeeId: { $in: mIds } })
      .populate("employeeId", "name email")
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.appendActivity = async (employeeId, actionType, description, req) => {
  try {
    const ipAddress = req ? req.ip || req.connection.remoteAddress : "system";
    const log = new ActivityLog({ employeeId, actionType, description, ipAddress });
    await log.save();
  } catch (e) {
    console.error("[ACTIVITY ENGINE ERROR]", e);
  }
};

// 9. AUDIT & COMPLIANCE LOGS
exports.getAuditLogs = async (req, res) => {
  try {
    // Paginating heavy compliance logs
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const audits = await AuditLog.find({})
      .populate("performedBy", "name fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments();
    res.json({ audits, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.appendAudit = async (userId, roleModel, action, targetResource, changes, req) => {
  try {
    const ipAddress = req ? req.ip || req.connection.remoteAddress : "system";
    const audit = new AuditLog({
      performedBy: userId,
      roleModel,
      action,
      targetResource,
      changes,
      ipAddress
    });
    await audit.save();
  } catch (e) {
    console.error("[AUDIT ENGINE ERROR]", e);
  }
};
