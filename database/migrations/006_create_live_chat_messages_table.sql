CREATE TABLE `live_chat_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `conversation_id` INT NOT NULL,
  `client_message_id` VARCHAR(100) NOT NULL,
  `sender_type` ENUM('customer', 'admin') NOT NULL,
  `sender_admin_id` INT DEFAULT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_client_message_id` (`client_message_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_type` (`sender_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_messages_conversation` 
    FOREIGN KEY (`conversation_id`) 
    REFERENCES `live_chat_conversations` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert data dummy untuk testing
INSERT INTO `live_chat_messages` 
(`conversation_id`, `client_message_id`, `sender_type`, `sender_admin_id`, `message`) 
VALUES 
(1, 'web-001', 'customer', NULL, 'Halo, saya ingin bertanya tentang pengiriman'),
(1, 'admin-001', 'admin', 1, 'Halo! Selamat datang di NSS Express. Ada yang bisa kami bantu?'),
(2, 'web-002', 'customer', NULL, 'Berapa biaya kirim ke Bandung?'),
(2, 'admin-002', 'admin', 1, 'Untuk pengiriman ke Bandung, biaya mulai dari Rp 15.000/kg');

SELECT '✅ Tabel live_chat_messages berhasil dibuat!' AS status;