-- Kupažiranje (blend): više izvornih nega (wine_agings) se meša u jednu novu partiju
-- u ciljnoj posudi. Izlaz je nova wine_agings partija (fermentation_id = NULL, jer ne
-- potiče iz jedne fermentacije); wine_blend_components čuva sledljivost unazad —
-- koliko litara i koji % je svaka izvorna partija doprinela. EVINAR ovaj proces
-- ne pokriva kao poseban modul.

CREATE TABLE IF NOT EXISTS `wine_blends` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `result_aging_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `blend_date` DATETIME NOT NULL,
  `total_quantity_liters` DECIMAL(10, 2) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_blends_tenant` (`tenant_id`),
  KEY `idx_blends_result_aging` (`result_aging_id`),
  CONSTRAINT `fk_blends_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_blends_result_aging` FOREIGN KEY (`result_aging_id`) REFERENCES `wine_agings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `wine_blend_components` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `blend_id` CHAR(36) NOT NULL,
  `source_aging_id` CHAR(36) NOT NULL,
  `quantity_liters` DECIMAL(10, 2) NOT NULL,
  `percentage` DECIMAL(5, 2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_blend_components_blend` (`blend_id`),
  KEY `idx_blend_components_source` (`source_aging_id`),
  CONSTRAINT `fk_blend_components_blend` FOREIGN KEY (`blend_id`) REFERENCES `wine_blends` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_blend_components_source` FOREIGN KEY (`source_aging_id`) REFERENCES `wine_agings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
