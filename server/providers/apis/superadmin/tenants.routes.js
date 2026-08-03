const express = require('express');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

router.get('/tenants', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as users_count
       FROM tenants t ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/tenants', async (req, res, next) => {
  try {
    const { id, active, is_demo } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'id je obavezan.' });
    }
    await pool.query('UPDATE tenants SET active = ?, is_demo = ? WHERE id = ?', [
      active ? 1 : 0,
      is_demo ? 1 : 0,
      id
    ]);
    res.json({ id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
