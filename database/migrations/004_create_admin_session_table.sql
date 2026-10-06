CREATE TABLE `admin_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL,
  `session_token` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  `last_activity` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_token` (`session_token`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert data dummy untuk testing
INSERT INTO `admin_sessions` 
(`admin_id`, `session_token`, `ip_address`, `user_agent`, `expires_at`) 
VALUES 
(1, 'test-session-token-123', '127.0.0.1', 'Mozilla/5.0', DATE_ADD(NOW(), INTERVAL 24 HOUR));

SELECT '✅ Tabel admin_sessions berhasil dibuat!' AS status;