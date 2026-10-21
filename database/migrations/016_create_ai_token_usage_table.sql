CREATE TABLE IF NOT EXISTS `ai_token_usage` (
  `conversation_id` INT NOT NULL,
  `token_input` INT NOT NULL DEFAULT 0,
  `token_output` INT NOT NULL DEFAULT 0,
  `biaya_rp` DECIMAL(14, 4) NOT NULL DEFAULT 0,
  `jumlah_request` INT NOT NULL DEFAULT 0,
  `limit_kustom_rupiah` DECIMAL(12, 2) DEFAULT NULL,
  `limit_kustom_token` INT DEFAULT NULL,
  `limit_tercapai_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`),
  KEY `idx_limit_tercapai_at` (`limit_tercapai_at`),
  KEY `idx_updated_at` (`updated_at`),
  CONSTRAINT `fk_ai_token_usage_conversation`
    FOREIGN KEY (`conversation_id`)
    REFERENCES `live_chat_conversations` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
