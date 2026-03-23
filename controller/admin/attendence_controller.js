
const Attendance = require('../../model/attendence_model');

module.exports.verifyAttendance = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // optional update by HR/Admin

  try {
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }

    if (status) {
      attendance.status = status;
    }

    attendance.verified = true;

    await attendance.save();

    res.status(200).json({
      message: 'Attendance verified successfully',
      attendance,
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Admin/HR: mark attendance for a staff (present/absent) for a given day.
 * This endpoint upserts Attendance { employee, date } and sets { status, verified:true }.
 */
exports.markAttendance = async (req, res) => {
  try {
    const { staffId, date, isPresent, status } = req.body;

    if (!staffId) {
      return res.status(400).json({ message: "staffId is required" });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    // Normalize to start-of-day so unique index works reliably.
    attendanceDate.setHours(0, 0, 0, 0);

    const finalStatus = status ??
        (isPresent === true ? "present" : "absent");

    if (!["present", "half-day", "absent"].includes(finalStatus)) {
      return res.status(400).json({ message: "Invalid attendance status" });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { employee: staffId, date: attendanceDate },
      {
        $setOnInsert: { employee: staffId, date: attendanceDate },
        $set: { status: finalStatus, verified: true },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (err) {
    console.error("Mark attendance error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @desc    Get all attendance records
 * @route   GET /api/attendance
 * @access  Admin / HR / SuperAdmin
 */
exports.getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 20, employeeId, status, date } = req.query;

    const query = {};

    if (employeeId) query.employee = employeeId;

    if (status) query.status = status;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const total = await Attendance.countDocuments(query);

    const attendance = await Attendance.find(query)
      .populate("employee", "-password -__v") // Avoid exposing sensitive fields
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: attendance,
    });
  } catch (err) {
    console.error("Error fetching attendance:", err.message);
    res.status(500).json({ error: "Server Error: Unable to fetch attendance records" });
  }
};
