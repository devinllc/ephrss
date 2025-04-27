
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
