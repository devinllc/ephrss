const Employee = require('../../model/employee_model');

module.exports.getAllEmployees = async (req, res) => {
    const admin = req.user;

    try {
        const { department, role, limit = 20, page = 1 } = req.query;

        // Build filter object
        const filter = {};
        if (department) filter.department = department;
        if (role) filter.role = role;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const employees = await Employee.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'fullName email') // optional: see who created each employee
            .lean();

        const total = await Employee.countDocuments(filter);

        res.status(200).json({
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            data: employees,
        });
    } catch (err) {
        console.error("Error fetching employees:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
