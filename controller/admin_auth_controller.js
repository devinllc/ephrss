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
        // Check if an admin already exists
        const admin = await admin_model.find();
        if (admin.length > 1) {
            return res.status(401).send("Don't have permission, policy violates.");
        }

        // Destructure request body
        const { fullName, companyName, email, password } = req.body;

        // Hash password using bcrypt
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Create new admin
        const createAdmin = await admin_model.create({
            fullName,
            email,
            companyName,
            password: hash,
        });

        // Generate token
        const token = generateToken(createAdmin);

        // Send token in cookies
        res.cookie("token", token);
        res.status(201).send("User created successfully.");
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
            res.send("U Can Login")
        }
        else {
            return res.status(200).send("SOMETHING IS INCORRECT");
        }
    });
};

module.exports.adminLogout = async (req, res) => {
    res.cookie("token", "");
    res.send("logout succesful");
}