const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const pool = require('../config/db');

// Helper: auto-upsert user into DB so foreign keys never fail
async function ensureUserExists(uid, email) {
  await pool.query(
    `INSERT INTO users (firebase_uid, email) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE email = VALUES(email)`,
    [uid, email || '']
  );
  const [rows] = await pool.query(`SELECT id FROM users WHERE firebase_uid = ?`, [uid]);
  return rows[0]?.id;
}

// Create Dashboard
router.post('/', verifyToken, async (req, res) => {
  const { title, layout_data } = req.body;
  const { uid, email } = req.user;

  try {
    const ownerId = await ensureUserExists(uid, email);
    const [result] = await pool.query(
      `INSERT INTO dashboards (owner_id, name, layout_json, visuals_json) VALUES (?, ?, ?, ?)`,
      [ownerId, title || 'Untitled Dashboard', JSON.stringify(layout_data || []), JSON.stringify([])]
    );
    res.status(201).json({ id: result.insertId, message: "Dashboard created successfully" });
  } catch (error) {
    console.error("Error creating dashboard:", error);
    res.status(500).json({ error: error.message });
  }
});

// Read all Dashboards for a user
router.get('/', verifyToken, async (req, res) => {
  const { uid, email } = req.user;
  try {
    const ownerId = await ensureUserExists(uid, email);
    const [rows] = await pool.query(
      `SELECT id, name AS title, created_at, updated_at FROM dashboards WHERE owner_id = ? ORDER BY updated_at DESC`,
      [ownerId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching dashboards:", error);
    res.status(500).json({ error: error.message });
  }
});

// Read a single Dashboard
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { uid, email } = req.user;
  try {
    const ownerId = await ensureUserExists(uid, email);
    const [rows] = await pool.query(
      `SELECT * FROM dashboards WHERE id = ? AND owner_id = ?`,
      [id, ownerId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Dashboard not found" });
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update Dashboard
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, layout_data, visuals_data } = req.body;
  const { uid, email } = req.user;

  try {
    const ownerId = await ensureUserExists(uid, email);
    const [result] = await pool.query(
      `UPDATE dashboards SET name = ?, layout_json = ?, visuals_json = ? WHERE id = ? AND owner_id = ?`,
      [title, JSON.stringify(layout_data || []), JSON.stringify(visuals_data || []), id, ownerId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Dashboard not found or unauthorized" });
    res.status(200).json({ message: "Dashboard updated successfully" });
  } catch (error) {
    console.error("Error updating dashboard:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Dashboard
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { uid, email } = req.user;

  try {
    const ownerId = await ensureUserExists(uid, email);
    const [result] = await pool.query(
      `DELETE FROM dashboards WHERE id = ? AND owner_id = ?`,
      [id, ownerId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Dashboard not found or unauthorized" });
    res.status(200).json({ message: "Dashboard deleted successfully" });
  } catch (error) {
    console.error("Error deleting dashboard:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
