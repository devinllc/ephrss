const admin = require("firebase-admin");

try {
  // To avoid errors if the environment variable isn't set, we fall back to a safe try/catch
  // In production, FIREBASE_SERVICE_ACCOUNT must be configured as a JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin Initialized Successfully");
  } else {
    // If running without firebase credentials (local dev), we mock it to prevent crashes
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT zeroed out. Notifications will be logged, but not sent.");
  }
} catch (err) {
  console.error("❌ Firebase Admin Initialization Error:", err);
}

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log(`[MOCK PUSH] to ${fcmToken}: ${title} - ${body}`);
    return;
  }
  
  if (!fcmToken) return;

  const payload = {
    notification: { title, body },
    data,
    token: fcmToken
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log('Push notification sent successfully:', response);
  } catch (error) {
    console.log('Error sending push notification:', error);
  }
};

module.exports = { admin, sendPushNotification };
