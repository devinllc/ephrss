const express = require("express");
const router = express.Router();
const projectController = require("../controller/project_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All project routes require authentication
router.use(isloginMiddleware);

// Admin-only creation/deletion logic
router.post("/", roleMiddleware(["admin", "hr"]), projectController.createProject);
router.delete("/:id", roleMiddleware(["admin", "hr"]), projectController.deleteProject);

// All users can fetch assigned projects mapping
router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProjectById);

module.exports = router;
