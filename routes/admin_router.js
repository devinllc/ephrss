const exprees = require("express");
const router = exprees.Router();
const { adminSignup, adminLogin,adminLogout} = require("../controller/admin_auth_controller");

router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.get("/logout", adminLogout);

module.exports = router;
