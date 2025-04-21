const geolib = require("geolib");
const Admin = require("../models/admin");

const locationMiddleware = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const employee = req.user; // Assume decoded from auth middleware

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Location data is required." });
    }

    // Find admin based on employee's `createdBy` or similar
    const admin = await Admin.findById(employee.createdBy); // You must store which admin the user belongs to

    if (!admin || !admin.location?.latitude || !admin.location?.longitude) {
      return res.status(400).json({ error: "Allowed location not set by admin." });
    }

    const distance = geolib.getDistance(
      { latitude, longitude },
      {
        latitude: admin.location.latitude,
        longitude: admin.location.longitude,
      }
    );

    if (distance > admin.location.radiusInMeters) {
      return res.status(403).json({ error: "Outside allowed location." });
    }

    next();
  } catch (error) {
    console.error("Location middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = locationMiddleware;
