const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

// team members of the current tenant, for the "assigned to" picker.
router.get('/team-members', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, CONCAT(COALESCE(firstname, ''), ' ', COALESCE(lastname, '')) AS name
       FROM users WHERE tenant_id = ? AND active = 1 ORDER BY firstname`,
      [req.user.tenant_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/work-orders', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT w.*, v.name AS vessel_name, u.firstname AS assigned_firstname, u.lastname AS assigned_lastname
       FROM work_orders w
       LEFT JOIN wine_vessels v ON v.id = w.vessel_id
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

router.post('/work-orders', async (req, res, next) => {
  try {
    const { id, title, description, vessel_id, assigned_to, due_date, status, priority } = req.body;

    if (id) {
      await pool.query(
        `UPDATE work_orders
         SET title = ?, description = ?, vessel_id = ?, assigned_to = ?, due_date = ?, status = ?, priority = ?
         WHERE id = ? AND tenant_id = ?`,
        [title, description || null, vessel_id || null, assigned_to || null, due_date, status || 'pending', priority || 'normal', id, req.user.tenant_id]
      );
      return res.json({ id });
    }

    const newId = randomUUID();
    await pool.query(
      `INSERT INTO work_orders (id, tenant_id, title, description, vessel_id, assigned_to, due_date, status, priority)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        newId,
        req.user.tenant_id,
        title,
        description || null,
        vessel_id || null,
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

router.delete('/work-orders/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM work_orders WHERE id = ? AND tenant_id = ?', [req.params.id, req.user.tenant_id]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
