const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

router.get('/vineyard-work-orders', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT w.*, p.name AS parcel_name, u.firstname AS assigned_firstname, u.lastname AS assigned_lastname
       FROM vineyard_work_orders w
       LEFT JOIN vineyard_parcels p ON p.id = w.parcel_id
       LEFT JOIN users u ON u.id = w.assigned_to
       WHERE w.tenant_id = ?
       ORDER BY w.due_date ASC`,
      [req.user.tenant_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/vineyard-work-orders', async (req, res, next) => {
  try {
    const { id, title, description, parcel_id, assigned_to, due_date, status, priority } = req.body;

    if (id) {
      await pool.query(
        `UPDATE vineyard_work_orders
         SET title = ?, description = ?, parcel_id = ?, assigned_to = ?, due_date = ?, status = ?, priority = ?
         WHERE id = ? AND tenant_id = ?`,
        [
          title,
          description || null,
          parcel_id || null,
          assigned_to || null,
          due_date,
          status || 'pending',
          priority || 'normal',
          id,
          req.user.tenant_id
        ]
      );
      return res.json({ id });
    }

    const newId = randomUUID();
    await pool.query(
      `INSERT INTO vineyard_work_orders (id, tenant_id, title, description, parcel_id, assigned_to, due_date, status, priority)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        newId,
        req.user.tenant_id,
        title,
        description || null,
        parcel_id || null,
        assigned_to || null,
        due_date,
        status || 'pending',
        priority || 'normal'
      ]
    );
    res.json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.delete('/vineyard-work-orders/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM vineyard_work_orders WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
