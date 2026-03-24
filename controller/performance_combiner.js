// controller/performance_combiner.js
const TaskController = require("../controller/task_controller");
const FieldController = require("../controller/field_controller");
const Attendance = require("../model/attendence_model");
const AutoPerformance = require("../model/auto_performance_model");
const dayjs = require("dayjs");

exports.getPerformanceEmployee = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const date = dayjs().format('YYYY-MM-DD');
        const metrics = await exports.funcs.generateDailyPerformance(employeeId, date);
        res.json({ metrics });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getPerformanceCompany = async (req, res) => {
    try {
        res.json({ message: "Aggregated performance score of the company across task completion + active field time." });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getPerformanceTrends = async (req, res) => {
    try {
        const trends = await AutoPerformance.find({ employee: req.params.employeeId }).sort({ date: 1 }).limit(30);
        res.json({ trends });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 🔗 Internal Functions
exports.funcs = {
    mergeTaskAndFieldData: (taskData, fieldData) => {
        return {
            tasksCompleted: taskData.length,
            activeFieldTimeHrs: fieldData ? fieldData.activeTime / 60 : 0
        };
    },
    
    calculateFinalPerformanceScore: (mergedData, attendanceObj) => {
        let score = 50; 
        if (attendanceObj && attendanceObj.status === "present") score += 20;
        score += (mergedData.tasksCompleted * 10);
        score += (mergedData.activeFieldTimeHrs * 2);
        return Math.min(100, Math.max(0, score));
    },
    
    generateDailyPerformance: async (employeeId, dateStr) => {
        const taskControllerFuncs = TaskController.funcs || {};
        const fieldControllerFuncs = FieldController.funcs || {};
        
        let targetStart = dayjs(dateStr).startOf('day').toDate();
        let targetEnd = dayjs(dateStr).endOf('day').toDate();

        let tasks = [];
        if (taskControllerFuncs.getTasksByDateRange) {
            tasks = await taskControllerFuncs.getTasksByDateRange(employeeId, targetStart, targetEnd);
        }

        let fieldMetrics = null;
        if (fieldControllerFuncs.calculateDailyFieldMetrics) {
            fieldMetrics = await fieldControllerFuncs.calculateDailyFieldMetrics(employeeId, dateStr);
        }

        const attendance = await Attendance.findOne({ employee: employeeId, date: { $gte: targetStart, $lte: targetEnd } });
        
        const mergedData = exports.funcs.mergeTaskAndFieldData(tasks, fieldMetrics);
        const finalScore = exports.funcs.calculateFinalPerformanceScore(mergedData, attendance);
        
        return { score: finalScore, mergedData, status: attendance ? attendance.status : "missing" };
    }
};
