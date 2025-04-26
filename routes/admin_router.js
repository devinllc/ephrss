const exprees = require("express");
const router = exprees.Router();
const { adminSignup, adminLogin, adminLogout, } = require("../controller/admin_auth_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { resetDeviceId } = require("../controller/admin/reset_device_id_controller");


router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.get("/logout", adminLogout);
router.patch("/:id/reset-device", isloginMiddleware, roleMiddleware(["admin", "hr"]), resetDeviceId);




module.exports = router;
