const exprees = require("express");
const router = exprees.Router();
const { createEmployees, employeeLogin, employeeLogout } = require("../controller/employess_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const planMiddleware = require("../middleware/planMiddleware");
const { getAllEmployees, getAllEmployeess } = require("../controller/admin/get_all_employees_controller");

router.post("/create", isloginMiddleware, roleMiddleware(["admin", "hr"]), planMiddleware(['basic', 'pro', 'enterprise']), createEmployees);
router.post("/login", employeeLogin);
router.get("/profile", isloginMiddleware, require("../controller/employess_controller").getProfile);
router.put("/profile", isloginMiddleware, require("../controller/employess_controller").updateProfile);
router.get("/logout", employeeLogout);
router.get("/alls", isloginMiddleware, roleMiddleware(["admin", "hr"]), getAllEmployees);
router.get("/all", isloginMiddleware, roleMiddleware(["admin", "hr"]), getAllEmployeess);

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.post("/upload-document", isloginMiddleware, upload.single("document"), require("../controller/employess_controller").uploadDocument);
router.patch("/onboarding{/:id}", isloginMiddleware, require("../controller/employess_controller").updateOnboardingStatus);

module.exports = router;