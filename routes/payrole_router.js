const exprees = require("express");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const isLoginEmployeeMiddleware = require("../middleware/isLoginEmployeeMiddleware");
const { generatePayroll, approvePayroll, getAllPayrolls, downloadPayslipPdf } = require("../controller/admin/payrole_controller");
const { getEmployeePayrolls } = require("../controller/employee/payrole_controller");
const router = exprees.Router();

router.post('/generate', isloginMiddleware, roleMiddleware(["admin", "hr"]), generatePayroll);
router.patch('/approve', isloginMiddleware, roleMiddleware(["admin", "hr"]), approvePayroll);
router.get('/status', isLoginEmployeeMiddleware , getEmployeePayrolls);
router.get('/all', isloginMiddleware, roleMiddleware(['admin','hr']), getAllPayrolls);
router.get('/:id/pdf', isloginMiddleware, downloadPayslipPdf);


module.exports = router;