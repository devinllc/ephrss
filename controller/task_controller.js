const Task = require("../model/task_model");
// const User = require("../model/employee_model");
// const Admin = require("../model/admin_model");
require("../model/employee_model"); // ✅ this will register "User" schema
require("../model/admin_model");    // ✅ this will register "Admin" schema


// ✅ Create Task
exports.createTask = async (req, res) => {
  try {
    const taskData = { ...req.body };

    // Automatically set creator from session/token user if not provided
    if (!taskData.createdBy && req.user) {
      taskData.createdBy = req.user._id;
      // Determine model based on role (default to Admin if not sure)
      taskData.creatorModel = req.user.role === 'employee' ? 'Employee' : 'Admin';
    }

    const task = new Task(taskData);
    await task.save();

    // If task was created within a project, we might want to update the project's task list
    // though the Task model has a projectId ref, the Project model also has 'tasks' array.
    if (task.projectId) {
      await require("../model/project_model").findByIdAndUpdate(
        task.projectId,
        { $push: { tasks: task._id } }
      );
    }

    res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err);
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
    let targetId = req.params.id;

    // If targetId is an email, find the employee first
    if (targetId.includes("@")) {
      const employee = await require("../model/employee_model").findOne({ email: targetId });
      if (!employee) return res.status(404).json({ error: "Employee not found with this email" });
      targetId = employee._id;
    }

    const tasks = await Task.find({ assignedTo: targetId }).populate("assignedTo");
    res.json(tasks);
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
// -> NEW MISSING APIs As per Prompt

// 🔧 Core Task APIs (MANDATORY)
exports.updateStatus = async (req, res) => {
  try {
    const { taskId, status } = req.body;
    const task = await Task.findByIdAndUpdate(taskId, { status }, { new: true });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.updateDetails = async (req, res) => {
  try {
    const { taskId, details } = req.body;
    const task = await Task.findByIdAndUpdate(taskId, { ...details }, { new: true });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id }).populate("createdBy assignedTo");
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllAdminTasks = async (req, res) => {
  try {
    const tasks = await Task.find({}).populate("createdBy assignedTo projectId");
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ⚙️ Task Lifecycle APIs (IMPORTANT)
exports.startTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    const task = await Task.findByIdAndUpdate(taskId, { status: "in-progress", startedAt: new Date() }, { new: true });
    res.json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.completeTask = async (req, res) => {
  try {
    const { taskId, actualTime } = req.body;
    const completedAt = new Date();
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    // Auto-calculate time passed if actualTime not directly provided
    let calculatedTimeStr = actualTime;
    if (!calculatedTimeStr && task.startedAt) {
       calculatedTimeStr = (completedAt - new Date(task.startedAt)) / (1000 * 60 * 60); // hours
    }

    task.status = "completed";
    task.completedAt = completedAt;
    task.progress = 100;
    task.actualTime = calculatedTimeStr || 0;
    await task.save();
    
    res.json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.reassignTask = async (req, res) => {
  try {
    const { taskId, newAssignees } = req.body;
    const task = await Task.findByIdAndUpdate(taskId, { assignedTo: newAssignees }, { new: true });
    res.json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.setPriority = async (req, res) => {
  try {
    const { taskId, priority } = req.body;
    const task = await Task.findByIdAndUpdate(taskId, { priority }, { new: true });
    res.json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.setDeadline = async (req, res) => {
  try {
    const { taskId, deadline } = req.body;
    const task = await Task.findByIdAndUpdate(taskId, { deadline: new Date(deadline) }, { new: true });
    res.json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

// 🧠 Internal Functions
const calculateTaskDelay = (task) => {
  if (!task.deadline) return 0;
  let end = task.completedAt ? task.completedAt : new Date();
  let diff = new Date(end) - new Date(task.deadline);
  return diff > 0 ? (diff / (1000 * 60 * 60 * 24)).toFixed(1) : 0; // days
};

const calculateTaskEfficiency = (task) => {
  if (task.status !== "completed" || !task.startedAt) return 0;
  const deadlineMs = new Date(task.deadline) - new Date(task.createdAt);
  const actualMs = new Date(task.completedAt) - new Date(task.startedAt);
  if (deadlineMs <= 0) return 100; // instant deadline? 100%
  let eff = (deadlineMs / actualMs) * 100;
  return Math.min(Math.max(eff, 0), 100).toFixed(2);
};

const getTasksByDateRange = async (employeeId, start, end) => {
  return await Task.find({
    assignedTo: employeeId,
    updatedAt: { $gte: start, $lte: end }
  });
};

exports.funcs = { calculateTaskDelay, calculateTaskEfficiency, getTasksByDateRange };

// 📊 Analytics APIs
const _buildAnalytics = (tasks) => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const overdue = tasks.filter(t => t.status !== "completed" && new Date(t.deadline) < new Date()).length;
    let totalEff = 0, compTasks = 0;
    
    tasks.forEach(t => { 
        if(t.status === "completed") {
            totalEff += parseFloat(calculateTaskEfficiency(t));
            compTasks++;
        }
    });

    return {
        total, completed, overdue,
        completionRate: total ? ((completed/total)*100).toFixed(1) + "%" : "0%",
        avgEfficiency: compTasks ? (totalEff/compTasks).toFixed(1) + "%" : "0%"
    };
};

exports.getAnalyticsMe = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id });
    res.json(_buildAnalytics(tasks));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAnalyticsEmployee = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.employeeId });
    res.json(_buildAnalytics(tasks));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAnalyticsCompany = async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.json(_buildAnalytics(tasks));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOverdueTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ status: { $ne: "completed" }, deadline: { $lt: new Date() } }).populate("assignedTo");
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getCompletionRate = async (req, res) => {
  try {
    const total = await Task.countDocuments();
    const completed = await Task.countDocuments({ status: "completed" });
    const rate = total > 0 ? ((completed / total) * 100).toFixed(2) : 0;
    res.json({ completionRate: rate + "%" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

