const admin_model = require('../model/admin_model');
const employee_model = require('../model/employee_model');

const planMiddleware = (allowedPlans = []) => {
    return async (req, res, next) => {
        const user = req.user;
        if (!user || !user.plan) {
            return res.status(403).json({ message: "Subscription plan missing." });
        }

        if (!allowedPlans.includes(user.plan)) {
            return res.status(403).json({
                message: `This feature is only available for: ${allowedPlans.join(", ")} plan(s).`,
            });
        }

        const PLAN_LIMITS = {
            basic: 15,
            pro: 25,
            enterprise: Infinity,
        };

        try {
            const employeeCount = await employee_model.countDocuments({ createdBy: user._id });

            if (employeeCount >= PLAN_LIMITS[user.plan]) {
                return res.status(403).json({
                    message: `You have reached employees creation limit for the ${user.plan} plan i.e ${employeeCount}. Please Upgrade`,
                });
            }

            next();
        } catch (err) {
            console.error("Plan check failed:", err);
            res.status(500).json({ message: "Internal server error during plan check." });
        }
    };
};

module.exports = planMiddleware;
