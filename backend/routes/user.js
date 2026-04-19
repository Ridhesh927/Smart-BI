const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const pool = require('../config/db');

// Update User Profile
router.put('/profile', verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { display_name, photo_url } = req.body;
  
  try {
    const query = `
      UPDATE users 
      SET display_name = ?, photo_url = ? 
      WHERE firebase_uid = ?
    `;
    const [result] = await pool.query(query, [display_name, photo_url, uid]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
