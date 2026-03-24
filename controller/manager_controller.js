const Employee = require("../model/employee_model");
const AutoPerformance = require("../model/auto_performance_model");
const Alert = require("../model/alert_model");
const Task = require("../model/task_model");
const dayjs = require("dayjs");

exports.getTeamPerformance = async (req, res) => {
  try {
    const managerId = req.user._id;
    const teamMembers = await Employee.find({ managerId }).select("_id name email designation");
    const memberIds = teamMembers.map(m => m._id);

    const matchDate = dayjs().startOf('day').toDate();
    const teamPerformances = await AutoPerformance.find({
      employee: { $in: memberIds },
      date: matchDate
    });

    const response = teamMembers.map(member => {
      const perf = teamPerformances.find(p => p.employee.toString() === member._id.toString());
      return {
        _id: member._id,
        name: member.name,
        designation: member.designation,
        performanceScore: perf ? perf.score : "N/A"
      };
    });

    res.json(response);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getTeamAlerts = async (req, res) => {
  try {
    const managerId = req.user._id;
    const teamMembers = await Employee.find({ managerId }).select("_id");
    const memberIds = teamMembers.map(m => m._id);

    const alerts = await Alert.find({ employeeId: { $in: memberIds }, isAcknowledged: false })
      .populate("employeeId", "name email");
      
    res.json(alerts);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.assignTask = async (req, res) => {
  try {
    const managerId = req.user._id;
    // Check if the user assigned is actually under this manager
    const { title, description, assignedTo, deadline, priority } = req.body;
    
    // Optionally: verify assignedTo array members have managerId === req.user._id

    const task = new Task({
      title,
      description,
      assignedTo,
      deadline,
      priority,
      createdBy: managerId,
      creatorModel: "Employee" // Since it's a manager
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
};
