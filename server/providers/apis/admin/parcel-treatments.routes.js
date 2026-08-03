const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

const FIELDS = ['parcel_id', 'treatment_type', 'treatment_date', 'substance', 'quantity', 'unit', 'notes'];

router.get('/parcel-treatments', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, p.name AS parcel_name
       FROM parcel_treatments t
       JOIN vineyard_parcels p ON p.id = t.parcel_id
       WHERE t.tenant_id = ?
       ORDER BY t.treatment_date DESC, t.created_at DESC`,
      [req.user.tenant_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/parcel-treatments', async (req, res, next) => {
  try {
    const { id } = req.body;
    const values = FIELDS.map((field) => (req.body[field] === undefined ? null : req.body[field]));

    if (id) {
      const setClause = FIELDS.map((f) => `${f} = ?`).join(', ');
      await pool.query(`UPDATE parcel_treatments SET ${setClause} WHERE id = ? AND tenant_id = ?`, [
        ...values,
        id,
        req.user.tenant_id
      ]);
      return res.json({ id });
    }

    const newId = randomUUID();
    const columns = ['id', 'tenant_id', ...FIELDS];
    const placeholders = columns.map(() => '?').join(',');
    await pool.query(`INSERT INTO parcel_treatments (${columns.join(',')}) VALUES (${placeholders})`, [
      newId,
      req.user.tenant_id,
      ...values
    ]);
    res.json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.delete('/parcel-treatments/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM parcel_treatments WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
