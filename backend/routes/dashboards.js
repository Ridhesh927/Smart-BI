const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const pool = require('../config/db');
let collaboratorsTableExists = null;
let dashboardsDatasetIdColumnExists = null;

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

async function canAccessDashboard(dashboardId, userId) {
  const hasCollaborators = await hasCollaboratorsTable();
  const [rows] = hasCollaborators
    ? await pool.query(
        `SELECT d.owner_id,
                dc.role
         FROM dashboards d
         LEFT JOIN dashboard_collaborators dc
           ON dc.dashboard_id = d.id AND dc.user_id = ?
         WHERE d.id = ?
         LIMIT 1`,
        [userId, dashboardId]
      )
    : await pool.query(
        `SELECT d.owner_id, NULL AS role
         FROM dashboards d
         WHERE d.id = ?
         LIMIT 1`,
        [dashboardId]
      );
  if (!rows[0]) return null;
  const isOwner = rows[0].owner_id === userId;
  const role = isOwner ? 'owner' : rows[0].role;
  return { isOwner, role };
}

async function hasCollaboratorsTable() {
  if (collaboratorsTableExists !== null) return collaboratorsTableExists;
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'dashboard_collaborators'`
    );
    collaboratorsTableExists = Number(rows[0]?.count || 0) > 0;
  } catch {
    collaboratorsTableExists = false;
  }
  return collaboratorsTableExists;
}

async function hasDashboardsDatasetIdColumn() {
  if (dashboardsDatasetIdColumnExists !== null) return dashboardsDatasetIdColumnExists;
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'dashboards'
         AND COLUMN_NAME = 'dataset_id'`
    );
    dashboardsDatasetIdColumnExists = Number(rows[0]?.count || 0) > 0;
  } catch {
    dashboardsDatasetIdColumnExists = false;
  }
  return dashboardsDatasetIdColumnExists;
}

// Create Dashboard
router.post('/', verifyToken, async (req, res) => {
  const { title, layout_data, visuals_data, dataset_id = null } = req.body;
  const { uid, email } = req.user;

  try {
    const ownerId = await ensureUserExists(uid, email);
    const hasDatasetIdColumn = await hasDashboardsDatasetIdColumn();
    const [result] = hasDatasetIdColumn
      ? await pool.query(
          `INSERT INTO dashboards (owner_id, name, dataset_id, layout_json, visuals_json) VALUES (?, ?, ?, ?, ?)`,
          [ownerId, title || 'Untitled Dashboard', dataset_id, JSON.stringify(layout_data || []), JSON.stringify(visuals_data || [])]
        )
      : await pool.query(
          `INSERT INTO dashboards (owner_id, name, layout_json, visuals_json) VALUES (?, ?, ?, ?)`,
          [ownerId, title || 'Untitled Dashboard', JSON.stringify(layout_data || []), JSON.stringify(visuals_data || [])]
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
    const hasCollaborators = await hasCollaboratorsTable();
    const [rows] = hasCollaborators
      ? await pool.query(
          `SELECT DISTINCT d.id, d.name AS title, d.created_at, d.updated_at,
                  CASE WHEN d.owner_id = ? THEN 'owner' ELSE dc.role END AS access_role
           FROM dashboards d
           LEFT JOIN dashboard_collaborators dc
             ON dc.dashboard_id = d.id AND dc.user_id = ?
           WHERE d.owner_id = ? OR dc.user_id = ?
           ORDER BY d.updated_at DESC`,
          [ownerId, ownerId, ownerId, ownerId]
        )
      : await pool.query(
          `SELECT d.id, d.name AS title, d.created_at, d.updated_at, 'owner' AS access_role
           FROM dashboards d
           WHERE d.owner_id = ?
           ORDER BY d.updated_at DESC`,
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
    const access = await canAccessDashboard(id, ownerId);
    if (!access) return res.status(404).json({ error: "Dashboard not found" });

    const [rows] = await pool.query(`SELECT * FROM dashboards WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Dashboard not found" });
    res.status(200).json({ ...rows[0], access_role: access.role });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update Dashboard
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, layout_data, visuals_data, dataset_id = null } = req.body;
  const { uid, email } = req.user;

  try {
    const ownerId = await ensureUserExists(uid, email);
    const access = await canAccessDashboard(id, ownerId);
    if (!access || !['owner', 'editor'].includes(access.role)) {
      return res.status(403).json({ error: "You do not have edit access to this dashboard" });
    }

    const hasDatasetIdColumn = await hasDashboardsDatasetIdColumn();
    const [result] = hasDatasetIdColumn
      ? await pool.query(
          `UPDATE dashboards SET name = ?, dataset_id = ?, layout_json = ?, visuals_json = ? WHERE id = ?`,
          [title, dataset_id, JSON.stringify(layout_data || []), JSON.stringify(visuals_data || []), id]
        )
      : await pool.query(
          `UPDATE dashboards SET name = ?, layout_json = ?, visuals_json = ? WHERE id = ?`,
          [title, JSON.stringify(layout_data || []), JSON.stringify(visuals_data || []), id]
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
    const access = await canAccessDashboard(id, ownerId);
    if (!access || !access.isOwner) {
      return res.status(403).json({ error: "Only the owner can delete this dashboard" });
    }

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

// Add or update collaborator (owner only)
router.post('/:id/collaborators', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { collaboratorEmail, role } = req.body;
  const { uid, email } = req.user;

  if (!collaboratorEmail || !['viewer', 'editor'].includes(role)) {
    return res.status(400).json({ error: "collaboratorEmail and valid role are required" });
  }

  try {
    if (!(await hasCollaboratorsTable())) {
      return res.status(503).json({ error: "Collaboration feature not initialized. Run database migration first." });
    }

    const ownerId = await ensureUserExists(uid, email);
    const access = await canAccessDashboard(id, ownerId);
    if (!access || !access.isOwner) {
      return res.status(403).json({ error: "Only owner can manage collaborators" });
    }

    const [users] = await pool.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [collaboratorEmail]);
    if (!users[0]) return res.status(404).json({ error: "Collaborator not found in workspace users" });

    await pool.query(
      `INSERT INTO dashboard_collaborators (dashboard_id, user_id, role)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [id, users[0].id, role]
    );

    res.status(200).json({ message: "Collaborator updated successfully" });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    res.status(500).json({ error: error.message });
  }
});

// List collaborators (owner/editor/viewer can view)
router.get('/:id/collaborators', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { uid, email } = req.user;

  try {
    if (!(await hasCollaboratorsTable())) {
      return res.status(200).json([]);
    }

    const userId = await ensureUserExists(uid, email);
    const access = await canAccessDashboard(id, userId);
    if (!access) return res.status(404).json({ error: "Dashboard not found" });

    const [rows] = await pool.query(
      `SELECT u.email, dc.role, dc.created_at
       FROM dashboard_collaborators dc
       JOIN users u ON u.id = dc.user_id
       WHERE dc.dashboard_id = ?
       ORDER BY dc.created_at DESC`,
      [id]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error listing collaborators:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
