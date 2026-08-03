-- T1.4: Masovni unos enoloških dodataka (SO2, kvasac, enzimi, itd.) na posude.

CREATE TABLE IF NOT EXISTS `wine_enological_additions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `vessel_id` CHAR(36) NOT NULL,
  `addition_date` DATE NOT NULL,
  `additive_name` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10, 2) DEFAULT NULL,
  `unit` VARCHAR(20) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_enological_additions_tenant` (`tenant_id`),
  KEY `idx_enological_additions_vessel` (`vessel_id`),
  CONSTRAINT `fk_enological_additions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_enological_additions_vessel` FOREIGN KEY (`vessel_id`) REFERENCES `wine_vessels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
