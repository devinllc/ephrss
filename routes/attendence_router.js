const exprees = require("express");
const router = exprees.Router();
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const isLoginEmployeeMiddleware = require("../middleware/isLoginEmployeeMiddleware");
const { verifyAttendance, getAllAttendance, markAttendance } = require("../controller/admin/attendence_controller");
const { punchIn, punchOut, getAttendanceDetails } = require("../controller/employee/attendence_controller");
const planMiddleware = require("../middleware/planMiddleware");


router.post("/punch-in", isLoginEmployeeMiddleware, punchIn);
router.post("/punch-out", isLoginEmployeeMiddleware, punchOut);
router.get("/status", isLoginEmployeeMiddleware, getAttendanceDetails);
router.patch('/:id/verify', isloginMiddleware, roleMiddleware(["admin", "hr"]), verifyAttendance);
// Admin/HR: mark present/absent without needing the Attendance document id.
router.post('/admin/mark', isloginMiddleware, roleMiddleware(["admin", "hr"]), markAttendance);
router.get('/', isloginMiddleware, roleMiddleware(['admin',"hr"]), getAllAttendance)


module.exports = router;