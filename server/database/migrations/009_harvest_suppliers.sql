-- T2.1: Dobavljači i najave berbe. `grape_receptions.supplier_name` ostaje kao
-- legacy tekstualno polje (za stare unose bez registrovanog dobavljača), ali
-- novi unosi se vezuju preko `supplier_id` FK-a, kako je najavljeno u
-- 002_wine_production_chain.sql.

CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `contact_person` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_suppliers_tenant` (`tenant_id`),
  CONSTRAINT `fk_suppliers_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `harvest_announcements` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `supplier_id` CHAR(36) NOT NULL,
  `parcel_id` CHAR(36) DEFAULT NULL,
  `grape_variety` VARCHAR(255) DEFAULT NULL,
  `planned_date` DATE NOT NULL,
  `planned_quantity_kg` DECIMAL(10, 2) DEFAULT NULL,
  `status` ENUM('planned', 'confirmed', 'received', 'cancelled') NOT NULL DEFAULT 'planned',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_announcements_tenant` (`tenant_id`),
  KEY `idx_announcements_supplier` (`supplier_id`),
  KEY `idx_announcements_parcel` (`parcel_id`),
  CONSTRAINT `fk_announcements_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_announcements_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_announcements_parcel` FOREIGN KEY (`parcel_id`) REFERENCES `vineyard_parcels` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `grape_receptions`
  ADD COLUMN `supplier_id` CHAR(36) DEFAULT NULL AFTER `supplier_name`,
  ADD COLUMN `announcement_id` CHAR(36) DEFAULT NULL AFTER `supplier_id`,
  ADD KEY `idx_receptions_supplier` (`supplier_id`),
  ADD KEY `idx_receptions_announcement` (`announcement_id`),
  ADD CONSTRAINT `fk_receptions_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  ADD CONSTRAINT `fk_receptions_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `harvest_announcements` (`id`) ON DELETE SET NULL;
