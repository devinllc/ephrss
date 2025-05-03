
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
