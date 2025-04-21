        module.exports = (allowedPlans = []) => {
            return (req, res, next) => {
            const user = req.user;
            if (!user || !user.plan) {
                return res.status(403).json({ message: "Subscription plan missing." });
            }
        
            if (!allowedPlans.includes(user.plan)) {
                return res.status(403).json({
                message: `This feature is only available for: ${allowedPlans.join(", ")} plan(s).`,
                });
            }
        
            next();
            };
        };
        