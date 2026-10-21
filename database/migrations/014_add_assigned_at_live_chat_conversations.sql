ALTER TABLE `live_chat_conversations`
  ADD COLUMN `assigned_at` TIMESTAMP NULL DEFAULT NULL AFTER `assigned_admin_id`;
