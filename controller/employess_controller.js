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
    if (!employee) { return res.status(401).json({ error: "Something is incorrect", }); };
    // Device lock logic
    if (employee.deviceId && employee.deviceId !== deviceId) {
        return res.status(403).json({ message: "Access denied: device mismatch. Contact admin." });
    }

    // First time login: store device ID
    if (!employee.deviceId) {
        employee.deviceId = deviceId;
        await employee.save();
    }
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

    const token = generateToken(employee);
    res.cookie('token', token);
    res.status(200).json({
        message: "User login successfully",
        token
    });
};

module.exports.getProfile = async (req, res) => {
    try {
        res.status(200).json({ employee: req.user });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.updateProfile = async (req, res) => {
    try {
        const updatedEmployee = await emplyees_model.findByIdAndUpdate(
            req.user._id,
            { $set: req.body },
            { new: true }
        );
        res.status(200).json({ message: "Profile updated successfully", employee: updatedEmployee });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
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

module.exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }
        
        const { docName } = req.body;
        const employeeId = req.user._id;

        // Mock URL for now (since we don't have S3)
        const fileUrl = `/uploads/${req.file.filename}`;

        const employee = await emplyees_model.findByIdAndUpdate(
            employeeId,
            { 
                $push: { 
                    documents: { 
                        docName: docName || req.file.originalname, 
                        url: fileUrl 
                    } 
                } 
            },
            { new: true }
        );

        res.status(201).json({ message: "Document uploaded successfully", document: employee.documents.slice(-1)[0] });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.updateOnboardingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["pending", "in-progress", "completed"].includes(status)) {
            return res.status(400).json({ error: "Invalid status." });
        }

        const employeeId = req.params.id || req.user._id;
        const employee = await emplyees_model.findByIdAndUpdate(
            employeeId,
            { onboardingStatus: status },
            { new: true }
        );

        res.status(200).json({ message: "Onboarding status updated", onboardingStatus: employee.onboardingStatus });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
};