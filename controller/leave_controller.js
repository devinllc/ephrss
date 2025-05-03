const Leave = require('../model/leave_model');
const Employee = require('../model/employee_model');
const Admin = require('../model/admin_model');

// 1. Apply for Leave (Employee)
module.exports.applyForLeave = async (req, res) => {
  const employee = req.user; // Assuming employee is authenticated and available in `req.user`
  const { fromDate, toDate, reason, type } = req.body;

  try {
    // Check if the employee is applying for a valid leave duration
    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ message: "From date cannot be later than to date." });
    }

    // Create a new leave request
    const newLeave = new Leave({
      employee: employee._id,
      fromDate,
      toDate,
      reason,
      type,
      status: "pending", // Default status is pending
    });

    await newLeave.save();
    res.status(201).json({ message: "Leave application submitted successfully", leave: newLeave });
  } catch (err) {
    console.error("Error applying for leave:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 2. Admin: Approve/Reject Leave
module.exports.approveOrRejectLeave = async (req, res) => {
  const { leaveId, status } = req.body;  // Expecting leaveId and status (approved/rejected)
  const admin = req.user; // Assuming admin is authenticated and available in `req.user`

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  try {
    // Find the leave request by ID
    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    // Ensure the leave is still pending
    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Leave request has already been processed." });
    }

    // Update leave status and approvedBy field
    leave.status = status;
    leave.approvedBy = admin._id;  // Mark who approved or rejected
    await leave.save();

    res.status(200).json({ message: `Leave ${status} successfully`, leave });
  } catch (err) {
    console.error("Error processing leave:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 3. Admin: Cancel Leave Request
module.exports.cancelLeave = async (req, res) => {
  const { leaveId } = req.body;
  const admin = req.user; // Admin is required for this action

  try {
    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    // If leave is already cancelled or rejected, it cannot be cancelled again
    if (leave.status === "cancelled" || leave.status === "rejected") {
      return res.status(400).json({ message: "Leave request cannot be cancelled." });
    }

    leave.status = "cancelled";
    leave.approvedBy = admin._id;  // Update admin who cancelled the leave
    await leave.save();

    res.status(200).json({ message: "Leave request cancelled successfully", leave });
  } catch (err) {
    console.error("Error cancelling leave:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 4. View Leave Requests (Employee or Admin)
module.exports.viewLeaveRequests = async (req, res) => {
  const employee = req.user;

  try {
    // For employees, fetch only their own leave requests
    const leaveRequests = await Leave.find({ employee: employee._id }).populate('employee', 'fullName email');

    res.status(200).json({
      message: "Leave requests fetched successfully",
      leaveRequests
    });
  } catch (err) {
    console.error("Error fetching leave requests:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @desc    Get all leave records with optional filters
 * @route   GET /leaves/all
 * @access  Admin / HR / SuperAdmin
 */
exports.getAllLeaves = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      employeeId,
      fromDate,
      toDate,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (employeeId) query.employee = employeeId;

    if (fromDate || toDate) {
      query.$or = [
        { fromDate: { $gte: new Date(fromDate || "1970-01-01") } },
        { toDate: { $lte: new Date(toDate || "2100-01-01") } },
      ];
    }

    const leaves = await Leave.find(query)
      .populate("employee", "name email department")
      .populate("approvedBy", "name email role")
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Leave.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: leaves,
    });
  } catch (error) {
    console.error("Error fetching leave records:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
