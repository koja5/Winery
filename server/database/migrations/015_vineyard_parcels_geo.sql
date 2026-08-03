ALTER TABLE `vineyard_parcels`
  ADD COLUMN `geo_boundary` JSON DEFAULT NULL AFTER `ownership_type`;
