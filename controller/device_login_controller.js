const DeviceLogin = require("../model/device_login_model");

exports.saveLogin = async (req, res) => {
  try {
    const { deviceId, email, password } = req.body;
    await DeviceLogin.findOneAndUpdate(
      { deviceId },
      { email, password, lastLogin: Date.now() },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: "Login data saved to backend mirroring Firebase saved_logins." });
  } catch (error) {
    res.status(500).json({ error: "Failed to save login data" });
  }
};

exports.getSavedLogin = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const data = await DeviceLogin.findOne({ deviceId });
    if (!data) return res.status(404).json({ message: "No saved login found." });

    res.status(200).json({ savedLogin: data });
  } catch (error) {
    res.status(500).json({ error: "Failed to get saved login" });
  }
};

exports.clearSavedLogin = async (req, res) => {
  try {
    const { deviceId } = req.params;
    await DeviceLogin.findOneAndDelete({ deviceId });
    res.status(200).json({ message: "Saved login cleared." });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear saved login" });
  }
};
