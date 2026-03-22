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
