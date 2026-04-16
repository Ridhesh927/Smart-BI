const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/authMiddleware');
const pool = require('../config/db');
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const alasql = require('alasql');

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

// Get Dataset Schema (Columns & inferred types)
router.get('/:id/schema', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { uid, email } = req.user;

  try {
    const ownerId = await getOwnerId(uid, email);
    const [rows] = await pool.query(
      `SELECT file_path, file_name, mime_type FROM datasets WHERE id = ? AND owner_id = ?`,
      [id, ownerId]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Dataset not found" });

    const { file_path: filePath, mime_type: mimeType } = rows[0];

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    const columns = [];
    const previewData = [];

    if (mimeType === 'text/csv' || filePath.endsWith('.csv')) {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          if (results.length < 5) results.push(data);
        })
        .on('end', () => {
          if (results.length > 0) {
            const headers = Object.keys(results[0]);
            headers.forEach(header => {
              const sampleValue = results[0][header];
              const isNumeric = !isNaN(parseFloat(sampleValue)) && isFinite(sampleValue);
              columns.push({
                name: header,
                type: isNumeric ? 'measure' : 'dimension',
                dataType: isNumeric ? 'number' : 'string'
              });
            });
          }
          res.status(200).json({ columns, preview: results });
        });
    } else if (mimeType.includes('spreadsheetml') || filePath.endsWith('.xlsx')) {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length > 0) {
        const headers = data[0];
        const firstRow = data[1] || {};
        headers.forEach((header, index) => {
          const sampleValue = firstRow[index];
          const isNumeric = typeof sampleValue === 'number';
          columns.push({
            name: header,
            type: isNumeric ? 'measure' : 'dimension',
            dataType: isNumeric ? 'number' : 'string'
          });
        });
        res.status(200).json({ columns, preview: data.slice(1, 6) });
      } else {
        res.status(200).json({ columns: [], preview: [] });
      }
    } else {
      res.status(400).json({ error: "Unsupported file type for schema extraction" });
    }
  } catch (error) {
    console.error("Error fetching dataset schema:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Unique Values for a specific field
router.get('/:id/values/:field', verifyToken, async (req, res) => {
  const { id, field } = req.params;
  const { uid, email } = req.user;

  try {
    const ownerId = await getOwnerId(uid, email);
    const [rows] = await pool.query(
      `SELECT file_path, mime_type FROM datasets WHERE id = ? AND owner_id = ?`,
      [id, ownerId]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Dataset not found" });
    const { file_path: filePath, mime_type: mimeType } = rows[0];

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    let data = [];
    if (mimeType === 'text/csv' || filePath.endsWith('.csv')) {
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', (err) => reject(err));
      });
    } else if (mimeType.includes('spreadsheetml') || filePath.endsWith('.xlsx')) {
      const workbook = xlsx.readFile(filePath);
      data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    }

    if (!data || data.length === 0) return res.json([]);

    // Check if field exists in the data to avoid AlaSQL crash
    const firstRow = data[0];
    if (firstRow && !Object.keys(firstRow).includes(field)) {
      return res.status(400).json({ error: `Column '${field}' not found in dataset` });
    }

    const query = `SELECT DISTINCT \`${field}\` AS val FROM ? ORDER BY \`${field}\` ASC`;
    const result = alasql(query, [data]);
    
    res.status(200).json(result.map(r => r.val).filter(v => v !== undefined && v !== null));

  } catch (error) {
    console.error("Values Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Execute Dynamic Query (Aggregation & Grouping)
router.post('/:id/query', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { dimensions, measures, filters } = req.body;
  const { uid, email } = req.user;

  try {
    const ownerId = await getOwnerId(uid, email);
    const [rows] = await pool.query(
      `SELECT file_path, mime_type FROM datasets WHERE id = ? AND owner_id = ?`,
      [id, ownerId]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Dataset not found" });
    const { file_path: filePath, mime_type: mimeType } = rows[0];

    // Read full dataset
    let data = [];
    if (mimeType === 'text/csv' || filePath.endsWith('.csv')) {
      data = await new Promise((resolve) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results));
      });
    } else if (mimeType.includes('spreadsheetml') || filePath.endsWith('.xlsx')) {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return res.status(400).json({ error: "Unsupported dataset type" });
    }

    if (!data.length) return res.json([]);

    // Build AlaSQL Query
    const selDimensions = (dimensions || []).map(d => `\`${d}\``).join(', ');
    const selMeasures = (measures || []).map(m => {
      const agg = m.aggregation || 'SUM';
      return `${agg}(\`${m.field}\`) AS \`${m.field}\``;
    }).join(', ');

    let selectClause = [selDimensions, selMeasures].filter(Boolean).join(', ');
    let groupbyClause = selDimensions ? `GROUP BY ${selDimensions}` : '';
    
    // Default to count if nothing selected
    if (!selectClause) selectClause = 'COUNT(*) AS count';

    let whereClause = '';
    if (filters && filters.length > 0) {
      const conditions = filters.map(f => {
        if (!f.values || f.values.length === 0) return null;
        const vals = f.values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
        const op = f.exclude ? 'NOT IN' : 'IN';
        return `\`${f.field}\` ${op} (${vals})`;
      }).filter(Boolean);

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }
    }

    const query = `SELECT ${selectClause} FROM ? ${whereClause} ${groupbyClause}`;
    const result = alasql(query, [data]);

    res.status(200).json(result);

  } catch (error) {
    console.error("Query Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
