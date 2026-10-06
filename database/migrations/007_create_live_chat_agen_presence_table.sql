CREATE TABLE `live_chat_agent_presence` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL,
  `is_online` TINYINT(1) NOT NULL DEFAULT 0,
  `last_seen` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_id` (`admin_id`),
  KEY `idx_is_online` (`is_online`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert data dummy untuk testing
INSERT INTO `live_chat_agent_presence` 
(`admin_id`, `is_online`) 
VALUES 
(1, 1),
(2, 0);

SELECT '✅ Tabel live_chat_agent_presence berhasil dibuat!' AS status;