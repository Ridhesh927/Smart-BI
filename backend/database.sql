-- SmartDash Database Schema
-- Run this in your MySQL client to build out the necessary tables

CREATE DATABASE IF NOT EXISTS \`autobi_studio\`;
USE \`autobi_studio\`;

CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`firebase_uid\` varchar(255) NOT NULL UNIQUE,
  \`email\` varchar(255) NOT NULL,
  \`display_name\` varchar(255) DEFAULT '',
  \`photo_url\` varchar(255) DEFAULT '',
  \`subscription_tier\` enum('free', 'pro', 'enterprise') DEFAULT 'free',
  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
  \`last_login\` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`dashboards\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` varchar(255) NOT NULL,
  \`title\` varchar(255) NOT NULL DEFAULT 'Untitled Dashboard',
  \`layout_data\` json DEFAULT NULL,
  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`user_id_idx\` (\`user_id\`),
  CONSTRAINT \`fk_dashboard_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`firebase_uid\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`datasets\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` varchar(255) NOT NULL,
  \`file_name\` varchar(255) NOT NULL,
  \`file_path\` varchar(255) NOT NULL,
  \`file_size\` bigint(20) NOT NULL,
  \`mime_type\` varchar(100) NOT NULL,
  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`user_id_idx\` (\`user_id\`),
  CONSTRAINT \`fk_dataset_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`firebase_uid\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional dummy data for testing
-- INSERT INTO \`users\` (\`firebase_uid\`, \`email\`, \`display_name\`) VALUES ('demo-user-123', 'demo@autobi.com', 'Demo User');
