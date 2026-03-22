const express = require("express");
const router = express.Router();
const { saveLogin, getSavedLogin, clearSavedLogin } = require("../controller/device_login_controller");

// The flutter app sends deviceIds freely without auth context first to check if they have a saved token.
router.post("/", saveLogin);
router.get("/:deviceId", getSavedLogin);
router.delete("/:deviceId", clearSavedLogin);

module.exports = router;
