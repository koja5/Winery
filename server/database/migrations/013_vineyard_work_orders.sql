CREATE TABLE IF NOT EXISTS `vineyard_work_orders` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `parcel_id` CHAR(36) DEFAULT NULL,
  `assigned_to` CHAR(36) DEFAULT NULL,
  `due_date` DATE NOT NULL,
  `status` ENUM('pending', 'in_progress', 'done', 'cancelled') NOT NULL DEFAULT 'pending',
  `priority` ENUM('low', 'normal', 'high') NOT NULL DEFAULT 'normal',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_vineyard_work_orders_tenant` (`tenant_id`),
  KEY `idx_vineyard_work_orders_parcel` (`parcel_id`),
  KEY `idx_vineyard_work_orders_assigned` (`assigned_to`),
  CONSTRAINT `fk_vineyard_work_orders_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vineyard_work_orders_parcel` FOREIGN KEY (`parcel_id`) REFERENCES `vineyard_parcels` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vineyard_work_orders_assigned` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
