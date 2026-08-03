-- T2.4: Obračun berbe i isplate dobavljačima.
-- Oblik analogan invoice-record-payments iz eDestilerije: `harvest_settlements`
-- je "faktura" ka dobavljaču za pokupljeno grožđe, `harvest_settlement_payments`
-- su delimične/potpune uplate protiv nje, status se izvodi iz zbira uplata.

CREATE TABLE IF NOT EXISTS `harvest_settlements` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `supplier_id` CHAR(36) NOT NULL,
  `settlement_date` DATE NOT NULL,
  `price_per_kg` DECIMAL(10, 2) NOT NULL,
  `total_quantity_kg` DECIMAL(10, 2) NOT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('unpaid', 'partially_paid', 'paid') NOT NULL DEFAULT 'unpaid',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_settlements_tenant` (`tenant_id`),
  KEY `idx_settlements_supplier` (`supplier_id`),
  CONSTRAINT `fk_settlements_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_settlements_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Junction: koje partije prijema grožđa (moguće više, jedna isplata pokriva
-- čitavu berbu jednog dana/perioda) ulaze u dati obračun.
CREATE TABLE IF NOT EXISTS `harvest_settlement_receptions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `settlement_id` CHAR(36) NOT NULL,
  `reception_id` CHAR(36) NOT NULL,
  `quantity_kg` DECIMAL(10, 2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_settlement_receptions_settlement` (`settlement_id`),
  UNIQUE KEY `uq_settlement_receptions_reception` (`reception_id`),
  CONSTRAINT `fk_settlement_receptions_settlement` FOREIGN KEY (`settlement_id`) REFERENCES `harvest_settlements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_settlement_receptions_reception` FOREIGN KEY (`reception_id`) REFERENCES `grape_receptions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `harvest_settlement_payments` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `settlement_id` CHAR(36) NOT NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `method` VARCHAR(64) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_settlement_payments_tenant` (`tenant_id`),
  KEY `idx_settlement_payments_settlement` (`settlement_id`),
  CONSTRAINT `fk_settlement_payments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_settlement_payments_settlement` FOREIGN KEY (`settlement_id`) REFERENCES `harvest_settlements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
