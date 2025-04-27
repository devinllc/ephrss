const Attendance = require("../../model/attendence_model");
const Leave = require("../../model/leave_model");
const Payroll = require("../../model/payrole_model");

module.exports.generatePayroll = async (req, res) => {
    try {
        let {
            employeeId,
            month,
            year,
            totalWorkingDays,
            basicSalary,
            allowances = [],
            deductions = []
        } = req.body;

        // Validation: Make sure basicSalary and totalWorkingDays are numbers
        if (!basicSalary || isNaN(basicSalary)) {
            return res.status(400).json({ message: "Invalid or missing basicSalary" });
        }

        if (!totalWorkingDays || isNaN(totalWorkingDays)) {
            return res.status(400).json({ message: "Invalid or missing totalWorkingDays" });
        }

        // If allowances/deductions are empty strings, fix them
        if (typeof allowances === 'string') {
            allowances = [];
        }
        if (typeof deductions === 'string') {
            deductions = [];
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const attendances = await Attendance.find({
            employee: employeeId,
            date: { $gte: startDate, $lte: endDate },
            status: { $in: ["present", "half-day"] }
        });

        const leaves = await Leave.find({
            employee: employeeId,
            fromDate: { $lte: endDate },
            toDate: { $gte: startDate },
            status: "approved"
        });

        const daysPresent = attendances.length;
        const daysLeaveApproved = leaves.reduce((total, leave) => {
            const from = new Date(Math.max(new Date(leave.fromDate), startDate));
            const to = new Date(Math.min(new Date(leave.toDate), endDate));
            const days = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
            return total + days;
        }, 0);

        const paidDays = daysPresent + daysLeaveApproved;
        const perDaySalary = basicSalary / totalWorkingDays;
        const adjustedBasicSalary = perDaySalary * paidDays;

        const totalAllowances = allowances.reduce((sum, item) => sum + (item.amount || 0), 0);
        const totalDeductions = deductions.reduce((sum, item) => sum + (item.amount || 0), 0);

        const grossSalary = adjustedBasicSalary + totalAllowances;
        const netSalary = grossSalary - totalDeductions;

        const payroll = new Payroll({
            employee: employeeId,
            month,
            year,
            totalWorkingDays,
            daysPresent,
            daysLeaveApproved,
            basicSalary,
            allowances,
            deductions,
            grossSalary,
            totalDeductions,
            netSalary
        });

        await payroll.save();

        res.status(201).json({ message: "Payroll generated successfully", payroll });

    } catch (error) {
        console.error("Payroll generation error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


module.exports.approvePayroll = async (req, res) => {
    try {
        const { payrollId } = req.body;
        const adminId = req.user._id; // assuming admin user is authenticated

        const payroll = await Payroll.findById(payrollId);

        if (!payroll) {
            return res.status(404).json({ message: "Payroll not found" });
        }

        if (payroll.status === "approved") {
            return res.status(400).json({ message: "Payroll already approved" });
        }

        payroll.status = "approved";
        payroll.approvedBy = adminId;
        payroll.paymentDate = new Date();

        await payroll.save();

        res.status(200).json({ message: "Payroll approved successfully", payroll });
    } catch (error) {
        console.error("Payroll approval error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
