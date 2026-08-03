const { randomUUID } = require('crypto');

/**
 * Klonira sample podatke iz tenanta označenog kao demo (tenants.is_demo = 1)
 * u novi tenant, tako da novi korisnik odmah ima primer podataka umesto
 * praznog sistema. Kopira ceo production chain redosledom zavisnosti i
 * remapuje sve FK-ove na novododeljene id-jeve.
 */
class DemoClonerService {
  async clone(pool, newTenantId) {
    const [[demoTenant]] = await pool.query('SELECT id FROM tenants WHERE is_demo = 1 LIMIT 1');
    if (!demoTenant) return { cloned: false, reason: 'no-demo-tenant' };

    const demoTenantId = demoTenant.id;
    const idMap = new Map();
    const newId = (oldId) => {
      if (!oldId) return oldId;
      if (!idMap.has(oldId)) idMap.set(oldId, randomUUID());
      return idMap.get(oldId);
    };

    await this._cloneTable(pool, 'vineyard_parcels', demoTenantId, newTenantId, (row) => [
      newId(row.id),
      newTenantId,
      row.name,
      row.location,
      row.area_ha,
      row.grape_variety,
      row.ownership_type,
      row.notes,
      row.active
    ], 'id, tenant_id, name, location, area_ha, grape_variety, ownership_type, notes, active');

    await this._cloneTable(pool, 'wine_vessels', demoTenantId, newTenantId, (row) => [
      newId(row.id),
      newTenantId,
      row.name,
      row.vessel_type,
      row.capacity_liters,
      row.location,
      row.status,
      row.active
    ], 'id, tenant_id, name, vessel_type, capacity_liters, location, status, active');

    await this._cloneTable(pool, 'suppliers', demoTenantId, newTenantId, (row) => [
      newId(row.id),
      newTenantId,
      row.name,
      row.contact_person,
      row.phone,
      row.email,
      row.address,
      row.notes,
      row.active
    ], 'id, tenant_id, name, contact_person, phone, email, address, notes, active');

    await this._cloneTable(pool, 'grape_receptions', demoTenantId, newTenantId, (row) => [
      newId(row.id),
      newTenantId,
      newId(row.parcel_id),
      row.supplier_name,
      newId(row.supplier_id),
      null,
      row.grape_variety,
      row.reception_date,
      row.quantity_kg,
      row.quantity_kg_current,
      row.sugar_degrees,
      row.notes
    ], 'id, tenant_id, parcel_id, supplier_name, supplier_id, announcement_id, grape_variety, reception_date, quantity_kg, quantity_kg_current, sugar_degrees, notes');

    await this._cloneTable(pool, 'must_fermentations', demoTenantId, newTenantId, (row) => [
      newId(row.id),
      newTenantId,
      newId(row.vessel_id),
      row.name,
      row.wine_type,
      row.start_date,
      row.end_date,
      row.quantity_liters,
      row.quantity_liters_current,
      row.status,
      row.notes
    ], 'id, tenant_id, vessel_id, name, wine_type, start_date, end_date, quantity_liters, quantity_liters_current, status, notes');

    await this._cloneJunction(
      pool,
      'grape_reception_pressings',
      `fermentation_id IN (SELECT id FROM must_fermentations WHERE tenant_id = ?)`,
      demoTenantId,
      (row) => [newId(row.id), newId(row.fermentation_id), newId(row.reception_id), row.quantity_kg],
      'id, fermentation_id, reception_id, quantity_kg'
    );

    await this._cloneTable(pool, 'wine_agings', demoTenantId, newTenantId, (row) => [
      newId(row.id),
      newTenantId,
      newId(row.vessel_id),
      newId(row.fermentation_id),
      row.name,
      row.wine_variety,
      row.vintage_year,
      row.lot,
      row.start_date,
      row.end_date,
      row.quantity_liters,
      row.quantity_liters_current,
      row.notes
    ], 'id, tenant_id, vessel_id, fermentation_id, name, wine_variety, vintage_year, lot, start_date, end_date, quantity_liters, quantity_liters_current, notes');

    return {
      cloned: true,
      tables: [
        'vineyard_parcels',
        'wine_vessels',
        'suppliers',
        'grape_receptions',
        'must_fermentations',
        'grape_reception_pressings',
        'wine_agings'
      ]
    };
  }

  async _cloneTable(pool, table, demoTenantId, newTenantId, mapRow, insertColumns) {
    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE tenant_id = ?`, [demoTenantId]);
    for (const row of rows) {
      const values = mapRow(row);
      const placeholders = values.map(() => '?').join(',');
      await pool.query(`INSERT INTO ${table} (${insertColumns}) VALUES (${placeholders})`, values);
    }
  }

  async _cloneJunction(pool, table, scopeCondition, demoTenantId, mapRow, insertColumns) {
    // junction tables have no tenant_id of their own — scope via a subquery
    // against the already-cloned parent table.
    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE ${scopeCondition}`, [demoTenantId]);
    for (const row of rows) {
      const values = mapRow(row);
      const placeholders = values.map(() => '?').join(',');
      await pool.query(`INSERT INTO ${table} (${insertColumns}) VALUES (${placeholders})`, values);
    }
  }
}

module.exports = new DemoClonerService();
