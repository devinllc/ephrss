const AutoPerformance = require("../model/auto_performance_model");
const Task = require("../model/task_model");
const Employee = require("../model/employee_model");
const dayjs = require("dayjs");

// 6. ACTION ENGINE (AUTOMATION)
exports.getRecommendations = async (req, res) => {
  try {
    const today = new Date();
    // 1. Overloaded workers (Too many tasks in-progress or delayed)
    const heavyTasks = await Task.aggregate([
      { $match: { status: { $in: ["in-progress", "pending"] }, deadline: { $gte: today } } },
      { $unwind: "$assignedTo" },
      { $group: { _id: "$assignedTo", taskCount: { $sum: 1 } } },
      { $match: { taskCount: { $gte: 10 } } } // Threshold > 10 active tasks = overloaded
    ]);

    const recommendations = heavyTasks.map(emp => ({
      employeeId: emp._id,
      action: "reassign_tasks",
      reason: `Employee has ${emp.taskCount} active tasks. High risk of burnout. Suggest reassigning to available team members.`
    }));

    // 2. Underperformers (Score < 40 in last week)
    const underPerformers = await AutoPerformance.find({ 
      date: { $gte: dayjs().subtract(7, 'day').toDate() },
      score: { $lt: 40 }
    }).populate("employee", "name email");

    underPerformers.forEach(perf => {
       recommendations.push({
         employeeId: perf.employee._id,
         employeeName: perf.employee.name,
         action: "schedule_meeting",
         reason: `Performance score dropped to ${perf.score}. Immediate 1-on-1 needed.`
       });
    });

    res.json({ recommendations });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.reassignTask = async (req, res) => {
  try {
    const { taskId, newEmployeeId, justification } = req.body;
    const task = await Task.findByIdAndUpdate(taskId, { assignedTo: [newEmployeeId] }, { new: true });
    // Audit could be fired here
    res.json({ message: "Automated reassignment executed", task, justification });
  } catch (err) { res.status(400).json({ error: err.message }); }
};

// 7. ROOT CAUSE ANALYSIS ENGINE
exports.getRootCauseAnalysis = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const weekStart = dayjs().startOf('week').toDate();
    const lastWeekStart = dayjs().subtract(1, 'week').startOf('week').toDate();
    
    const [thisWeek, lastWeek] = await Promise.all([
      AutoPerformance.find({ employee: employeeId, date: { $gte: weekStart } }),
      AutoPerformance.find({ employee: employeeId, date: { $gte: lastWeekStart, $lt: weekStart } })
    ]);

    const avgThis = thisWeek.length ? thisWeek.reduce((a,b)=>a+b.score,0)/thisWeek.length : 0;
    const avgLast = lastWeek.length ? lastWeek.reduce((a,b)=>a+b.score,0)/lastWeek.length : 0;

    let rootCause = "Performance is stable and consistent.";

    if (avgThis < avgLast - 10) {
      // Find why -> Delayed tasks? Missed attendance?
      const delayIncrease = thisWeek.reduce((a,b)=>a+b.tasksDelayed,0) > lastWeek.reduce((a,b)=>a+b.tasksDelayed,0);
      const attendanceDrop = thisWeek.filter(t=>t.attendanceStatus === "absent").length > lastWeek.filter(t=>t.attendanceStatus === "absent").length;
      
      rootCause = `Performance dropped dynamically by ${(avgLast - avgThis).toFixed(1)} points. `;
      if (delayIncrease) rootCause += `This is largely attributed to a spike in missed task deadlines. `;
      if (attendanceDrop) rootCause += `There is also an increased absence frequency compared to last week.`;
    } else if (avgThis > avgLast + 10) {
      rootCause = `Performance increased by ${(avgThis - avgLast).toFixed(1)} points dynamically due to improved task completion metrics.`;
    }

    res.json({ metrics: { avgThis: avgThis.toFixed(1), avgLast: avgLast.toFixed(1) }, rootCause });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
