const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const pool = require('../config/db');

// Sync User endpoint
router.post('/sync', verifyToken, async (req, res) => {
  const { uid, email, picture, name } = req.user;
  
  try {
    // Check if user exists
    const [rows] = await pool.query('SELECT * FROM users WHERE firebase_uid = ?', [uid]);
    
    if (rows.length === 0) {
      // Create user
      const query = `
        INSERT INTO users (firebase_uid, email, display_name, photo_url) 
        VALUES (?, ?, ?, ?)
      `;
      await pool.query(query, [uid, email, name || '', picture || '']);
      return res.status(201).json({ message: "User synced successfully created" });
    } else {
      // Update existing user (optional)
      const query = `
        UPDATE users 
        SET email = ?, display_name = ?, photo_url = ?, last_login = CURRENT_TIMESTAMP 
        WHERE firebase_uid = ?
      `;
      await pool.query(query, [email, name || rows[0].display_name, picture || rows[0].photo_url, uid]);
      return res.status(200).json({ message: "User synced successfully updated" });
    }
  } catch (error) {
    console.error("Error syncing user:", error);
    // Ignore db error if tables don't exist yet for demo robustness
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(200).json({ message: "Skipping DB sync (tables not provisioned)" });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
