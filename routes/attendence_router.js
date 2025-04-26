const exprees = require("express");
const router = exprees.Router();
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const isLoginEmployeeMiddleware = require("../middleware/isLoginEmployeeMiddleware");
const { verifyAttendance } = require("../controller/admin/attendence_controller");
const { punchIn, punchOut, getAttendanceDetails } = require("../controller/employee/attendence_controller");


router.post("/punch-in", isLoginEmployeeMiddleware, punchIn);
router.post("/punch-out", isLoginEmployeeMiddleware, punchOut);
router.get("/status", isLoginEmployeeMiddleware, getAttendanceDetails);
router.patch('/:id/verify', isloginMiddleware, roleMiddleware(["admin", "hr"]), verifyAttendance);


module.exports = router;