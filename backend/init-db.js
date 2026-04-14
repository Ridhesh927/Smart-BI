require('dotenv').config();
const mysql = require('mysql2/promise');

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

    console.log("Creating 'datasets' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`datasets\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`owner_id\` INT NOT NULL,
        \`file_name\` VARCHAR(255) NOT NULL,
        \`file_path\` VARCHAR(255) NOT NULL,
        \`file_size\` BIGINT NOT NULL,
        \`mime_type\` VARCHAR(100) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_datasets_users\` FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

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
