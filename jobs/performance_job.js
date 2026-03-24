const agenda = require("../config/agenda");
const Employee = require("../model/employee_model");
const Attendance = require("../model/attendence_model");
const Task = require("../model/task_model");
const AutoPerformance = require("../model/auto_performance_model");
const dayjs = require("dayjs");

const generatePerformanceJob = async () => {
  console.log("⭐ Starting daily performance generation job...");
  
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();
    
    const employees = await Employee.find({ status: { $ne: "terminated" } });
    
    for (const employee of employees) {
      const attendance = await Attendance.findOne({
        employee: employee._id,
        date: { $gte: todayStart, $lte: todayEnd }
      });
      
      const attendanceStatus = attendance ? attendance.status : "none";
      const totalHoursWorked = attendance ? attendance.totalHours : 0;
      
      const tasksCompleted = await Task.countDocuments({
        assignedTo: employee._id,
        status: "completed",
        updatedAt: { $gte: todayStart, $lte: todayEnd }
      });
      
      const tasksDelayed = await Task.countDocuments({
        assignedTo: employee._id,
        status: { $ne: "completed" },
        deadline: { $lt: todayEnd }
      });
      
      const tasksInProgress = await Task.countDocuments({
        assignedTo: employee._id,
        status: "in-progress"
      });
      
      let score = 50; 
      
      if (attendanceStatus === "present") {
        score += 20;
        if (totalHoursWorked >= 8) score += 5;
      } else if (attendanceStatus === "leave" || attendanceStatus === "weekend" || attendanceStatus === "holiday") {
        score = 50;
      } else if (attendanceStatus === "half-day") {
        score += 10;
      } else {
        score -= 20;
      }
      
      score += (tasksCompleted * 10);
      score -= (tasksDelayed * 10);
      score += (tasksInProgress * 2); 
      
      score = Math.max(0, Math.min(100, score));
      
      await AutoPerformance.findOneAndUpdate(
        { employee: employee._id, date: todayStart },
        {
          tasksCompleted,
          tasksDelayed,
          tasksInProgress,
          attendanceStatus,
          totalHoursWorked,
          score,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    
    console.log(`✅ Successfully generated performance reports for ${employees.length} employees.`);
    
  } catch (err) {
    console.error("❌ Error in automatic performance job:", err);
    throw err;
  }
};

agenda.define("generate daily performance reports", async (job) => {
    await generatePerformanceJob();
});

// Avoid persisting intervals in serverless endpoints. Let Vercel crons hit the endpoint instead.
if (process.env.NODE_ENV !== 'production') {
  (async function() {
    await agenda.start();
    await agenda.every('55 23 * * *', 'generate daily performance reports');
    console.log("🕒 Scheduled 'generate daily performance reports' daily at 23:55 (Local Dev)");
  })();
}

module.exports = { agenda, generatePerformanceJob };
