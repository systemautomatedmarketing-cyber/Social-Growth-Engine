const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendTestPush = onRequest(async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      res.status(400).send("Token mancante");
      return;
    }

    const message = {
      token,
      notification: {
        title: "Test Social Growth Engine",
        body: "Le notifiche funzionano correttamente 🎉",
      },
      webpush: {
        notification: {
          icon: "https://app.webstudioams.it/icons/icon-192.png",
        },
        fcmOptions: {
          link: "https://app.webstudioams.it/",
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info("Push inviata:", response);
    res.status(200).send(`OK: ${response}`);
  } catch (error) {
    logger.error("Errore invio push:", error);
    res.status(500).send(error.message || "Errore invio push");
  }
});