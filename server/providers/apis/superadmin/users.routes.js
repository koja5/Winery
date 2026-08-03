const express = require('express');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

router.get('/users', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, u.active, u.verified, u.two_factor_enabled,
              u.created_at, r.code as role_code, t.name as tenant_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN tenants t ON t.id = u.tenant_id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const { id, active } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'id je obavezan.' });
    }
    await pool.query('UPDATE users SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
    res.json({ id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
