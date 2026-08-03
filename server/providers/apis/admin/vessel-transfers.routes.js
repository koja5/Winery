const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

router.get('/vessel-transfers', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, vf.name AS from_vessel_name, vt.name AS to_vessel_name
       FROM vessel_transfers t
       LEFT JOIN wine_vessels vf ON vf.id = t.from_vessel_id
       JOIN wine_vessels vt ON vt.id = t.to_vessel_id
       WHERE t.tenant_id = ?
       ORDER BY t.transfer_date DESC`,
      [req.user.tenant_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /vessel-transfers/bulk -> splits one source batch across several
// destination vessels in a single atomic operation (e.g. racking a large
// tank into multiple barrels). body: { from_vessel_id, aging_id, transfer_date,
// reason, notes, lines: [{ to_vessel_id, quantity_liters }] }
router.post('/vessel-transfers/bulk', async (req, res, next) => {
  const { from_vessel_id, aging_id, transfer_date, reason, notes, lines } = req.body;

  if (!Array.isArray(lines) || !lines.length) {
    return res.status(400).json({ message: 'Bar jedna destinacija je obavezna.' });
  }
  if (!transfer_date) {
    return res.status(400).json({ message: 'Datum pretoka je obavezan.' });
  }
  for (const line of lines) {
    if (!line.to_vessel_id || !line.quantity_liters || Number(line.quantity_liters) <= 0) {
      return res.status(400).json({ message: 'Svaka destinacija mora imati posudu i količinu veću od 0.' });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const created = [];
    for (const line of lines) {
      const id = randomUUID();
      await conn.query(
        `INSERT INTO vessel_transfers
           (id, tenant_id, aging_id, from_vessel_id, to_vessel_id, transfer_date, quantity_liters, reason, notes)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          id,
          req.user.tenant_id,
          aging_id || null,
          from_vessel_id || null,
          line.to_vessel_id,
          transfer_date,
          line.quantity_liters,
          reason || null,
          notes || null
        ]
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

router.delete('/vessel-transfers/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM vessel_transfers WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
