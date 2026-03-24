const express = require("express");
const integrationsController = require("../controller/integration_controller");
const aiController = require("../controller/ai_controller");
const bpController = require("../controller/billing_privacy_controller");
const isloginMiddleware = require("../middleware/isloginMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Shared router object handling modular domains cleanly
const router = express.Router();

// 10. Integrations
router.post("/integrations/webhook", isloginMiddleware, roleMiddleware(["admin", "hr"]), integrationsController.registerWebhook);
router.get("/integrations/status", isloginMiddleware, roleMiddleware(["admin", "hr"]), integrationsController.getIntegrationStatus);

// 11. AI Layer
router.get("/ai/daily-report/:employeeId", isloginMiddleware, roleMiddleware(["admin", "hr", "employee"]), aiController.getDailyReport);
router.get("/ai/company-insights", isloginMiddleware, roleMiddleware(["admin", "hr"]), aiController.getCompanyInsights);

// 12. Billing & SaaS limits
router.get("/billing/usage", isloginMiddleware, roleMiddleware(["admin"]), bpController.getCompanyUsage);

// 13. Privacy Interactors
router.patch("/privacy/update", isloginMiddleware, roleMiddleware(["employee"]), bpController.updatePrivacyConfig);

module.exports = router;
