-- T1.5: Hemijske analize vina (30+ parametara), analogno
-- records_physical_chemical_analysis iz eDestilerije ali sa punim OIV setom
-- parametara za vino. Vezano za posudu (i opciono konkretnu negu/fermentaciju
-- u toku), dokumenti (lab izveštaj) se kače preko generičkog documents
-- sistema (entity_type = 'wine_analysis').

CREATE TABLE IF NOT EXISTS `wine_analyses` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `vessel_id` CHAR(36) NOT NULL,
  `aging_id` CHAR(36) DEFAULT NULL,
  `fermentation_id` CHAR(36) DEFAULT NULL,
  `sample_date` DATE NOT NULL,
  `lab_name` VARCHAR(255) DEFAULT NULL,

  -- osnovni parametri
  `alcohol_pct` DECIMAL(5, 2) DEFAULT NULL,
  `density` DECIMAL(6, 4) DEFAULT NULL,
  `ph` DECIMAL(4, 2) DEFAULT NULL,
  `total_acidity` DECIMAL(6, 2) DEFAULT NULL,
  `volatile_acidity` DECIMAL(6, 2) DEFAULT NULL,
  `residual_sugar` DECIMAL(7, 2) DEFAULT NULL,
  `reducing_sugars` DECIMAL(7, 2) DEFAULT NULL,
  `co2` DECIMAL(6, 2) DEFAULT NULL,

  -- sumpor
  `free_so2` DECIMAL(6, 2) DEFAULT NULL,
  `total_so2` DECIMAL(6, 2) DEFAULT NULL,
  `bound_so2` DECIMAL(6, 2) DEFAULT NULL,

  -- kiseline
  `tartaric_acid` DECIMAL(6, 2) DEFAULT NULL,
  `malic_acid` DECIMAL(6, 2) DEFAULT NULL,
  `lactic_acid` DECIMAL(6, 2) DEFAULT NULL,
  `citric_acid` DECIMAL(6, 2) DEFAULT NULL,
  `acetic_acid` DECIMAL(6, 2) DEFAULT NULL,

  -- ekstrakt / mineralni sastav
  `total_extract` DECIMAL(6, 2) DEFAULT NULL,
  `dry_extract` DECIMAL(6, 2) DEFAULT NULL,
  `sugar_free_extract` DECIMAL(6, 2) DEFAULT NULL,
  `ash` DECIMAL(6, 3) DEFAULT NULL,
  `alkalinity_of_ash` DECIMAL(6, 2) DEFAULT NULL,
  `glycerol` DECIMAL(6, 2) DEFAULT NULL,

  -- fenolni sastav / boja (crvena vina)
  `total_polyphenols` DECIMAL(7, 2) DEFAULT NULL,
  `total_anthocyanins` DECIMAL(7, 2) DEFAULT NULL,
  `total_tannins` DECIMAL(6, 2) DEFAULT NULL,
  `color_intensity` DECIMAL(6, 3) DEFAULT NULL,
  `color_hue` DECIMAL(6, 3) DEFAULT NULL,

  -- joni / metali
  `potassium` DECIMAL(7, 2) DEFAULT NULL,
  `sodium` DECIMAL(7, 2) DEFAULT NULL,
  `calcium` DECIMAL(7, 2) DEFAULT NULL,
  `iron` DECIMAL(6, 3) DEFAULT NULL,
  `copper` DECIMAL(6, 3) DEFAULT NULL,
  `chlorides` DECIMAL(6, 2) DEFAULT NULL,
  `sulphates` DECIMAL(6, 2) DEFAULT NULL,

  -- ostalo
  `methanol` DECIMAL(6, 2) DEFAULT NULL,
  `acetaldehyde` DECIMAL(6, 2) DEFAULT NULL,

  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY `idx_wine_analyses_tenant` (`tenant_id`),
  KEY `idx_wine_analyses_vessel` (`vessel_id`),
  CONSTRAINT `fk_wine_analyses_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wine_analyses_vessel` FOREIGN KEY (`vessel_id`) REFERENCES `wine_vessels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wine_analyses_aging` FOREIGN KEY (`aging_id`) REFERENCES `wine_agings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_wine_analyses_fermentation` FOREIGN KEY (`fermentation_id`) REFERENCES `must_fermentations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
