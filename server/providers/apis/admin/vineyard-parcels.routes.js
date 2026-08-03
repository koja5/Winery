const express = require('express');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

// Minimalan endpoint za parcel_id combobox-e (berba, prijem). Puni CRUD grid
// za parcele je van obima Faze 2 — vodi se kao T3.1 u Fazi 3 (vinograd).
router.get('/vineyard-parcels', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name FROM vineyard_parcels WHERE tenant_id = ? AND active = 1 ORDER BY name ASC',
      [req.user.tenant_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
