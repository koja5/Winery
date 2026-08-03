-- T0.3: Šema production chain-a za vino
-- Oblik analogan rakija-lancu iz eDestilerije (courts -> wine_vessels, agings -> wine_agings,
-- chargings -> wine_chargings), kod je nezavisan.

CREATE TABLE IF NOT EXISTS `vineyard_parcels` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `location` TEXT DEFAULT NULL,
  `area_ha` DECIMAL(10, 2) DEFAULT NULL,
  `grape_variety` VARCHAR(255) DEFAULT NULL,
  `ownership_type` ENUM('owned', 'leased') NOT NULL DEFAULT 'owned',
  `notes` TEXT DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_parcels_tenant` (`tenant_id`),
  CONSTRAINT `fk_parcels_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `wine_vessels` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `vessel_type` ENUM('inox_tank', 'wood_barrel', 'concrete_vat', 'other') NOT NULL DEFAULT 'inox_tank',
  `capacity_liters` DECIMAL(10, 2) NOT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('empty', 'in_use', 'maintenance', 'reserved') NOT NULL DEFAULT 'empty',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_vessels_tenant` (`tenant_id`),
  CONSTRAINT `fk_vessels_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Prijem grožđa. `supplier_name` je privremeno tekstualno polje — Faza 2 (T2.1) uvodi
-- `suppliers` tabelu i menja ovo u FK preko ALTER migracije.
CREATE TABLE IF NOT EXISTS `grape_receptions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `parcel_id` CHAR(36) DEFAULT NULL,
  `supplier_name` VARCHAR(255) DEFAULT NULL,
  `grape_variety` VARCHAR(255) DEFAULT NULL,
  `reception_date` DATETIME NOT NULL,
  `quantity_kg` DECIMAL(10, 2) NOT NULL,
  `quantity_kg_current` DECIMAL(10, 2) NOT NULL,
  `sugar_degrees` DECIMAL(5, 2) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_receptions_tenant` (`tenant_id`),
  KEY `idx_receptions_parcel` (`parcel_id`),
  CONSTRAINT `fk_receptions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_receptions_parcel` FOREIGN KEY (`parcel_id`) REFERENCES `vineyard_parcels` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `must_fermentations` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `vessel_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `wine_type` ENUM('red', 'white', 'rose') NOT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME DEFAULT NULL,
  `quantity_liters` DECIMAL(10, 2) NOT NULL,
  `quantity_liters_current` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('in_progress', 'completed', 'stopped') NOT NULL DEFAULT 'in_progress',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_fermentations_tenant` (`tenant_id`),
  KEY `idx_fermentations_vessel` (`vessel_id`),
  CONSTRAINT `fk_fermentations_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fermentations_vessel` FOREIGN KEY (`vessel_id`) REFERENCES `wine_vessels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Junction: koje partije grožđa (moguće više njih, blend) su ušle u datu fermentaciju.
CREATE TABLE IF NOT EXISTS `grape_reception_pressings` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `fermentation_id` CHAR(36) NOT NULL,
  `reception_id` CHAR(36) NOT NULL,
  `quantity_kg` DECIMAL(10, 2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_pressings_fermentation` (`fermentation_id`),
  KEY `idx_pressings_reception` (`reception_id`),
  CONSTRAINT `fk_pressings_fermentation` FOREIGN KEY (`fermentation_id`) REFERENCES `must_fermentations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pressings_reception` FOREIGN KEY (`reception_id`) REFERENCES `grape_receptions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `wine_agings` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `vessel_id` CHAR(36) NOT NULL,
  `fermentation_id` CHAR(36) DEFAULT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `wine_variety` VARCHAR(255) DEFAULT NULL,
  `vintage_year` SMALLINT DEFAULT NULL,
  `lot` VARCHAR(255) DEFAULT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME DEFAULT NULL,
  `quantity_liters` DECIMAL(10, 2) NOT NULL,
  `quantity_liters_current` DECIMAL(10, 2) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_agings_tenant` (`tenant_id`),
  KEY `idx_agings_vessel` (`vessel_id`),
  KEY `idx_agings_fermentation` (`fermentation_id`),
  CONSTRAINT `fk_agings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_agings_vessel` FOREIGN KEY (`vessel_id`) REFERENCES `wine_vessels` (`id`),
  CONSTRAINT `fk_agings_fermentation` FOREIGN KEY (`fermentation_id`) REFERENCES `must_fermentations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Pretoci između posuda (i praznog punjenja i premeštanja gotovog vina).
CREATE TABLE IF NOT EXISTS `vessel_transfers` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `aging_id` CHAR(36) DEFAULT NULL,
  `from_vessel_id` CHAR(36) DEFAULT NULL,
  `to_vessel_id` CHAR(36) NOT NULL,
  `transfer_date` DATETIME NOT NULL,
  `quantity_liters` DECIMAL(10, 2) NOT NULL,
  `reason` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_transfers_tenant` (`tenant_id`),
  KEY `idx_transfers_aging` (`aging_id`),
  KEY `idx_transfers_from` (`from_vessel_id`),
  KEY `idx_transfers_to` (`to_vessel_id`),
  CONSTRAINT `fk_transfers_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transfers_aging` FOREIGN KEY (`aging_id`) REFERENCES `wine_agings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transfers_from_vessel` FOREIGN KEY (`from_vessel_id`) REFERENCES `wine_vessels` (`id`),
  CONSTRAINT `fk_transfers_to_vessel` FOREIGN KEY (`to_vessel_id`) REFERENCES `wine_vessels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Punjenje/flaširanje. `product_name` je privremeno tekstualno polje dok se ne uvede
-- zaseban `products` katalog (van obima Faze 0).
CREATE TABLE IF NOT EXISTS `wine_chargings` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `aging_id` CHAR(36) NOT NULL,
  `product_name` VARCHAR(255) DEFAULT NULL,
  `charging_date` DATETIME NOT NULL,
  `number_of_bottles` INT NOT NULL,
  `bottle_volume_ml` INT NOT NULL DEFAULT 750,
  `lot` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_chargings_tenant` (`tenant_id`),
  KEY `idx_chargings_aging` (`aging_id`),
  CONSTRAINT `fk_chargings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chargings_aging` FOREIGN KEY (`aging_id`) REFERENCES `wine_agings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
