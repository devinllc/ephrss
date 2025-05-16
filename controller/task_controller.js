const Task = require("../model/task_model");
// const User = require("../model/employee_model");
// const Admin = require("../model/admin_model");
require("../model/employee_model"); // ✅ this will register "User" schema
require("../model/admin_model");    // ✅ this will register "Admin" schema


// ✅ Create Task
exports.createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get Tasks (with search & filter)
exports.getTasks = async (req, res) => {
  try {
    const { search, status, priority, dueBefore, dueAfter } = req.query;

    const query = {};
    if (search) query.$text = { $search: search };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (dueBefore || dueAfter) {
      query.deadline = {};
      if (dueBefore) query.deadline.$lte = new Date(dueBefore);
      if (dueAfter) query.deadline.$gte = new Date(dueAfter);
    }

    const tasks = await Task.find(query)
      .populate("assignedTo")
      .populate("createdBy");

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Single Task
exports.getTaskById = async (req, res) => {
  try {
      const task = await Task.find({ assignedTo: req.params.id }).populate("assignedTo");
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const result = await Task.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Assign Task to User
exports.assignTask = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    // [Optional]: Send notification logic here
    res.json({ message: "Task assigned", task });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Add Comment
exports.addComment = async (req, res) => {
  try {
    const { user, comment } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    task.comments.push({ user, comment });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get Dashboard for User
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.params.userId;
    const now = new Date();

    const [assignedTasks, createdTasks, overdueTasks] = await Promise.all([
      Task.find({ assignedTo: userId }).sort({ deadline: 1 }),
      Task.find({ createdBy: userId }).sort({ deadline: 1 }),
      Task.find({ assignedTo: userId, deadline: { $lt: now }, status: { $ne: "completed" } })
    ]);

    res.json({
      assignedTasks,
      createdTasks,
      overdueTasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};