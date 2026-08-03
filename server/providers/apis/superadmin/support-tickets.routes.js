const express = require('express');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

router.get('/support-tickets', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT st.*, t.name as tenant_name, u.email as user_email
       FROM support_tickets st
       LEFT JOIN tenants t ON t.id = st.tenant_id
       LEFT JOIN users u ON u.id = st.user_id
       ORDER BY st.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/support-tickets', async (req, res, next) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ message: 'id i status su obavezni.' });
    }
    await pool.query('UPDATE support_tickets SET status = ? WHERE id = ?', [status, id]);
    res.json({ id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
