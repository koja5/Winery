CREATE TABLE IF NOT EXISTS `parcel_treatments` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `parcel_id` CHAR(36) NOT NULL,
  `treatment_type` ENUM('spraying', 'fertilizing', 'pruning', 'irrigation', 'other') NOT NULL DEFAULT 'spraying',
  `treatment_date` DATE NOT NULL,
  `substance` VARCHAR(255) DEFAULT NULL,
  `quantity` DECIMAL(10, 2) DEFAULT NULL,
  `unit` VARCHAR(20) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_treatments_tenant` (`tenant_id`),
  KEY `idx_treatments_parcel` (`parcel_id`),
  CONSTRAINT `fk_treatments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_treatments_parcel` FOREIGN KEY (`parcel_id`) REFERENCES `vineyard_parcels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
