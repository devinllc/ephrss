const admin_model = require("../model/admin_model");
const bcrypt = require('bcrypt');
const { generateToken } = require("../utils/generate_token");

module.exports.adminSignup = async (req, res) => {
    console.log(process.env.NODE_ENV);

    // Ensure the signup is allowed only in development environment
    if (process.env.NODE_ENV !== "development") {
        return res.status(403).send("Signup is only allowed in development environment.");
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
            token
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
    if (!admin) return res.status(200).send("SOMETHING IS INCORRECT");
    bcrypt.compare(password, admin.password, (err, result) => {
        if (result) {
            let token = generateToken(admin);
            res.cookie('token', token);
            res.status(201).json({
                message: "admin login successfully",
                token
            });
        }
        else {
            return res.status(200).send("SOMETHING IS INCORRECT");
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