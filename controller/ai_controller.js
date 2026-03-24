const AutoPerformance = require("../model/auto_performance_model");
const Task = require("../model/task_model");
const Employee = require("../model/employee_model");
const dayjs = require("dayjs");

// 11. AI INSIGHTS LAYER
// Normally you would import OpenAI or Anthropic SDK here.
// const { Configuration, OpenAIApi } = require("openai");

exports.getDailyReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findById(employeeId).select("name designation");
    
    // Simulating collecting parameters
    const [tasks, performance] = await Promise.all([
      Task.find({ assignedTo: employeeId, status: "completed" }).limit(5),
      AutoPerformance.findOne({ employee: employeeId, date: dayjs().startOf('day') })
    ]);

    const promptTemplate = `
      Analyze the performance:
      Employee: ${employee.name}
      Tasks Completed: ${tasks.length}
      Performance Score Today: ${performance ? performance.score : 0}
      Generate a brief LLM feedback snippet evaluating their strengths today.
    `;

    // Mocking an LLM Response
    const aiInsight = "Based on the completion of top priority tasks, John maintained exceptional efficiency (100% on-time rate) today. The geo-records indicate solid field engagement. Continue focusing on timely closures.";
    
    res.json({ aiGenerated: true, insights: aiInsight });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getCompanyInsights = async (req, res) => {
  try {
    const promptTemplate = `
      Evaluate the organization's aggregated task completion versus delayed timelines over the past week.
      Identify any potential burnout patterns or macro-delays.
    `;

    // Mocking an LLM Response
    const macroInsight = "The engineering division is showing signs of moderate fatigue, visible via a 14% drop in task completion speeds. However, field operations remain highly optimized. Suggest balancing workload over the weekend.";

    res.json({ aiGenerated: true, companyInsights: macroInsight });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
