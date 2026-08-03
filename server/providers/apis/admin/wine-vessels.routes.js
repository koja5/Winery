const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const validator = require('../../services/production-chain-validator');

// current-content summary joined onto the list so the grid shows "what's in
// this vessel right now" without an extra round trip per row.
const LIST_SQL = `
  SELECT
    v.*,
    COALESCE(f.wine_type, a.wine_variety) AS current_variety,
    COALESCE(f.quantity_liters_current, a.quantity_liters_current) AS current_quantity_liters,
    a.vintage_year AS current_vintage_year,
    CASE WHEN f.id IS NOT NULL THEN 'fermentation' WHEN a.id IS NOT NULL THEN 'aging' ELSE NULL END AS current_stage
  FROM wine_vessels v
  LEFT JOIN must_fermentations f ON f.vessel_id = v.id AND f.status = 'in_progress'
  LEFT JOIN wine_agings a ON a.vessel_id = v.id AND a.quantity_liters_current > 0
  WHERE v.tenant_id = ?
  ORDER BY v.created_at DESC
`;

router.get('/wine-vessels', async (req, res, next) => {
  try {
    const [rows] = await pool.query(LIST_SQL, [req.user.tenant_id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /wine-vessels/:id/content -> full detail for the "expand" panel:
// active fermentation (if any) + all agings still holding wine in this
// vessel + the last few transfers in/out.
router.get('/wine-vessels/:id/content', async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    const [[vessel]] = await pool.query('SELECT * FROM wine_vessels WHERE id = ? AND tenant_id = ?', [
      id,
      tenantId
    ]);
    if (!vessel) {
      return res.status(404).json({ message: 'Posuda nije pronađena.' });
    }

    const [fermentations] = await pool.query(
      "SELECT * FROM must_fermentations WHERE vessel_id = ? AND tenant_id = ? AND status = 'in_progress'",
      [id, tenantId]
    );

    const [agings] = await pool.query(
      'SELECT * FROM wine_agings WHERE vessel_id = ? AND tenant_id = ? AND quantity_liters_current > 0',
      [id, tenantId]
    );

    const [recentTransfers] = await pool.query(
      `SELECT * FROM vessel_transfers WHERE (from_vessel_id = ? OR to_vessel_id = ?) AND tenant_id = ?
       ORDER BY transfer_date DESC LIMIT 10`,
      [id, id, tenantId]
    );

    res.json({ vessel, fermentations, agings, recentTransfers });
  } catch (err) {
    next(err);
  }
});

router.post('/wine-vessels', async (req, res, next) => {
  try {
    const { id, name, vessel_type, capacity_liters, location, status } = req.body;

    if (id) {
      await pool.query(
        'UPDATE wine_vessels SET name = ?, vessel_type = ?, capacity_liters = ?, location = ?, status = ? WHERE id = ? AND tenant_id = ?',
        [name, vessel_type, capacity_liters, location, status, id, req.user.tenant_id]
      );
      return res.json({ id });
    }

    const newId = randomUUID();
    await pool.query(
      'INSERT INTO wine_vessels (id, tenant_id, name, vessel_type, capacity_liters, location, status) VALUES (?,?,?,?,?,?,?)',
      [newId, req.user.tenant_id, name, vessel_type, capacity_liters, location, status || 'empty']
    );
    res.json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.delete('/wine-vessels/:id', async (req, res, next) => {
  try {
    const check = await validator.canDeleteWineVessel(pool, req.params.id, req.user.tenant_id);
    if (!check.canProceed) {
      return res.status(409).json({ message: check.message, ...check });
    }
    await pool.query('DELETE FROM wine_vessels WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ deletionType: check.deletionType });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
