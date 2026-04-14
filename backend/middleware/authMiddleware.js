const admin = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    // If backend doesn't have real keys but gets a real token, let's decode it manually!
    if (process.env.FIREBASE_PROJECT_ID === "dummy-project-id" && token) {
      try {
        const payloadStr = Buffer.from(token.split('.')[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadStr);
        req.user = { uid: payload.user_id, email: payload.email, name: payload.name, picture: payload.picture };
        return next();
      } catch (parseErr) {
        console.error("Failed to parse dummy token:", parseErr);
      }
    }
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = verifyToken;
