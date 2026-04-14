const admin = require('firebase-admin');
require('dotenv').config();

try {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    })
  });
  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.warn("Firebase Admin failed to initialize (Ensure your keys are valid):", error.message);
}

module.exports = admin;
