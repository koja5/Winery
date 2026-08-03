const express = require('express');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

router.get('/notifications', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, type, severity, title, message, action_url, is_read, created_at FROM notifications
       WHERE tenant_id = ? AND (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC LIMIT 30`,
      [req.user.tenant_id, req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/notifications/:id/read', async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ id: req.params.id, is_read: true });
  } catch (err) {
    next(err);
  }
});

router.post('/notifications/read-all', async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE tenant_id = ? AND (user_id = ? OR user_id IS NULL)',
      [req.user.tenant_id, req.user.sub]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
