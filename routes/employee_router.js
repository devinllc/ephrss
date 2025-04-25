const exprees = require("express");
const router = exprees.Router();
const { createEmployees, employeeLogin, employeeLogout } = require("../controller/employess_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/create", isloginMiddleware, roleMiddleware(["admin", "hr"]), createEmployees);
router.post("/login", employeeLogin);
router.get("/logout", employeeLogout);

module.exports = router;