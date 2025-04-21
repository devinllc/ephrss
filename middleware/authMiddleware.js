const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const Employee = require("../models/employee.model");

module.exports = async function (req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  const deviceId = req.headers["x-device-id"]; // custom header for device ID

  if (!token) return res.status(401).json({ message: "Token missing." });
  if (!deviceId) return res.status(400).json({ message: "Device ID missing." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const Model = decoded.role === "admin" ? Admin : Employee;
    const user = await Model.findById(decoded.id).select("-password");
    
    if (!user) return res.status(401).json({ message: "User not found." });

    // ✅ Check for device lock (employee only)
    if (decoded.role === "employee") {
      if (user.isLocked) {
        return res.status(403).json({ message: "Account is locked. Contact admin." });
      }

      if (user.deviceId && user.deviceId !== deviceId) {
        return res.status(403).json({
          message: "Access denied from unregistered device. Contact admin to reset access.",
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
