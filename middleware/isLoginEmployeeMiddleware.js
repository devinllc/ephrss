const jwt = require("jsonwebtoken");
const employee_model = require("../model/employee_model");

module.exports = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "You need to login first" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const user = await employee_model.findOne({ email: decoded.email }).select('-password');

        if (!user) {
            return res.status(404).json({ error: "U are not permitted to create employees" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("JWT verification failed:", err);
        return res.status(500).json({ error: "Something went wrong" });
    }
};
