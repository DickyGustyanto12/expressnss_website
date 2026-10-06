CREATE TABLE `live_chat_conversations` (
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

-- Insert data dummy untuk testing
INSERT INTO `live_chat_conversations` 
(`customer_name`, `customer_whatsapp`, `customer_email`, `public_token_hash`, `status`, `assigned_admin_id`) 
VALUES 
('Test Customer', '081234567890', 'test@example.com', SHA2('test-token-123', 256), 'open', NULL),
('Budi Santoso', '081298765432', 'budi@example.com', SHA2('budi-token-456', 256), 'assigned', 1),
('Siti Rahma', '081345678901', 'siti@example.com', SHA2('siti-token-789', 256), 'closed', 1);

SELECT '✅ Tabel live_chat_conversations berhasil dibuat!' AS status;