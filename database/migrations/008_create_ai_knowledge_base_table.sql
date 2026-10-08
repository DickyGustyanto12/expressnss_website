CREATE TABLE IF NOT EXISTS `ai_knowledge_base` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `kategori` VARCHAR(50) NOT NULL DEFAULT 'umum',
  `pertanyaan` TEXT NOT NULL,
  `jawaban` TEXT NOT NULL,
  `kata_kunci` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `urutan` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kategori` (`kategori`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_urutan` (`urutan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
