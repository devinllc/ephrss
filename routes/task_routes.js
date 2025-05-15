const express = require("express");
const router = express.Router();
const taskController = require("../controller/task_controller");

// CRUD
router.post("/", taskController.createTask);
router.get("/", taskController.getTasks); // supports filter/search
router.get("/:id", taskController.getTaskById);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

// Assign task
router.post("/:id/assign", taskController.assignTask);

// Comment on task
router.post("/:id/comment", taskController.addComment);

// Get dashboard for user
router.get("/user/:userId/dashboard", taskController.getDashboard);

module.exports = router;
