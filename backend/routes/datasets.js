const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/authMiddleware');
const pool = require('../config/db');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|json)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, XLSX, and JSON are allowed.'));
    }
  }
});

// Helper: resolve owner_id from firebase_uid, auto-creating user if needed
async function getOwnerId(uid, email) {
  await pool.query(
    `INSERT INTO users (firebase_uid, email) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE email = VALUES(email)`,
    [uid, email || '']
  );
  const [rows] = await pool.query(`SELECT id FROM users WHERE firebase_uid = ?`, [uid]);
  return rows[0]?.id;
}

// Upload Dataset
router.post('/upload', verifyToken, upload.single('dataset'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const { originalname, filename, size, mimetype, path: filePath } = req.file;
  const { uid, email } = req.user;

  try {
    const ownerId = await getOwnerId(uid, email);
    const [result] = await pool.query(
      `INSERT INTO datasets (owner_id, file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)`,
      [ownerId, originalname, filePath, size, mimetype]
    );

    res.status(201).json({ 
      id: result.insertId, 
      message: "Dataset uploaded successfully",
      file: { originalname, filename, size, filePath }
    });
  } catch (error) {
    console.error("Database error on file upload:", error);
    res.status(500).json({ error: error.message });
  }
});

// List User's Datasets
router.get('/', verifyToken, async (req, res) => {
  const { uid, email } = req.user;
  try {
    const ownerId = await getOwnerId(uid, email);
    const [rows] = await pool.query(
      `SELECT id, file_name, file_size, file_path, created_at FROM datasets WHERE owner_id = ? ORDER BY created_at DESC`,
      [ownerId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching datasets:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a Dataset
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { uid, email } = req.user;
  try {
    const ownerId = await getOwnerId(uid, email);
    const [result] = await pool.query(
      `DELETE FROM datasets WHERE id = ? AND owner_id = ?`,
      [id, ownerId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Dataset not found or unauthorized" });
    res.status(200).json({ message: "Dataset deleted successfully" });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
