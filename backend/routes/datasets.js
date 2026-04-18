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
              const numVal = parseFloat(sampleValue);
              const isNumeric = !isNaN(numVal) && isFinite(sampleValue);
              // Year-like columns (4-digit integers 1900-2100) are dimensions, not measures
              const isYear = isNumeric && Number.isInteger(numVal) && numVal >= 1900 && numVal <= 2100;
              columns.push({
                name: header,
                type: (isNumeric && !isYear) ? 'measure' : 'dimension',
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
          // Year-like columns (4-digit integers 1900-2100) are dimensions, not measures
          const isYear = isNumeric && Number.isInteger(sampleValue) && sampleValue >= 1900 && sampleValue <= 2100;
          columns.push({
            name: header,
            type: (isNumeric && !isYear) ? 'measure' : 'dimension',
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

    // Check if field exists in the data
    const firstRow = data[0];
    if (firstRow && !Object.keys(firstRow).includes(field)) {
      return res.status(400).json({ error: `Column '${field}' not found in dataset` });
    }
    const uniqueValues = [...new Set(
      data
        .map((row) => row[field])
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
        .map((value) => String(value))
    )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    res.status(200).json(uniqueValues);

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
      // Virtual COUNT field - maps to COUNT(1)
      if (m.field === '__count__') {
        return `COUNT(1) AS [\`Number of Records\`]`;
      }
      const agg = m.aggregation || 'SUM';
      return `${agg}(\`${m.field}\`) AS \`${m.field}\``;
    }).join(', ');

    let selectClause = [selDimensions, selMeasures].filter(Boolean).join(', ');
    let groupbyClause = selDimensions ? `GROUP BY ${selDimensions}` : '';
    
    // Default to count if nothing selected
    if (!selectClause) selectClause = 'COUNT(1) AS [res_count]';

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

// Data Profiling / Pre-processing Report
router.get('/:id/profile', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { uid, email } = req.user;

  try {
    const ownerId = await getOwnerId(uid, email);
    const [rows] = await pool.query(
      `SELECT file_path, file_name, mime_type FROM datasets WHERE id = ? AND owner_id = ?`,
      [id, ownerId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Dataset not found' });
    const { file_path: filePath, file_name: fileName, mime_type: mimeType } = rows[0];

    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });

    // Load data
    let data = [];
    if (mimeType === 'text/csv' || filePath.endsWith('.csv')) {
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else if (mimeType.includes('spreadsheetml') || filePath.endsWith('.xlsx')) {
      const workbook = xlsx.readFile(filePath);
      data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    if (!data.length) return res.json({ rows: 0, columns: [], fileName });

    const totalRows = data.length;
    const columnNames = Object.keys(data[0]);

    const columns = columnNames.map(col => {
      const values = data.map(row => row[col]);
      const nullValues = values.filter(v => v === null || v === undefined || v === '' || String(v).trim() === '');
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '' && String(v).trim() !== '');
      const uniqueValues = [...new Set(nonNullValues.map(v => String(v)))];

      // Determine type
      const numericValues = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
      const isNumeric = numericValues.length > nonNullValues.length * 0.8;
      const isYear = isNumeric && numericValues.every(v => Number.isInteger(v) && v >= 1900 && v <= 2100);

      let dataType = 'text';
      let min = null, max = null, mean = null;

      if (isNumeric && !isYear) {
        dataType = 'numeric';
        min = Math.min(...numericValues);
        max = Math.max(...numericValues);
        mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      } else if (isYear) {
        dataType = 'year';
        min = Math.min(...numericValues);
        max = Math.max(...numericValues);
      }

      return {
        name: col,
        dataType,
        totalRows,
        nullCount: nullValues.length,
        nullPercent: parseFloat(((nullValues.length / totalRows) * 100).toFixed(1)),
        uniqueCount: uniqueValues.length,
        sampleValues: uniqueValues.slice(0, 5),
        min: min !== null ? parseFloat(min.toFixed(2)) : null,
        max: max !== null ? parseFloat(max.toFixed(2)) : null,
        mean: mean !== null ? parseFloat(mean.toFixed(2)) : null,
      };
    });

    // Overall quality score: penalise columns with missing data
    const avgNullPercent = columns.reduce((a, c) => a + c.nullPercent, 0) / columns.length;
    const qualityScore = Math.round(100 - avgNullPercent);

    res.status(200).json({
      fileName,
      totalRows,
      totalColumns: columns.length,
      qualityScore,
      columns,
    });
  } catch (error) {
    console.error('Profiling Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download Cleaned Dataset (strips rows with any missing values)
router.get('/:id/clean', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { uid, email } = req.user;

  try {
    const ownerId = await getOwnerId(uid, email);
    const [rows] = await pool.query(
      `SELECT file_path, file_name, mime_type FROM datasets WHERE id = ? AND owner_id = ?`,
      [id, ownerId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Dataset not found' });
    const { file_path: filePath, file_name: fileName, mime_type: mimeType } = rows[0];

    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });

    // Load data
    let data = [];
    let headers = [];

    if (mimeType === 'text/csv' || filePath.endsWith('.csv')) {
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
      if (data.length > 0) headers = Object.keys(data[0]);
    } else if (mimeType.includes('spreadsheetml') || filePath.endsWith('.xlsx')) {
      const workbook = xlsx.readFile(filePath);
      data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      if (data.length > 0) headers = Object.keys(data[0]);
    } else {
      return res.status(400).json({ error: 'Unsupported file type for cleaning' });
    }

    if (!data.length) return res.status(400).json({ error: 'Dataset is empty' });

    // Clean: remove rows where ANY value is null / undefined / empty string
    const cleanedData = data.filter(row =>
      headers.every(h => {
        const v = row[h];
        return v !== null && v !== undefined && String(v).trim() !== '';
      })
    );

    const removedRows = data.length - cleanedData.length;

    // Build CSV string
    const escapeCsvValue = (v) => {
      const str = String(v ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const csvLines = [
      headers.map(escapeCsvValue).join(','),
      ...cleanedData.map(row => headers.map(h => escapeCsvValue(row[h])).join(','))
    ];
    const csvContent = csvLines.join('\n');

    // Send as file download
    const cleanName = `cleaned_${fileName.replace(/\.[^.]+$/, '.csv')}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanName}"`);
    res.setHeader('X-Removed-Rows', String(removedRows));
    res.setHeader('X-Total-Rows', String(data.length));
    res.setHeader('X-Clean-Rows', String(cleanedData.length));
    res.status(200).send(csvContent);

  } catch (error) {
    console.error('Clean Download Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
