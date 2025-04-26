const Payroll = require("../../model/payrole_model");

module.exports.getEmployeePayrolls = async (req, res) => {
    try {
        const employeeId = req.user._id; // employee logged in
        const payrolls = await Payroll.find({ employee: employeeId, status: "approved" }).sort({ year: -1, month: -1 });

        res.status(200).json({ payrolls });

    } catch (error) {
        console.error("Fetch employee payrolls error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
