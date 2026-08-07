const express = require('express');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

router.get('/tenant', async (req, res, next) => {
  try {
    const [[tenant]] = await pool.query('SELECT * FROM tenants WHERE id = ?', [req.user.tenant_id]);
    if (!tenant) {
      return res.status(404).json({ message: 'Vinarija nije pronađena.' });
    }
    res.json(tenant);
  } catch (err) {
    next(err);
  }
});

router.put('/tenant', async (req, res, next) => {
  try {
    const { name, pib, mb, email, phone, address, zip, city, responsible_person, bank_account } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Naziv vinarije je obavezan.' });
    }

    await pool.query(
      `UPDATE tenants
       SET name = ?, pib = ?, mb = ?, email = ?, phone = ?, address = ?, zip = ?, city = ?,
           responsible_person = ?, bank_account = ?
       WHERE id = ?`,
      [
        name,
        pib || null,
        mb || null,
        email || null,
        phone || null,
        address || null,
        zip || null,
        city || null,
        responsible_person || null,
        bank_account || null,
        req.user.tenant_id
      ]
    );
    res.json({ id: req.user.tenant_id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
