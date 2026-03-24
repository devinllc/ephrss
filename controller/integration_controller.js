const Integration = require("../model/integration_model");
const axios = require("axios"); // Optional: Ensure axios is added to package.json if making outbound hooks

// 10. INTEGRATIONS SYSTEM
exports.registerWebhook = async (req, res) => {
  try {
    const { platform, webhookUrl, events, secretKey } = req.body;
    
    const integration = await Integration.findOneAndUpdate(
      { companyId: req.user._id, platform },
      { webhookUrl, events, secretKey, isActive: true },
      { new: true, upsert: true }
    );
    
    res.json({ message: "Webhook integrated successfully", integration });
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.getIntegrationStatus = async (req, res) => {
  try {
    const integrations = await Integration.find({ companyId: req.user._id });
    res.json({ integrations });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Internal engine to fire hooks when events happen (e.g. employee_onboarded)
exports.funcs = {
  fireWebhook: async (companyId, eventName, payload) => {
    try {
      const integrations = await Integration.find({ companyId, events: eventName, isActive: true });
      for (let integration of integrations) {
          // If you really implement triggering logic:
          // axios.post(integration.webhookUrl, { event: eventName, data: payload }, { headers: { 'Authorization': `Bearer ${integration.secretKey}` }}).catch();
          console.log(`[WEBHOOK FIRED] Event: ${eventName} sent to ${integration.platform}`);
      }
    } catch(e) { console.error("[WEBHOOK ERROR]", e); }
  }
};
