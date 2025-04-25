const emplyees_model = require("../model/employee_model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generate_token");

module.exports.createEmployees = async (req, res) => {
    const { name, phone, email, password, role, } = req.body;
    const adminID = req.user._id;
    try {
        const emailExist = await emplyees_model.findOne({ email });
        if (emailExist) {
            return res.status(409).json({
                error: "Email already exist"
            })
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const createEmployee = await emplyees_model.create({
            name,
            email,
            password: hash,
            phone,
            role,
            adminId: adminID,
            createdBy: adminID,
        });
        const token = generateToken(createEmployee);
        // res.cookie('token', token);
        res.status(201).json({
            message: "User created successful",
            token,
        });
        console.log("User created successfully");
    } catch (err) {
        res.status(401).json({
            error: err,
        });
        console.log(err);
    };
};


module.exports.employeeLogin = async (req, res) => {
    const { email, password, deviceId } = req.body;
    const employee = await emplyees_model.findOne({ email });
    if (!employee) { return res.status(402).json({ error: "Somethimg is incorrect", }); };
    // Device lock logic
    if (employee.deviceId && employee.deviceId !== deviceId) {
        return res.status(403).json({ message: "Access denied: device mismatch. Contact admin." });
    }

    // First time login: store device ID
    if (!employee.deviceId) {
        employee.deviceId = deviceId;
        await employee.save();
    }
    bcrypt.compare(password, employee.password, (err, result) => {
        if (result) {

            const token = generateToken(employee);
            res.cookie('token', token);
            res.status(201).json({
                message: "User login successfully",
                token
            });
        } else {
            return res.status(200).send("SOMETHING IS INCORRECT");
        };

    })

};
module.exports.employeeLogout = async (req, res) => {
    res.cookie("token", "");
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    });
    res.status(200).json({ message: "Logout successful" });
};