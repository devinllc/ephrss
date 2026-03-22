const admin_model = require("../model/admin_model");
const bcrypt = require('bcrypt');
const { generateToken } = require("../utils/generate_token");

module.exports.adminSignup = async (req, res) => {
    console.log(process.env.NODE_ENV);

    // Restrict signup in non-development environments
    if (process.env.NODE_ENV !== "development") {
        return res.status(403).send("Signup is Restricted in this environment.");
    }

    try {
        const admin = await admin_model.find();
        if (admin.length > 6) {
            return res.status(401).send("Don't have permission, policy violates.");
        }

        const { fullName, companyName, email, password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const createAdmin = await admin_model.create({
            fullName,
            email,
            companyName,
            password: hash,
        });

        const token = generateToken(createAdmin);

        res.cookie("token", token);
        res.status(201).json({
            message: "User created successfully",
            token: token,
        });
        console.log("Admin created successfully");
    } catch (err) {
        console.error("Error during signup:", err);
        res.status(500).send("Internal server error.");
    }
};
module.exports.adminLogin = async (req, res) => {
    let { email, password } = req.body;
    let admin = await admin_model.findOne({ email: email });
    if (!admin) return res.status(400).send("SOMETHING IS INCORRECT");
    bcrypt.compare(password, admin.password, (err, result) => {
        if (result) {
            let token = generateToken(admin);
            res.cookie('token', token);
            res.status(200).json({
                message: "admin login successfully",
                token
            });
        }
        else {
            return res.status(400).send("SOMETHING IS INCORRECT");
        }
    });
};

module.exports.adminLogout = async (req, res) => {
    res.cookie("token", "");
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    });
    res.status(200).json({ message: "Logout successful" });
}

module.exports.updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, radiusInMeters } = req.body;
        
        const updatedAdmin = await admin_model.findByIdAndUpdate(
            req.user._id, 
            { location: { latitude, longitude, radiusInMeters } },
            { new: true }
        );
        
        if (!updatedAdmin) {
            return res.status(404).json({ error: "Admin not found." });
        }
        res.status(200).json({ message: "Location configuration updated successfully.", location: updatedAdmin.location });
    } catch (err) {
        console.error("Error updating location:", err);
        res.status(500).json({ error: "Internal server error." });
    }
};

module.exports.getLocation = async (req, res) => {
    try {
        const adminId = req.user.role === 'admin' ? req.user._id : req.user.adminId;
        const targetAdmin = await admin_model.findById(adminId);
        
        if (!targetAdmin) {
            return res.status(404).json({ error: "Admin configuration not found." });
        }
        res.status(200).json({ location: targetAdmin.location });
    } catch (err) {
        console.error("Error fetching location:", err);
        res.status(500).json({ error: "Internal server error." });
    }
};