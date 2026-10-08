CREATE TABLE IF NOT EXISTS `live_chat_conversations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_whatsapp` VARCHAR(20) NOT NULL,
  `customer_email` VARCHAR(100) DEFAULT NULL,
  `public_token_hash` VARCHAR(255) NOT NULL,
  `status` ENUM('open', 'assigned', 'closed') NOT NULL DEFAULT 'open',
  `assigned_admin_id` INT DEFAULT NULL,
  `closed_at` TIMESTAMP NULL DEFAULT NULL,
  `closed_by_admin_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_public_token_hash` (`public_token_hash`),
  KEY `idx_status` (`status`),
  KEY `idx_assigned_admin_id` (`assigned_admin_id`),
  KEY `idx_closed_at` (`closed_at`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
