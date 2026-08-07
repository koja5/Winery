const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

router.get('/employees', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees WHERE tenant_id = ? ORDER BY firstname ASC', [
      req.user.tenant_id
    ]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/employees', async (req, res, next) => {
  try {
    const { id, firstname, lastname, email, phone, address, city, zip, notes, active } = req.body;

    if (id) {
      await pool.query(
        `UPDATE employees
         SET firstname = ?, lastname = ?, email = ?, phone = ?, address = ?, city = ?, zip = ?, notes = ?, active = ?
         WHERE id = ? AND tenant_id = ?`,
        [
          firstname || null,
          lastname || null,
          email || null,
          phone || null,
          address || null,
          city || null,
          zip || null,
          notes || null,
          active === undefined ? 1 : !!active,
          id,
          req.user.tenant_id
        ]
      );
      return res.json({ id });
    }

    const newId = randomUUID();
    await pool.query(
      `INSERT INTO employees (id, tenant_id, firstname, lastname, email, phone, address, city, zip, notes, active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        newId,
        req.user.tenant_id,
        firstname || null,
        lastname || null,
        email || null,
        phone || null,
        address || null,
        city || null,
        zip || null,
        notes || null,
        active === undefined ? 1 : !!active
      ]
    );
    res.json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.delete('/employees/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM employees WHERE id = ? AND tenant_id = ?', [req.params.id, req.user.tenant_id]);
    res.json({ deletionType: 'both' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
