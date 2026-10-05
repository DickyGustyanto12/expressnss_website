CREATE TABLE IF NOT EXISTS live_chat_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_whatsapp VARCHAR(20) NOT NULL,
  public_token_hash VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('open', 'assigned', 'closed') DEFAULT 'open',
  assigned_admin_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS live_chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  client_message_id VARCHAR(80) NULL,
  sender_type ENUM('customer', 'admin') NOT NULL,
  sender_admin_id INT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES live_chat_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_admin_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_live_chat_client_msg (conversation_id, client_message_id)
);

CREATE TABLE IF NOT EXISTS live_chat_agent_presence (
  admin_id INT PRIMARY KEY,
  status ENUM('online', 'busy', 'offline') DEFAULT 'online',
  last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);