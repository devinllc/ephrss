const express = require("express");
const router = express.Router();
const taskController = require("../controller/task_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// CRUD
router.post(
  "/",
  isloginMiddleware,
  roleMiddleware(["admin", "hr", "employee"]),
  taskController.createTask
);
router.get("/", taskController.getTasks); // supports filter/search
router.get("/user/:id", taskController.getTaskById); // get tasks by user ID
router.get("/:id", taskController.getTaskById);
router.put(
  "/:id",
  isloginMiddleware,
  roleMiddleware(["admin", "hr", "employee"]),
  taskController.updateTask
);
router.delete(
  "/:id",
  isloginMiddleware,
  roleMiddleware(["admin", "hr", "employee"]),
  taskController.deleteTask
);

// Assign task
router.post(
  "/:id/assign",
  isloginMiddleware,
  roleMiddleware(["admin", "hr", "employee"]),
  taskController.assignTask
);

// Comment on task
router.post(
  "/:id/comment",
  isloginMiddleware,
  roleMiddleware(["admin", "hr", "employee"]),
  taskController.addComment
);

// Get dashboard for user
router.get("/user/:userId/dashboard", taskController.getDashboard);

// 🔧 Core Task APIs (MANDATORY) Missing Routes
router.patch("/update-status", isloginMiddleware, taskController.updateStatus);
router.patch("/update-details", isloginMiddleware, taskController.updateDetails);
router.get("/my-tasks", isloginMiddleware, taskController.getMyTasks);
router.get("/admin/all", isloginMiddleware, roleMiddleware(["admin", "hr"]), taskController.getAllAdminTasks);

// ⚙️ Task Lifecycle APIs (IMPORTANT)
router.patch("/start", isloginMiddleware, taskController.startTask);
router.patch("/complete", isloginMiddleware, taskController.completeTask);
router.patch("/assign", isloginMiddleware, roleMiddleware(["admin", "hr", "employee"]), taskController.reassignTask);
router.patch("/set-priority", isloginMiddleware, taskController.setPriority);
router.patch("/set-deadline", isloginMiddleware, taskController.setDeadline);

// 📊 Task Analytics APIs (CRITICAL)
router.get("/analytics/me", isloginMiddleware, taskController.getAnalyticsMe);
router.get("/analytics/company", isloginMiddleware, roleMiddleware(["admin", "hr"]), taskController.getAnalyticsCompany);
router.get("/analytics/:employeeId", isloginMiddleware, roleMiddleware(["admin", "hr"]), taskController.getAnalyticsEmployee);
router.get("/metrics/overdue", isloginMiddleware, taskController.getOverdueTasks);
router.get("/metrics/completion-rate", isloginMiddleware, taskController.getCompletionRate);

module.exports = router;
