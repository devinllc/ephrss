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

module.exports = router;
