-- T0.6: Generic documents sistem
-- documents = biblioteka fajlova po tenantu; document_links = polimorfna veza
-- ka bilo kom entitetu (entity_type + entity_id), omogućava reuse istog fajla
-- na više zapisa bez ponovnog upload-a.

CREATE TABLE IF NOT EXISTS `documents` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `tenant_id` CHAR(36) NOT NULL,
  `uploaded_by` CHAR(36) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `path` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) DEFAULT NULL,
  `size_bytes` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_documents_tenant` (`tenant_id`),
  CONSTRAINT `fk_documents_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_documents_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `document_links` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `document_id` CHAR(36) NOT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_id` CHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_document_links` (`document_id`, `entity_type`, `entity_id`),
  KEY `idx_document_links_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_document_links_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
