ALTER TABLE `live_chat_messages`
  MODIFY COLUMN `sender_type` ENUM('customer', 'admin', 'ai') COLLATE utf8mb4_unicode_ci NOT NULL;
