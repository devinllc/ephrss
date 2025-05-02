// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const admin_model = require("../model/admin_model");

const extractToken = (req) => {
    if (req.headers.authorization?.startsWith("Bearer ")) {
        return req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
        return req.cookies.token;
    } else if (req.query?.token) {
        return req.query.token;
    }
    return null;
};

const verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        return decoded;
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};

module.exports = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ error: "Authentication token is required. You need to login first" });
    }

    try {
        const decoded = await verifyToken(token);

        const user = await admin_model.findOne({ email: decoded.email }).select("-password");

        if (!user) {
            return res.status(403).json({ error: "Access denied: Not Permitted" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("AuthMiddleware Error:", err.message);
        return res.status(401).json({ error: err.message || "Authentication failed" });
    }
};
