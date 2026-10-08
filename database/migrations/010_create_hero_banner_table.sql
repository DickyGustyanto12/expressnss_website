CREATE TABLE IF NOT EXISTS `hero_banner` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `judul` VARCHAR(100) NOT NULL,
  `deskripsi` TEXT NOT NULL,
  `gambar_url` VARCHAR(255) NOT NULL,
  `badge_text` VARCHAR(100) DEFAULT '#1 MITRA LOGISTIK ANDA',
  `button_text` VARCHAR(50) DEFAULT 'Hubungi Kami',
  `button_link` VARCHAR(255) DEFAULT '#kontak',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `urutan` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_urutan` (`urutan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;