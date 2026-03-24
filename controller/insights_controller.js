const Attendance = require("../model/attendence_model");
const Performance = require("../model/performance_model");
const Employee = require("../model/employee_model");
const dayjs = require("dayjs");

exports.getEmployeeInsights = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        // 1. Burnout Risk Calculation (Last 30 days)
        const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
        const attendanceRecords = await Attendance.find({
            employee: id,
            date: { $gte: thirtyDaysAgo }
        });

        const totalWorked = attendanceRecords.filter(r => r.status === 'present').length;
        const totalLate = attendanceRecords.filter(r => r.isLate).length;
        
        let burnoutRisk = "Low";
        let burnoutReason = "Healthy work-life balance detected.";

        if (totalWorked > 24) {
            burnoutRisk = "High";
            burnoutReason = "Employee has worked over 24 days in the last month. Risk of exhaustion.";
        } else if (totalLate > 5) {
            burnoutRisk = "Medium";
            burnoutReason = "Frequent late arrivals may indicate disengagement or commute stress.";
        }

        // 2. Performance Trends (Last 3 reviews)
        const reviews = await Performance.find({ employee: id })
            .sort({ createdAt: -1 })
            .limit(3);

        let performanceTrend = "Stable";
        let recommendation = "Maintain current momentum.";

        if (reviews.length >= 2) {
            const latest = reviews[0].rating;
            const previous = reviews[1].rating;

            if (latest > previous) {
                performanceTrend = "Upward";
                recommendation = "High potential detected. Consider for leadership roles.";
            } else if (latest < previous) {
                performanceTrend = "Downward";
                recommendation = "Performance dip detected. Schedule 1-on-1 feedback.";
            }
        }

        res.status(200).json({
            employee: employee.name,
            insights: {
                burnout: {
                    level: burnoutRisk,
                    reason: burnoutReason,
                    stats: { totalWorked, totalLate }
                },
                performance: {
                    trend: performanceTrend,
                    recommendation: recommendation,
                    latestRating: reviews.length > 0 ? reviews[0].rating : "N/A"
                }
            }
        });

    } catch (err) {
        console.error("Insights error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const AutoPerformance = require("../model/auto_performance_model");
const Task = require("../model/task_model");

exports.getUserAutoPerformance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { timeframe } = req.query; // e.g., 'weekly', 'monthly', 'yearly'
        
        // Determine start date based on timeframe
        let startDate = dayjs().subtract(7, 'day').toDate(); // default to weekly
        if (timeframe === 'monthly') startDate = dayjs().subtract(30, 'day').toDate();
        if (timeframe === 'yearly') startDate = dayjs().subtract(365, 'day').toDate();
        
        const performanceData = await AutoPerformance.find({
            employee: employeeId,
            date: { $gte: startDate }
        }).sort({ date: 1 });
        
        // Calculate aggregations
        const aggregated = {
            totalScore: 0,
            tasksCompleted: 0,
            tasksDelayed: 0,
            averageScore: 0,
            daysTracked: performanceData.length
        };
        
        performanceData.forEach(p => {
            aggregated.totalScore += p.score || 0;
            aggregated.tasksCompleted += p.tasksCompleted || 0;
            aggregated.tasksDelayed += p.tasksDelayed || 0;
        });
        
        if (aggregated.daysTracked > 0) {
            aggregated.averageScore = aggregated.totalScore / aggregated.daysTracked;
        }

        res.status(200).json({
            employeeId,
            timeframe: timeframe || 'weekly',
            aggregated,
            records: performanceData
        });
        
    } catch (err) {
        console.error("getUserAutoPerformance error:", err);
        res.status(500).json({ error: "Internal server error fetching auto performance" });
    }
};

exports.getTaskAnalytics = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId).populate("assignedTo", "name email");
        
        if (!task) return res.status(404).json({ error: "Task not found" });
        
        const now = dayjs();
        const deadline = dayjs(task.deadline);
        const createdAt = dayjs(task.createdAt);
        const totalDurationDays = deadline.diff(createdAt, 'day');
        const daysRemaining = deadline.diff(now, 'day');
        
        const analytics = {
            taskId: task._id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            progressPercent: task.progress,
            timelines: {
                totalDurationDays,
                daysRemaining,
                isOverdue: now.isAfter(deadline) && task.status !== "completed"
            },
            teamSize: task.assignedTo.length,
            engagement: {
                commentsCount: task.comments ? task.comments.length : 0,
                filesAttached: task.files ? task.files.length : 0
            }
        };
        
        res.status(200).json({ analytics });
        
    } catch (err) {
        console.error("getTaskAnalytics error:", err);
        res.status(500).json({ error: "Internal server error fetching task analytics" });
    }
};
