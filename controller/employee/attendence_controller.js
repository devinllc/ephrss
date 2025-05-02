// controllers/attendanceController.js
const Attendance = require('../../model/attendence_model');

module.exports.punchIn = async (req, res) => {
    const employee = req.user;
    const { lat, lng, photoUrl, deviceId } = req.body;

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));  // Get today's date (00:00:00)

    if (employee.deviceId && employee.deviceId !== deviceId) {
        return res.status(403).json({ message: "Device mismatch. Please contact admin." });
    }

    // Store the device ID on the first login (if not present)
    if (!employee.deviceId) {
        employee.deviceId = deviceId;
        await employee.save();
    }

    try {
        const existing = await Attendance.findOne({ employee: employee._id, date: today });
        if (existing) {
            return res.status(200).json({ message: "Already punched in today." });
        }

        // Create a new attendance record for the employee
        const attendance = await Attendance.create({
            employee: employee._id,
            date: today,
            punchIn: {
                time: now,
                location: { lat, lng },
                photoUrl: photoUrl || null,
            },
            status: "present",
        });

        res.status(201).json({ message: "Punch in successful", attendance });
    } catch (err) {
        console.error("Punch in error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};



module.exports.punchOut = async (req, res) => {
    const employee = req.user;
    const { lat, lng, photoUrl } = req.body;

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0)); // Set the time to 00:00:00 for today

    try {
        // Find the attendance record for today
        const attendance = await Attendance.findOne({ employee: employee._id, date: today });

        if (!attendance) {
            return res.status(400).json({ message: "You haven't punched in today." });
        }

        // Check if punch-out is already done
        if (attendance.punchOut && attendance.punchOut.time) {
            return res.status(200).json({ message: "You have already punched out today." });
        }

        // Update the punch-out time and location
        attendance.punchOut = {
            time: now,
            location: { lat, lng },
            photoUrl: photoUrl || null,
        };

        // Calculate total hours worked (in decimal)
        const punchInTime = new Date(attendance.punchIn.time);
        const punchOutTime = new Date(now);
        const totalMilliseconds = punchOutTime - punchInTime;
        const totalHours = totalMilliseconds / 1000 / 60 / 60; // convert to hours (decimal)
        attendance.totalHours = totalHours;

        // Update status (if needed)
        attendance.status = "present"; // You can adjust this based on your business logic

        // Save the updated attendance
        await attendance.save();

        res.status(200).json({ message: "Punch out successful", attendance });
    } catch (err) {
        console.error("Punch out error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};



module.exports.getAttendanceDetails = async (req, res) => {
    const employee = req.user; // Assuming employee is authenticated via middleware
    
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0)); // Set the time to the beginning of today
  
    try {
      // Find today's attendance record for the logged-in employee
      const attendance = await Attendance.findOne({
        employee: employee._id,
        date: today
      }).populate('employee', 'fullName email'); // Populate employee details if needed
  
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found for today." });
      }
  
      // Send the attendance details including the approval status and total worked hours
      res.status(200).json({
        message: "Attendance details fetched successfully",
        attendance: {
          date: attendance.date,
          punchIn: attendance.punchIn,
          punchOut: attendance.punchOut,
          totalHours: attendance.totalHours,
          status: attendance.status,  // Approved or pending status
          verified: attendance.verified, // If attendance is verified by HR
          subscriptionFeatures: attendance.subscriptionFeatures
        }
      });
    } catch (err) {
      console.error("Error fetching attendance details:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };