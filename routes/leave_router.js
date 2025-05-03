const exprees = require("express");
const { applyForLeave, viewLeaveRequests, approveOrRejectLeave, cancelLeave, getAllLeaves } = require("../controller/leave_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const isLoginEmployeeMiddleware = require("../middleware/isLoginEmployeeMiddleware");
const router = exprees.Router();


router.post('/apply', isLoginEmployeeMiddleware, applyForLeave);
router.get('/requests', isLoginEmployeeMiddleware, viewLeaveRequests);
router.post('/approve-reject', isloginMiddleware, roleMiddleware(["admin", "hr"]), approveOrRejectLeave);
router.post('/cancel', isloginMiddleware, roleMiddleware(["admin", "hr"]), cancelLeave);
router.get('/', isloginMiddleware, roleMiddleware(['admin', 'hr']), getAllLeaves);


module.exports = router;