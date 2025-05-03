/**
 * Role-based access control middleware
 * @param {Array} allowedRoles - Roles allowed to access the route (e.g., ['admin', 'hr'])
 */
module.exports = function roleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    try {
      const user = req.user;

      // Ensure user is authenticated
      if (!user) {
        return res.status(401).json({ message: "Unauthorized: user not authenticated" });
      }

      // Ensure user has a role and it matches allowedRoles
      if (!user.role || (!allowedRoles.includes(user.role) && user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied: insufficient role." });
      }

      next();
    } catch (err) {
      console.error("Role middleware error:", err);
      return res.status(500).json({ message: "Internal server error in role middleware." });
    }
  };
};
