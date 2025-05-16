const exprees = require("express");
const router = exprees.Router();
const { createEmployees, employeeLogin, employeeLogout } = require("../controller/employess_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const planMiddleware = require("../middleware/planMiddleware");
const { getAllEmployees, getAllEmployeess } = require("../controller/admin/get_all_employees_controller");

router.post("/create", isloginMiddleware, roleMiddleware(["admin", "hr"]), planMiddleware(['basic', 'pro', 'enterprise']), createEmployees);
router.post("/login", employeeLogin);
router.get("/logout", employeeLogout);
router.get("/alls", getAllEmployees);
router.get("/all", getAllEmployeess);




module.exports = router;