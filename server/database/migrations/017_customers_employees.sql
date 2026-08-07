-- Saradnici: kupci (za buduću prodaju/fakturisanje vina) i zaposleni.
-- Dobavljači iz "Saradnici" menija su isti entitet kao dobavljači berbe
-- (tabela `suppliers`, već postoji od T2.1) — nema potrebe za duplikatom.

CREATE TABLE IF NOT EXISTS `customers` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `pib_or_jmbg` VARCHAR(50) DEFAULT NULL,
  `mb` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(255) DEFAULT NULL,
  `zip` VARCHAR(20) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_customers_tenant` (`tenant_id`),
  CONSTRAINT `fk_customers_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `employees` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `firstname` VARCHAR(255) DEFAULT NULL,
  `lastname` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(255) DEFAULT NULL,
  `zip` VARCHAR(20) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_employees_tenant` (`tenant_id`),
  CONSTRAINT `fk_employees_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
