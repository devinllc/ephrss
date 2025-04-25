const exprees = require("express");
const router = exprees.Router();
const { createEmployees, employeeLogin,employeeLogout} = require("../controller/employess_controller");

router.post("/create",createEmployees);
router.post("/login", employeeLogin);
router.get("/logout", employeeLogout);

module.exports = router;