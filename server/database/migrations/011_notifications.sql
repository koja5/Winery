-- Navbar notification bell (kopija dizajna eDestilerija). Prazna lista je
-- validno stanje dok ne postoji producer notifikacija (npr. isteklo skladište,
-- rok radnog naloga) — UI prikazuje "Sve je ažurno" empty state.

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) DEFAULT NULL,
  `type` VARCHAR(64) NOT NULL DEFAULT 'system',
  `severity` ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT DEFAULT NULL,
  `action_url` VARCHAR(255) DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_notifications_tenant` (`tenant_id`),
  KEY `idx_notifications_user` (`user_id`),
  CONSTRAINT `fk_notifications_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
