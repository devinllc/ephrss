const exprees = require("express");
const router = exprees.Router();
const { createEmployees, employeeLogin, employeeLogout } = require("../controller/employess_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const planMiddleware = require("../middleware/planMiddleware");
const isLoginEmployeeMiddleware = require("../middleware/isLoginEmployeeMiddleware");
const { punchIn, punchOut, getAttendanceDetails } = require("../controller/employee/attendence_controller");
const { applyForLeave, viewLeaveRequests } = require("../controller/leave_controller");

router.post("/create", isloginMiddleware, roleMiddleware(["admin", "hr"]), planMiddleware(['basic', 'pro', 'enterprise']), createEmployees);
router.post("/login", employeeLogin);
router.get("/logout", employeeLogout);
router.post("/attendance/punch-in", isLoginEmployeeMiddleware, punchIn);
router.post("/attendance/punch-out", isLoginEmployeeMiddleware, punchOut);
router.get("/attendance/status", isLoginEmployeeMiddleware, getAttendanceDetails);
router.post('/leave/apply', isLoginEmployeeMiddleware, applyForLeave);
router.get('/leave/requests', isLoginEmployeeMiddleware, viewLeaveRequests);


module.exports = router;