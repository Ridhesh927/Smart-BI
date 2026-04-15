require('dotenv').config();
const mysql = require('mysql2/promise');

async function addColumnIfMissing(connection, tableName, columnName, columnDefinition) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  if (Number(rows[0]?.count || 0) === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
  }
}

async function tableExists(connection, tableName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function initializeDatabase() {
  let connection;
  try {
    console.log("Connecting to the database server...");
    
    // Connect without database first to ensure the DB itself exists
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    const dbName = process.env.DB_NAME || 'autobi_studio';

    console.log(`Ensuring database '${dbName}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    console.log("Creating 'users' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`firebase_uid\` VARCHAR(255) UNIQUE NOT NULL,
        \`email\` VARCHAR(255) UNIQUE NOT NULL,
        \`photo_url\` TEXT,
        \`bio\` TEXT,
        \`theme\` VARCHAR(50) DEFAULT 'light',
        \`language\` VARCHAR(50) DEFAULT 'English',
        \`notif_email\` BOOLEAN DEFAULT TRUE,
        \`notif_data_alerts\` BOOLEAN DEFAULT TRUE,
        \`notif_report_schedule\` BOOLEAN DEFAULT TRUE,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Creating 'dashboards' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`dashboards\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`dataset_id\` INT DEFAULT NULL,
        \`layout_json\` JSON DEFAULT (JSON_ARRAY()),
        \`visuals_json\` JSON DEFAULT (JSON_ARRAY()),
        \`owner_id\` INT,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_dashboards_users\` FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await addColumnIfMissing(connection, 'dashboards', 'dataset_id', `INT DEFAULT NULL`);

    console.log("Creating 'datasets' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`datasets\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`owner_id\` INT NOT NULL,
        \`file_name\` VARCHAR(255) NOT NULL,
        \`file_path\` VARCHAR(255) NOT NULL,
        \`file_size\` BIGINT NOT NULL,
        \`mime_type\` VARCHAR(100) NOT NULL,
        \`processing_status\` VARCHAR(30) DEFAULT 'uploaded',
        \`rows_count\` INT DEFAULT NULL,
        \`columns_count\` INT DEFAULT NULL,
        \`cleaning_report_json\` JSON DEFAULT (JSON_OBJECT()),
        \`analysis_json\` JSON DEFAULT (JSON_OBJECT()),
        \`visual_recommendations_json\` JSON DEFAULT (JSON_ARRAY()),
        \`preview_json\` JSON DEFAULT (JSON_ARRAY()),
        \`processing_error\` TEXT DEFAULT NULL,
        \`processed_at\` TIMESTAMP NULL DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_datasets_users\` FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Backward-compatible alters for existing installations
    await addColumnIfMissing(connection, 'datasets', 'processing_status', `VARCHAR(30) DEFAULT 'uploaded'`);
    await addColumnIfMissing(connection, 'datasets', 'rows_count', `INT DEFAULT NULL`);
    await addColumnIfMissing(connection, 'datasets', 'columns_count', `INT DEFAULT NULL`);
    await addColumnIfMissing(connection, 'datasets', 'cleaning_report_json', `JSON`);
    await addColumnIfMissing(connection, 'datasets', 'analysis_json', `JSON`);
    await addColumnIfMissing(connection, 'datasets', 'visual_recommendations_json', `JSON`);
    await addColumnIfMissing(connection, 'datasets', 'preview_json', `JSON`);
    await addColumnIfMissing(connection, 'datasets', 'processing_error', `TEXT DEFAULT NULL`);
    await addColumnIfMissing(connection, 'datasets', 'processed_at', `TIMESTAMP NULL DEFAULT NULL`);

    // Ensure JSON columns are initialized for rows created before migration
    await connection.query(`UPDATE \`datasets\` SET cleaning_report_json = JSON_OBJECT() WHERE cleaning_report_json IS NULL`);
    await connection.query(`UPDATE \`datasets\` SET analysis_json = JSON_OBJECT() WHERE analysis_json IS NULL`);
    await connection.query(`UPDATE \`datasets\` SET visual_recommendations_json = JSON_ARRAY() WHERE visual_recommendations_json IS NULL`);
    await connection.query(`UPDATE \`datasets\` SET preview_json = JSON_ARRAY() WHERE preview_json IS NULL`);

    console.log("Creating 'dashboard_collaborators' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`dashboard_collaborators\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`dashboard_id\` INT NOT NULL,
        \`user_id\` INT NOT NULL,
        \`role\` ENUM('viewer', 'editor') NOT NULL DEFAULT 'viewer',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY \`uniq_dashboard_user\` (\`dashboard_id\`, \`user_id\`),
        CONSTRAINT \`fk_collab_dashboard\` FOREIGN KEY (\`dashboard_id\`) REFERENCES \`dashboards\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_collab_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    if (!(await tableExists(connection, 'dashboard_collaborators'))) {
      throw new Error("Failed to create dashboard_collaborators table");
    }

    console.log("🎉 Database initialization completed successfully!");

  } catch (error) {
    console.error("❌ Error initializing the database:", error);
  } finally {
    if (connection) {
      console.log("Closing database connection.");
      await connection.end();
    }
    process.exit(0);
  }
}

initializeDatabase();
