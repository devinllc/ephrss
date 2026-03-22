const Project = require("../model/project_model");

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { title, description, isVisibleToAll } = req.body;
    
    // Ensure admin user ID exists
    const adminId = req.user._id;

    const newProject = await Project.create({
      title,
      description,
      isVisibleToAll: isVisibleToAll !== undefined ? isVisibleToAll : true,
      adminId
    });

    res.status(201).json({ message: "Project created successfully", project: newProject });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all projects for an Admin
exports.getProjects = async (req, res) => {
  try {
    const adminId = req.user._id;
    // Assuming employees might fetch this based on assignedTo logic via tasks, 
    // but for now retrieve by createdAdmin.
    const projects = await Project.find({ adminId }).populate('tasks');

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOneAndDelete({ _id: id, adminId: req.user._id });

    if (!project) return res.status(404).json({ error: "Project not found" });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// Get a single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate('tasks');

    if (!project) return res.status(404).json({ error: "Project not found" });

    res.status(200).json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
