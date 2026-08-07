const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

router.get('/customers', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE tenant_id = ? ORDER BY name ASC', [
      req.user.tenant_id
    ]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/customers', async (req, res, next) => {
  try {
    const { id, name, pib_or_jmbg, mb, email, phone, address, city, zip, notes, active } = req.body;

    if (id) {
      await pool.query(
        `UPDATE customers
         SET name = ?, pib_or_jmbg = ?, mb = ?, email = ?, phone = ?, address = ?, city = ?, zip = ?, notes = ?, active = ?
         WHERE id = ? AND tenant_id = ?`,
        [
          name,
          pib_or_jmbg || null,
          mb || null,
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
      `INSERT INTO customers (id, tenant_id, name, pib_or_jmbg, mb, email, phone, address, city, zip, notes, active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        newId,
        req.user.tenant_id,
        name,
        pib_or_jmbg || null,
        mb || null,
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

router.delete('/customers/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = ? AND tenant_id = ?', [req.params.id, req.user.tenant_id]);
    res.json({ deletionType: 'both' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
