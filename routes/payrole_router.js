const exprees = require("express");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const isLoginEmployeeMiddleware = require("../middleware/isLoginEmployeeMiddleware");
const { generatePayroll, approvePayroll, getAllPayrolls } = require("../controller/admin/payrole_controller");
const { getEmployeePayrolls } = require("../controller/employee/payrole_controller");
const router = exprees.Router();



router.post('/generate', isloginMiddleware, roleMiddleware(["admin", "hr"]), generatePayroll);
router.patch('/approve', isloginMiddleware, roleMiddleware(["admin", "hr"]), approvePayroll);
router.get('/status', isLoginEmployeeMiddleware , getEmployeePayrolls);
router.get('/', isloginMiddleware, roleMiddleware(['admin','hr']), getAllPayrolls);


module.exports = router;