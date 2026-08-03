const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

router.get('/enological-additions', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, v.name AS vessel_name
       FROM wine_enological_additions a
       JOIN wine_vessels v ON v.id = a.vessel_id
       WHERE a.tenant_id = ?
       ORDER BY a.addition_date DESC, a.created_at DESC`,
      [req.user.tenant_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /enological-additions/bulk -> same addition (additive/quantity/date)
// logged once per selected vessel.
router.post('/enological-additions/bulk', async (req, res, next) => {
  const { vessel_ids, addition_date, additive_name, quantity, unit, notes } = req.body;

  if (!Array.isArray(vessel_ids) || !vessel_ids.length) {
    return res.status(400).json({ message: 'Bar jedna posuda je obavezna.' });
  }
  if (!addition_date || !additive_name) {
    return res.status(400).json({ message: 'Datum i naziv dodatka su obavezni.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const created = [];
    for (const vesselId of vessel_ids) {
      const id = randomUUID();
      await conn.query(
        `INSERT INTO wine_enological_additions
           (id, tenant_id, vessel_id, addition_date, additive_name, quantity, unit, notes)
         VALUES (?,?,?,?,?,?,?,?)`,
        [id, req.user.tenant_id, vesselId, addition_date, additive_name, quantity || null, unit || null, notes || null]
      );
      created.push(id);
    }

    await conn.commit();
    res.json({ created });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.delete('/enological-additions/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM wine_enological_additions WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
