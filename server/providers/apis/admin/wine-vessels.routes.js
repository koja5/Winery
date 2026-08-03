const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const validator = require('../../services/production-chain-validator');

router.get('/wine-vessels', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM wine_vessels WHERE tenant_id = ? ORDER BY created_at DESC',
      [req.user.tenant_id]
    );
    res.json(rows);
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
