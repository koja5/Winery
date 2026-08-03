const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

const NUMERIC_FIELDS = ['ph', 'organic_matter_pct', 'nitrogen', 'phosphorus', 'potassium', 'calcium', 'magnesium', 'cec'];

const ALL_FIELDS = ['parcel_id', 'sample_type', 'sample_date', 'lab_name', ...NUMERIC_FIELDS, 'notes'];

router.get('/soil-analyses', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, p.name AS parcel_name
       FROM soil_analyses a
       JOIN vineyard_parcels p ON p.id = a.parcel_id
       WHERE a.tenant_id = ?
       ORDER BY a.sample_date DESC, a.created_at DESC`,
      [req.user.tenant_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/soil-analyses', async (req, res, next) => {
  try {
    const { id } = req.body;
    const values = ALL_FIELDS.map((field) => (req.body[field] === undefined ? null : req.body[field]));

    if (id) {
      const setClause = ALL_FIELDS.map((f) => `${f} = ?`).join(', ');
      await pool.query(`UPDATE soil_analyses SET ${setClause} WHERE id = ? AND tenant_id = ?`, [
        ...values,
        id,
        req.user.tenant_id
      ]);
      return res.json({ id });
    }

    const newId = randomUUID();
    const columns = ['id', 'tenant_id', ...ALL_FIELDS];
    const placeholders = columns.map(() => '?').join(',');
    await pool.query(`INSERT INTO soil_analyses (${columns.join(',')}) VALUES (${placeholders})`, [
      newId,
      req.user.tenant_id,
      ...values
    ]);
    res.json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.delete('/soil-analyses/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM soil_analyses WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
