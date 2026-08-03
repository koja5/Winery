const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const validator = require('../../services/production-chain-validator');

router.get('/vineyard-parcels', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM vineyard_parcels WHERE tenant_id = ? ORDER BY name ASC',
      [req.user.tenant_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/vineyard-parcels', async (req, res, next) => {
  try {
    const { id, name, location, area_ha, grape_variety, ownership_type, notes } = req.body;

    if (id) {
      await pool.query(
        'UPDATE vineyard_parcels SET name = ?, location = ?, area_ha = ?, grape_variety = ?, ownership_type = ?, notes = ? WHERE id = ? AND tenant_id = ?',
        [name, location, area_ha, grape_variety, ownership_type, notes, id, req.user.tenant_id]
      );
      return res.json({ id });
    }

    const newId = randomUUID();
    await pool.query(
      'INSERT INTO vineyard_parcels (id, tenant_id, name, location, area_ha, grape_variety, ownership_type, notes) VALUES (?,?,?,?,?,?,?,?)',
      [newId, req.user.tenant_id, name, location, area_ha, grape_variety, ownership_type, notes]
    );
    res.json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.post('/vineyard-parcels/:id/geo-boundary', async (req, res, next) => {
  try {
    const { geo_boundary } = req.body;
    await pool.query('UPDATE vineyard_parcels SET geo_boundary = ? WHERE id = ? AND tenant_id = ?', [
      geo_boundary ? JSON.stringify(geo_boundary) : null,
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ id: req.params.id });
  } catch (err) {
    next(err);
  }
});

router.delete('/vineyard-parcels/:id', async (req, res, next) => {
  try {
    const check = await validator.canDeleteVineyardParcel(pool, req.params.id, req.user.tenant_id);
    if (!check.canProceed) {
      return res.status(409).json({ message: check.message, ...check });
    }
    await pool.query('DELETE FROM vineyard_parcels WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ deletionType: check.deletionType });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
