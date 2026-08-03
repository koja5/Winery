const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();

const NUMERIC_FIELDS = [
  'alcohol_pct',
  'density',
  'ph',
  'total_acidity',
  'volatile_acidity',
  'residual_sugar',
  'reducing_sugars',
  'co2',
  'free_so2',
  'total_so2',
  'bound_so2',
  'tartaric_acid',
  'malic_acid',
  'lactic_acid',
  'citric_acid',
  'acetic_acid',
  'total_extract',
  'dry_extract',
  'sugar_free_extract',
  'ash',
  'alkalinity_of_ash',
  'glycerol',
  'total_polyphenols',
  'total_anthocyanins',
  'total_tannins',
  'color_intensity',
  'color_hue',
  'potassium',
  'sodium',
  'calcium',
  'iron',
  'copper',
  'chlorides',
  'sulphates',
  'methanol',
  'acetaldehyde'
];

const ALL_FIELDS = ['vessel_id', 'aging_id', 'fermentation_id', 'sample_date', 'lab_name', ...NUMERIC_FIELDS, 'notes'];

router.get('/wine-analyses', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, v.name AS vessel_name
       FROM wine_analyses a
       JOIN wine_vessels v ON v.id = a.vessel_id
       WHERE a.tenant_id = ?
       ORDER BY a.sample_date DESC, a.created_at DESC`,
      [req.user.tenant_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/wine-analyses', async (req, res, next) => {
  try {
    const { id } = req.body;
    const values = ALL_FIELDS.map((field) => (req.body[field] === undefined ? null : req.body[field]));

    if (id) {
      const setClause = ALL_FIELDS.map((f) => `${f} = ?`).join(', ');
      await pool.query(`UPDATE wine_analyses SET ${setClause} WHERE id = ? AND tenant_id = ?`, [
        ...values,
        id,
        req.user.tenant_id
      ]);
      return res.json({ id });
    }

    const newId = randomUUID();
    const columns = ['id', 'tenant_id', ...ALL_FIELDS];
    const placeholders = columns.map(() => '?').join(',');
    await pool.query(`INSERT INTO wine_analyses (${columns.join(',')}) VALUES (${placeholders})`, [
      newId,
      req.user.tenant_id,
      ...values
    ]);
    res.json({ id: newId });
  } catch (err) {
    next(err);
  }
});

router.delete('/wine-analyses/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM wine_analyses WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
