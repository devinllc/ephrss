const Employee = require("../../model/employee_model");
module.exports.resetDeviceId = async (req, res) => {
    const { id } = req.params;

    try {
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        employee.deviceId = null;
        await employee.save();

        res.status(200).json({ message: "Device reset successful" });
    } catch (err) {
        console.error("Reset device error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
