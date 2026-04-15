const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const verifyToken = require('../middleware/authMiddleware');
const pool = require('../config/db');
let advancedDatasetsColumns = null;

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

async function hasAdvancedDatasetsColumns() {
  if (advancedDatasetsColumns !== null) return advancedDatasetsColumns;
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'datasets'
         AND COLUMN_NAME IN (
           'processing_status',
           'rows_count',
           'columns_count',
           'cleaning_report_json',
           'analysis_json',
           'visual_recommendations_json',
           'preview_json',
           'processing_error',
           'processed_at'
         )`
    );
    advancedDatasetsColumns = Number(rows[0]?.count || 0) >= 9;
  } catch {
    advancedDatasetsColumns = false;
  }
  return advancedDatasetsColumns;
}

function safeJsonParse(value, fallback = null) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function inferColumnType(values) {
  const filtered = values.filter((v) => v !== null && v !== undefined && `${v}`.trim() !== '');
  if (filtered.length === 0) return 'unknown';

  const numericCount = filtered.filter((v) => Number.isFinite(Number(v))).length;
  const booleanCount = filtered.filter((v) => ['true', 'false', '0', '1'].includes(String(v).toLowerCase())).length;
  const dateCount = filtered.filter((v) => !Number.isNaN(Date.parse(v))).length;

  const ratio = (count) => count / filtered.length;
  if (ratio(numericCount) > 0.8) return 'number';
  if (ratio(dateCount) > 0.8) return 'date';
  if (ratio(booleanCount) > 0.8) return 'boolean';
  return 'string';
}

function buildNumericStats(values) {
  const nums = values
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);

  if (nums.length === 0) return null;
  const sum = nums.reduce((acc, val) => acc + val, 0);
  const mean = sum / nums.length;
  const median = nums[Math.floor(nums.length / 2)];
  const q1 = nums[Math.floor(nums.length * 0.25)];
  const q3 = nums[Math.floor(nums.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = nums.filter((n) => n < lowerBound || n > upperBound).length;

  return {
    min: nums[0],
    max: nums[nums.length - 1],
    mean: Number(mean.toFixed(4)),
    median,
    outliers
  };
}

function pearsonCorrelation(a, b) {
  if (a.length !== b.length || a.length < 2) return null;
  const n = a.length;
  const meanA = a.reduce((acc, v) => acc + v, 0) / n;
  const meanB = b.reduce((acc, v) => acc + v, 0) / n;
  let numerator = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i += 1) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    numerator += da * db;
    denA += da * da;
    denB += db * db;
  }
  const denominator = Math.sqrt(denA * denB);
  if (denominator === 0) return null;
  return Number((numerator / denominator).toFixed(4));
}

function recommendVisualizations(columnsMeta) {
  // Sort numeric columns to prioritize potentially interesting metrics (non-IDs)
  const isIdColumn = (c) => 
    c.name.toLowerCase().includes('id') || 
    c.name.toLowerCase().includes('code') || 
    (c.uniqueCount > 10 && c.nullCount === 0 && c.uniqueCount === c.totalRows); 

  const numberCols = columnsMeta.filter((c) => c.inferredType === 'number')
    .sort((a, b) => {
      const aId = a.name.toLowerCase().includes('id');
      const bId = b.name.toLowerCase().includes('id');
      if (aId !== bId) return aId ? 1 : -1;
      return 0;
    });

  const dateCols = columnsMeta.filter((c) => c.inferredType === 'date');
  const categoryCols = columnsMeta.filter((c) => 
    c.inferredType === 'string' && 
    c.uniqueCount > 1 && 
    c.uniqueCount < 50
  );
  const anyCategoryCols = columnsMeta.filter((c) => c.inferredType === 'string');

  const recommendations = [];

  if (dateCols.length > 0 && numberCols.length > 0) {
    recommendations.push({
      chart: 'line',
      title: `Trend of ${numberCols[0].name} over ${dateCols[0].name}`,
      reason: 'Time-series pattern detected.',
      xAxis: dateCols[0].name,
      yAxis: numberCols[0].name
    });
  }

  if ((categoryCols.length > 0 || anyCategoryCols.length > 0) && numberCols.length > 0) {
    const cat = categoryCols[0] || anyCategoryCols[0];
    recommendations.push({
      chart: 'bar',
      title: `${numberCols[0].name} by ${cat.name}`,
      reason: 'Categorical comparison is best represented as bars.',
      xAxis: cat.name,
      yAxis: numberCols[0].name
    });
  }

  if (numberCols.length >= 2) {
    recommendations.push({
      chart: 'scatter',
      title: `${numberCols[0].name} vs ${numberCols[1].name}`,
      reason: 'Two numeric columns available for relationship analysis.',
      xAxis: numberCols[0].name,
      yAxis: numberCols[1].name
    });
  }

  if (categoryCols.length > 0 || anyCategoryCols.length > 0) {
    const cat = categoryCols[0] || anyCategoryCols[0];
    recommendations.push({
      chart: 'pie',
      title: `Distribution of ${cat.name}`,
      reason: 'Category share breakdown suitable for pie chart.',
      xAxis: cat.name,
      yAxis: cat.name 
    });
  }

  return recommendations.slice(0, 4);
}

function parseDatasetFile(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('No worksheet found in file.');
  }
  const firstSheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(firstSheet, {
    defval: null,
    raw: false
  });
  return rows;
}

function generateAINarrative(analysis) {
  const insights = [];
  
  // 1. Coverage Insight
  const nullSums = analysis.columns.reduce((s, c) => s + c.nullCount, 0);
  if (nullSums === 0) {
    insights.push({ type: 'quality', severity: 'high', message: 'Perfect data quality! No missing values detected.' });
  } else if (analysis.rowCount > 0 && analysis.columnCount > 0) {
    const pct = ((nullSums / (analysis.rowCount * analysis.columnCount)) * 100).toFixed(1);
    insights.push({ type: 'quality', severity: 'low', message: `Data accessibility is at ${100 - pct}%. Some cleanup may be needed for missing values.` });
  }

  // 2. Trend Insight
  const numericCols = analysis.columns.filter(c => c.inferredType === 'number' && !c.name.toLowerCase().includes('id'));
  if (numericCols.length > 0) {
    const main = numericCols[0];
    insights.push({ type: 'trend', severity: 'medium', message: `Primary metric focus: '${main.name}' is driving the core variance in this dataset.` });
  }

  // 3. Anomaly Insight
  const anomalyCols = analysis.columns.filter(c => c.numericStats && c.numericStats.outliers > 0);
  if (anomalyCols.length > 0) {
    const total = anomalyCols.reduce((s, c) => s + c.numericStats.outliers, 0);
    insights.push({ type: 'anomaly', severity: 'high', message: `AI Alert: Found ${total} anomalies that deviate significantly from normal patterns.` });
  }

  // 4. Correlation Insight
  if (analysis.correlations && analysis.correlations.length > 0) {
    const top = analysis.correlations[0];
    if (Math.abs(top.coefficient) > 0.6) {
      const strength = Math.abs(top.coefficient) > 0.85 ? 'rock-solid' : 'strong';
      insights.push({ type: 'correlation', severity: 'medium', message: `Detected a ${strength} relationship between '${top.x}' and '${top.y}'.` });
    }
  }

  return insights;
}

function analyzeRows(rows) {
  const sampledRows = rows.slice(0, 5000);
  const columns = sampledRows.length > 0 ? Object.keys(sampledRows[0]) : [];
  const columnsMeta = columns.map((name) => {
    const values = sampledRows.map((row) => row[name]);
    const nullCount = values.filter((v) => v === null || v === undefined || `${v}`.trim() === '').length;
    const uniqueCount = new Set(values.map((v) => (v === null || v === undefined ? 'NULL' : String(v)))).size;
    const inferredType = inferColumnType(values);
    const numericStats = inferredType === 'number' ? buildNumericStats(values) : null;

    return {
      name,
      inferredType,
      nullCount,
      nullPercentage: sampledRows.length ? Number(((nullCount / sampledRows.length) * 100).toFixed(2)) : 0,
      uniqueCount,
      numericStats
    };
  });

  const duplicateRows = (() => {
    const seen = new Set();
    let duplicateCount = 0;
    for (const row of sampledRows) {
      const signature = JSON.stringify(row);
      if (seen.has(signature)) {
        duplicateCount += 1;
      } else {
        seen.add(signature);
      }
    }
    return duplicateCount;
  })();

  const missingValues = columnsMeta.reduce((acc, col) => acc + col.nullCount, 0);
  const correlations = [];
  const numericColumns = columnsMeta.filter((col) => col.inferredType === 'number').map((col) => col.name);
  for (let i = 0; i < numericColumns.length; i += 1) {
    for (let j = i + 1; j < numericColumns.length; j += 1) {
      const xCol = numericColumns[i];
      const yCol = numericColumns[j];
      const pairs = sampledRows
        .map((row) => [Number(row[xCol]), Number(row[yCol])])
        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
      if (pairs.length > 2) {
        const corr = pearsonCorrelation(pairs.map((p) => p[0]), pairs.map((p) => p[1]));
        if (corr !== null) {
          correlations.push({ x: xCol, y: yCol, coefficient: corr });
        }
      }
    }
  }

  const emptyColumns = columnsMeta.filter((col) => col.nullPercentage === 100).map((col) => col.name);
  const highMissingColumns = columnsMeta
    .filter((col) => col.nullPercentage >= 30 && col.nullPercentage < 100)
    .map((col) => ({ name: col.name, nullPercentage: col.nullPercentage }));
  const lowVarianceColumns = columnsMeta
    .filter((col) => col.uniqueCount <= 1 && col.inferredType !== 'unknown')
    .map((col) => col.name);
  const typeSummary = columnsMeta.reduce((acc, col) => {
    acc[col.inferredType] = (acc[col.inferredType] || 0) + 1;
    return acc;
  }, {});

  const analysisObject = {
    rowCount: rows.length,
    sampledRowCount: sampledRows.length,
    columnCount: columns.length,
    columns: columnsMeta,
    duplicateRows,
    missingValues,
    emptyColumns,
    highMissingColumns,
    lowVarianceColumns,
    typeSummary,
    correlations: correlations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient)).slice(0, 6)
  };

  return {
    ...analysisObject,
    recommendations: recommendVisualizations(columnsMeta),
    aiInsights: generateAINarrative(analysisObject),
    previewRows: sampledRows.slice(0, 200)
  };
}

async function updateDatasetInsights(datasetId, ownerId, analysis) {
  const cleaningOperations = [
    {
      step: 'schema_detection',
      status: 'completed',
      message: `Detected ${analysis.columnCount} columns with inferred types.`
    },
    {
      step: 'empty_column_check',
      status: 'completed',
      message: analysis.emptyColumns.length
        ? `Found empty columns: ${analysis.emptyColumns.join(', ')}`
        : 'No fully empty columns found.'
    },
    {
      step: 'missing_value_check',
      status: 'completed',
      message: analysis.highMissingColumns.length
        ? `High missing data in ${analysis.highMissingColumns.length} column(s).`
        : 'No high-missing columns detected.'
    },
    {
      step: 'duplicate_check',
      status: 'completed',
      message: `${analysis.duplicateRows} duplicate rows detected.`
    },
    {
      step: 'outlier_scan',
      status: 'completed',
      message: `Outlier scan complete for numeric columns.`
    }
  ];

  const cleaningReport = {
    status: 'completed',
    duplicateRowsDetected: analysis.duplicateRows,
    missingValuesDetected: analysis.missingValues,
    emptyColumnsDetected: analysis.emptyColumns,
    highMissingColumns: analysis.highMissingColumns,
    lowVarianceColumns: analysis.lowVarianceColumns,
    operations: cleaningOperations,
    suggestedActions: [
      analysis.duplicateRows > 0 ? 'Remove duplicate rows' : 'Duplicate cleanup not required',
      analysis.emptyColumns.length > 0 ? 'Drop or backfill fully empty columns' : 'No fully empty columns found',
      analysis.columns.some((c) => c.nullPercentage > 0) ? 'Handle missing values in selected columns' : 'No missing-value cleanup required',
      'Validate inferred data types before modeling'
    ],
    completedAt: new Date().toISOString()
  };

  const analysisSummary = {
    status: 'completed',
    rowCount: analysis.rowCount,
    sampledRowCount: analysis.sampledRowCount,
    columnCount: analysis.columnCount,
    columns: analysis.columns,
    duplicateRows: analysis.duplicateRows,
    missingValues: analysis.missingValues,
    emptyColumns: analysis.emptyColumns,
    highMissingColumns: analysis.highMissingColumns,
    lowVarianceColumns: analysis.lowVarianceColumns,
    typeSummary: analysis.typeSummary,
    correlations: analysis.correlations
  };

  await pool.query(
    `UPDATE datasets
     SET processing_status = ?,
         cleaning_report_json = ?,
         analysis_json = ?,
         visual_recommendations_json = ?,
         preview_json = ?,
         rows_count = ?,
         columns_count = ?,
         processed_at = NOW(),
         processing_error = NULL
     WHERE id = ? AND owner_id = ?`,
    [
      'ready',
      JSON.stringify(cleaningReport),
      JSON.stringify(analysisSummary),
      JSON.stringify(analysis.recommendations),
      JSON.stringify(analysis.previewRows),
      analysis.rowCount,
      analysis.columnCount,
      datasetId,
      ownerId
    ]
  );
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
    const advancedSchema = await hasAdvancedDatasetsColumns();
    const [result] = advancedSchema
      ? await pool.query(
          `INSERT INTO datasets (owner_id, file_name, file_path, file_size, mime_type, processing_status) VALUES (?, ?, ?, ?, ?, ?)`,
          [ownerId, originalname, filePath, size, mimetype, 'processing']
        )
      : await pool.query(
          `INSERT INTO datasets (owner_id, file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)`,
          [ownerId, originalname, filePath, size, mimetype]
        );

    let analysis = null;
    try {
      const rows = parseDatasetFile(filePath);
      analysis = analyzeRows(rows);
      if (advancedSchema) {
        await updateDatasetInsights(result.insertId, ownerId, analysis);
      }
    } catch (processingError) {
      if (advancedSchema) {
        await pool.query(
          `UPDATE datasets
           SET processing_status = ?, processing_error = ?
           WHERE id = ? AND owner_id = ?`,
          ['failed', processingError.message, result.insertId, ownerId]
        );
      }
      throw processingError;
    }

    res.status(201).json({ 
      id: result.insertId, 
      message: "Dataset uploaded successfully",
      status: 'ready',
      file: { originalname, filename, size, filePath },
      cleaning_report: {
        status: 'completed',
        duplicateRowsDetected: analysis.duplicateRows,
        missingValuesDetected: analysis.missingValues
      },
      analysis: {
        rowCount: analysis.rowCount,
        columnCount: analysis.columnCount,
        emptyColumns: analysis.emptyColumns,
        highMissingColumns: analysis.highMissingColumns,
        lowVarianceColumns: analysis.lowVarianceColumns,
        typeSummary: analysis.typeSummary,
        correlations: analysis.correlations
      },
      visual_recommendations: analysis.recommendations
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
    const advancedSchema = await hasAdvancedDatasetsColumns();
    const [rows] = advancedSchema
      ? await pool.query(
          `SELECT id, file_name, file_size, file_path, mime_type, processing_status, rows_count, columns_count, created_at, processed_at
           FROM datasets
           WHERE owner_id = ?
           ORDER BY created_at DESC`,
          [ownerId]
        )
      : await pool.query(
          `SELECT id, file_name, file_size, file_path, mime_type, created_at
           FROM datasets
           WHERE owner_id = ?
           ORDER BY created_at DESC`,
          [ownerId]
        );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching datasets:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get processed insights for one dataset
router.get('/:id/insights', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { uid, email } = req.user;
  try {
    const ownerId = await getOwnerId(uid, email);
    const advancedSchema = await hasAdvancedDatasetsColumns();
    const [rows] = advancedSchema
      ? await pool.query(
          `SELECT id, file_name, processing_status, processing_error, rows_count, columns_count, created_at, processed_at,
                  cleaning_report_json, analysis_json, visual_recommendations_json, file_path
           FROM datasets
           WHERE id = ? AND owner_id = ?
           LIMIT 1`,
          [id, ownerId]
        )
      : await pool.query(
          `SELECT id, file_name, file_path, created_at
           FROM datasets
           WHERE id = ? AND owner_id = ?
           LIMIT 1`,
          [id, ownerId]
        );
    if (!rows[0]) return res.status(404).json({ error: 'Dataset not found' });

    const dataset = rows[0];
    if (!advancedSchema) {
      const parsedRows = parseDatasetFile(dataset.file_path);
      const analysis = analyzeRows(parsedRows);
      // Sample first 500 rows for visualization
      const sampledRows = parsedRows.slice(0, 500);
      return res.status(200).json({
        id: dataset.id,
        file_name: dataset.file_name,
        processing_status: 'ready',
        rows_count: analysis.rowCount,
        columns_count: analysis.columnCount,
        created_at: dataset.created_at,
        cleaning_report: {
          status: 'completed',
          duplicateRowsDetected: analysis.duplicateRows,
          missingValuesDetected: analysis.missingValues,
          emptyColumnsDetected: analysis.emptyColumns,
          highMissingColumns: analysis.highMissingColumns,
          lowVarianceColumns: analysis.lowVarianceColumns,
          operations: [
            { step: 'schema_detection', status: 'completed', message: `Detected ${analysis.columnCount} columns with inferred types.` },
            { step: 'empty_column_check', status: 'completed', message: analysis.emptyColumns.length ? `Found empty columns: ${analysis.emptyColumns.join(', ')}` : 'No fully empty columns found.' },
            { step: 'missing_value_check', status: 'completed', message: analysis.highMissingColumns.length ? `High missing data in ${analysis.highMissingColumns.length} column(s).` : 'No high-missing columns detected.' },
            { step: 'duplicate_check', status: 'completed', message: `${analysis.duplicateRows} duplicate rows detected.` },
          ]
        },
        analysis: {
          rowCount: analysis.rowCount,
          columnCount: analysis.columnCount,
          missingValues: analysis.missingValues,
          duplicateRows: analysis.duplicateRows,
          emptyColumns: analysis.emptyColumns,
          highMissingColumns: analysis.highMissingColumns,
          lowVarianceColumns: analysis.lowVarianceColumns,
          typeSummary: analysis.typeSummary,
          columns: analysis.columns,
          correlations: analysis.correlations
        },
        visual_recommendations: analysis.recommendations,
        rows: sampledRows
      });
    }

    // For advanced schema, also sample rows
    const parsedRows = parseDatasetFile(dataset.file_path);
    const analysis = analyzeRows(parsedRows);
    const sampledRows = parsedRows.slice(0, 500);
    
    res.status(200).json({
      ...dataset,
      cleaning_report: safeJsonParse(dataset.cleaning_report_json, {}),
      analysis: {
        ...safeJsonParse(dataset.analysis_json, {}),
        columns: analysis.columns
      },
      visual_recommendations: safeJsonParse(dataset.visual_recommendations_json, []),
      rows: sampledRows
    });
  } catch (error) {
    console.error("Error fetching dataset insights:", error);
    res.status(500).json({ error: error.message });
  }
});

// Preview/query rows with pagination, sorting, and search
router.get('/:id/preview', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, sortBy, sortOrder = 'asc', search = '' } = req.query;
  const { uid, email } = req.user;

  try {
    const ownerId = await getOwnerId(uid, email);
    const [rows] = await pool.query(
      `SELECT file_path FROM datasets WHERE id = ? AND owner_id = ? LIMIT 1`,
      [id, ownerId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Dataset not found' });

    const allRows = parseDatasetFile(rows[0].file_path);
    let filteredRows = allRows;

    if (search) {
      const term = String(search).toLowerCase();
      filteredRows = allRows.filter((row) =>
        Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(term))
      );
    }

    if (sortBy) {
      filteredRows = [...filteredRows].sort((a, b) => {
        const av = a[sortBy];
        const bv = b[sortBy];
        if (av === bv) return 0;
        if (sortOrder === 'desc') return av > bv ? -1 : 1;
        return av > bv ? 1 : -1;
      });
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const start = (pageNum - 1) * limitNum;
    const pageRows = filteredRows.slice(start, start + limitNum);

    res.status(200).json({
      page: pageNum,
      limit: limitNum,
      total: filteredRows.length,
      totalPages: Math.ceil(filteredRows.length / limitNum),
      rows: pageRows
    });
  } catch (error) {
    console.error("Error fetching dataset preview:", error);
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

// ─── Download Cleaned Dataset ─────────────────────────────────────────────────
// GET /api/datasets/:id/download-cleaned?format=csv|json|xlsx
router.get('/:id/download-cleaned', verifyToken, async (req, res) => {
  const { id } = req.params;
  const format = (req.query.format || 'csv').toLowerCase();
  const { uid, email } = req.user;

  try {
    const ownerId = await getOwnerId(uid, email);
    const [rows] = await pool.query(
      `SELECT file_name, file_path FROM datasets WHERE id = ? AND owner_id = ? LIMIT 1`,
      [id, ownerId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Dataset not found' });

    const { file_name, file_path } = rows[0];
    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'Original file not found on disk.' });
    }

    // ── 1. Parse raw rows ────────────────────────────────────────────────────
    let allRows = parseDatasetFile(file_path);
    if (!allRows || allRows.length === 0) {
      return res.status(400).json({ error: 'Dataset is empty or could not be parsed.' });
    }

    const columns = Object.keys(allRows[0]);

    // ── 2. Identify fully empty columns (100% null) — drop them ─────────────
    const emptyColumns = new Set(
      columns.filter(col => allRows.every(row => row[col] === null || row[col] === undefined || String(row[col]).trim() === ''))
    );

    // ── 3. Remove duplicate rows ─────────────────────────────────────────────
    const seen = new Set();
    let cleaned = allRows.filter(row => {
      const sig = JSON.stringify(row);
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });

    const duplicatesRemoved = allRows.length - cleaned.length;

    // ── 4. For each remaining column: fill missing values ────────────────────
    //    • numeric  → fill with median
    //    • string   → fill with mode (most frequent value)
    const keptColumns = columns.filter(col => !emptyColumns.has(col));

    keptColumns.forEach(col => {
      const values = cleaned.map(row => row[col]);
      const nonEmpty = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');

      if (nonEmpty.length === 0) return; // nothing to impute

      const isNumeric = nonEmpty.every(v => Number.isFinite(Number(v)));

      let fillValue;
      if (isNumeric) {
        // median
        const nums = nonEmpty.map(Number).sort((a, b) => a - b);
        fillValue = nums[Math.floor(nums.length / 2)];
      } else {
        // mode
        const freq = {};
        nonEmpty.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
        fillValue = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
      }

      cleaned = cleaned.map(row => {
        const val = row[col];
        if (val === null || val === undefined || String(val).trim() === '') {
          return { ...row, [col]: fillValue };
        }
        return row;
      });
    });

    // ── 5. Rebuild rows with only kept columns ───────────────────────────────
    cleaned = cleaned.map(row => {
      const out = {};
      keptColumns.forEach(col => { out[col] = row[col]; });
      return out;
    });

    // ── 6. Build cleaning summary header (only for CSV) ──────────────────────
    const baseName = file_name.replace(/\.[^/.]+$/, '');
    const cleaningSummary = [
      `# SmartDash Cleaned Dataset Export`,
      `# Original file: ${file_name}`,
      `# Original rows: ${allRows.length}`,
      `# Cleaned rows:  ${cleaned.length} (${duplicatesRemoved} duplicate(s) removed)`,
      `# Columns dropped (empty): ${emptyColumns.size > 0 ? [...emptyColumns].join(', ') : 'none'}`,
      `# Missing values filled:   numeric → median, text → mode`,
      `# Exported at: ${new Date().toISOString()}`,
    ].join('\n');

    // ── 7. Respond in requested format ──────────────────────────────────────
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}_cleaned.json"`);
      return res.status(200).send(JSON.stringify({ meta: { originalRows: allRows.length, cleanedRows: cleaned.length, duplicatesRemoved, droppedColumns: [...emptyColumns] }, data: cleaned }, null, 2));
    }

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(cleaned);
      XLSX.utils.book_append_sheet(wb, ws, 'Cleaned Data');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}_cleaned.xlsx"`);
      return res.status(200).send(buf);
    }

    // Default: CSV
    const csvHeader = keptColumns.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',');
    const csvRows = cleaned.map(row =>
      keptColumns.map(col => {
        const val = row[col] === null || row[col] === undefined ? '' : String(row[col]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csvContent = `${cleaningSummary}\n\n${csvHeader}\n${csvRows.join('\n')}`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_cleaned.csv"`);
    res.status(200).send('\uFEFF' + csvContent); // BOM for Excel UTF-8 compatibility

  } catch (error) {
    console.error('Error generating cleaned download:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
