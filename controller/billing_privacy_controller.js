const Employee = require("../model/employee_model");
const Admin = require("../model/admin_model");

// 12. BILLING & USAGE TRACKING (SaaS)
exports.getCompanyUsage = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Company not found" });

    const totalEmployees = await Employee.countDocuments({ adminId });
    const plan = admin.plan || "Free";
    let featureLimit = plan === "Free" ? 10 : (plan === "Pro" ? 25 : 9999);

    const isLimitExceeded = totalEmployees >= featureLimit;

    // Billing tracking response logic
    res.json({
      plan,
      totalEmployees,
      limit: featureLimit,
      isLimitExceeded,
      flags: {
         canGenerateAI: plan === "Enterprise" || plan === "Pro",
         canViewAdvancedAnalytics: plan === "Enterprise" || plan === "Pro",
         hasCustomWebhooks: plan === "Enterprise"
      }
    });

  } catch (err) { res.status(500).json({ error: err.message }); }
};

// 13. PRIVACY & CONTROL
exports.updatePrivacyConfig = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { workHoursTrackingOnly, offDutyMode, dataVisibility } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      {
        privacySettings: { workHoursTrackingOnly, offDutyMode, dataVisibility }
      },
      { new: true, runValidators: true }
    ).select("name email privacySettings");

    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // When offDutyMode is true, the Field Location interceptor should block incoming saves.
    res.json({ message: "Privacy settings updated securely.", employee });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
