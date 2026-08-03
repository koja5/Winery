const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

const LIST_SQL = `
  SELECT ha.*, s.name AS supplier_name, vp.name AS parcel_name
  FROM harvest_announcements ha
  LEFT JOIN suppliers s ON s.id = ha.supplier_id
  LEFT JOIN vineyard_parcels vp ON vp.id = ha.parcel_id
  WHERE ha.tenant_id = ?
  ORDER BY ha.planned_date DESC
`;

router.get('/harvest-announcements', async (req, res, next) => {
  try {
    const [rows] = await pool.query(LIST_SQL, [req.user.tenant_id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/harvest-announcements', async (req, res, next) => {
  try {
    const {
      id,
      supplier_id,
      parcel_id,
      grape_variety,
      planned_date,
      planned_quantity_kg,
      status,
      notes
    } = req.body;

    if (id) {
      await pool.query(
        `UPDATE harvest_announcements
         SET supplier_id = ?, parcel_id = ?, grape_variety = ?, planned_date = ?, planned_quantity_kg = ?, status = ?, notes = ?
         WHERE id = ? AND tenant_id = ?`,
        [supplier_id, parcel_id || null, grape_variety, planned_date, planned_quantity_kg || null, status, notes, id, req.user.tenant_id]
      );
      return res.json({ id });
    }

    const newId = randomUUID();
    await pool.query(
      `INSERT INTO harvest_announcements
       (id, tenant_id, supplier_id, parcel_id, grape_variety, planned_date, planned_quantity_kg, status, notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        newId,
        req.user.tenant_id,
        supplier_id,
        parcel_id || null,
        grape_variety,
        planned_date,
        planned_quantity_kg || null,
        status || 'planned',
        notes
      ]
    );
    res.json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.delete('/harvest-announcements/:id', async (req, res, next) => {
  try {
    const [[announcement]] = await pool.query(
      'SELECT id FROM harvest_announcements WHERE id = ? AND tenant_id = ?',
      [req.params.id, req.user.tenant_id]
    );
    if (!announcement) {
      return res.status(404).json({ message: 'Najava nije pronađena.' });
    }
    await pool.query('UPDATE grape_receptions SET announcement_id = NULL WHERE announcement_id = ?', [req.params.id]);
    await pool.query('DELETE FROM harvest_announcements WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ deletionType: 'both' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
