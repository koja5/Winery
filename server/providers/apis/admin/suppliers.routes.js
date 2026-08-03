const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const validator = require('../../services/production-chain-validator');

router.get('/suppliers', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM suppliers WHERE tenant_id = ? ORDER BY name ASC',
      [req.user.tenant_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/suppliers', async (req, res, next) => {
  try {
    const { id, name, contact_person, phone, email, address, notes } = req.body;

    if (id) {
      await pool.query(
        'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, notes = ? WHERE id = ? AND tenant_id = ?',
        [name, contact_person, phone, email, address, notes, id, req.user.tenant_id]
      );
      return res.json({ id });
    }

    const newId = randomUUID();
    await pool.query(
      'INSERT INTO suppliers (id, tenant_id, name, contact_person, phone, email, address, notes) VALUES (?,?,?,?,?,?,?,?)',
      [newId, req.user.tenant_id, name, contact_person, phone, email, address, notes]
    );
    res.json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.delete('/suppliers/:id', async (req, res, next) => {
  try {
    const check = await validator.canDeleteSupplier(pool, req.params.id, req.user.tenant_id);
    if (!check.canProceed) {
      return res.status(409).json({ message: check.message, ...check });
    }
    if (check.deletionType === 'cascade') {
      await pool.query('DELETE FROM harvest_announcements WHERE supplier_id = ? AND tenant_id = ?', [
        req.params.id,
        req.user.tenant_id
      ]);
    }
    await pool.query('DELETE FROM suppliers WHERE id = ? AND tenant_id = ?', [req.params.id, req.user.tenant_id]);
    res.json({ deletionType: check.deletionType });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
