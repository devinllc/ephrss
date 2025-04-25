const exprees = require("express");
const router = exprees.Router();
const { adminSignup, adminLogin, adminLogout, } = require("../controller/admin_auth_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getAllEmployees } = require("../controller/admin/get_all_employees_controller");
const { resetDeviceId } = require("../controller/admin/reset_device_id_controller");
const { verifyAttendance } = require("../controller/admin/attendence_controller");
const { approveOrRejectLeave, cancelLeave } = require("../controller/leave_controller");

router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.get("/logout", adminLogout);
router.get("/employees", isloginMiddleware, roleMiddleware(["admin", "hr"]), getAllEmployees);
router.patch("/:id/reset-device", isloginMiddleware, roleMiddleware(["admin", "hr"]), resetDeviceId);
router.patch('/attendance/:id/verify', isloginMiddleware, roleMiddleware(["admin", "hr"]), verifyAttendance);
router.post('/leave/approve-reject', isloginMiddleware, roleMiddleware(["admin", "hr"]), approveOrRejectLeave);
router.post('/leave/cancel', isloginMiddleware, roleMiddleware(["admin", "hr"]), cancelLeave);


module.exports = router;
