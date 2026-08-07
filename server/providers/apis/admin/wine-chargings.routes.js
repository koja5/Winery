const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const validator = require('../../services/production-chain-validator');

const LIST_SQL = `
  SELECT wc.*, wa.wine_variety, wa.lot AS aging_lot, wa.vintage_year,
         (wc.number_of_bottles * wc.bottle_volume_ml / 1000) AS total_liters
  FROM wine_chargings wc
  JOIN wine_agings wa ON wa.id = wc.aging_id
  WHERE wc.tenant_id = ?
  ORDER BY wc.charging_date DESC
`;

router.get('/wine-chargings', async (req, res, next) => {
  try {
    const [rows] = await pool.query(LIST_SQL, [req.user.tenant_id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /wine-chargings -> flašira vino iz nege. body: { id?, aging_id,
// product_name, charging_date, number_of_bottles, bottle_volume_ml, lot }
// Nema validator.canEditWineCharging — količina flaširanja se tretira kao
// nepromenljiva istorijska činjenica nakon kreiranja (forma je disabledOnEdit
// za aging_id/number_of_bottles/bottle_volume_ml), edituju se samo opisna polja.
router.post('/wine-chargings', async (req, res, next) => {
  const tenantId = req.user.tenant_id;
  const { id, aging_id, product_name, charging_date, number_of_bottles, bottle_volume_ml, lot } = req.body;

  try {
    if (id) {
      await pool.query(
        'UPDATE wine_chargings SET product_name = ?, charging_date = ?, lot = ? WHERE id = ? AND tenant_id = ?',
        [product_name || null, charging_date, lot || null, id, tenantId]
      );
      return res.json({ id });
    }

    if (!aging_id || !charging_date || !number_of_bottles) {
      return res.status(400).json({ message: 'Nega, datum punjenja i broj boca su obavezni.' });
    }
    const volumeMl = bottle_volume_ml || 750;
    const liters = (Number(number_of_bottles) * Number(volumeMl)) / 1000;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[aging]] = await conn.query('SELECT * FROM wine_agings WHERE id = ? AND tenant_id = ? FOR UPDATE', [
        aging_id,
        tenantId
      ]);
      if (!aging) {
        throw Object.assign(new Error('Nega nije pronađena.'), { status: 404 });
      }
      if (Number(aging.quantity_liters_current) < liters) {
        throw Object.assign(
          new Error(
            `Nema dovoljno vina u nezi (dostupno ${aging.quantity_liters_current}L, traženo ${liters}L).`
          ),
          { status: 409 }
        );
      }
      await conn.query('UPDATE wine_agings SET quantity_liters_current = quantity_liters_current - ? WHERE id = ?', [
        liters,
        aging_id
      ]);

      const newId = randomUUID();
      await conn.query(
        `INSERT INTO wine_chargings (id, tenant_id, aging_id, product_name, charging_date, number_of_bottles, bottle_volume_ml, lot)
         VALUES (?,?,?,?,?,?,?,?)`,
        [newId, tenantId, aging_id, product_name || null, charging_date, number_of_bottles, volumeMl, lot || null]
      );

      await conn.commit();
      res.json({ id: newId });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /wine-chargings/:id -> vraća flaširanu količinu nezi iz koje potiče.
router.delete('/wine-chargings/:id', async (req, res, next) => {
  const tenantId = req.user.tenant_id;
  try {
    const check = await validator.canDeleteWineCharging(pool, req.params.id, tenantId);
    if (!check.canProceed) {
      return res.status(409).json({ message: check.message, ...check });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[charging]] = await conn.query('SELECT * FROM wine_chargings WHERE id = ? AND tenant_id = ?', [
        req.params.id,
        tenantId
      ]);
      const liters = (Number(charging.number_of_bottles) * Number(charging.bottle_volume_ml)) / 1000;

      await conn.query('UPDATE wine_agings SET quantity_liters_current = quantity_liters_current + ? WHERE id = ?', [
        liters,
        charging.aging_id
      ]);
      await conn.query('DELETE FROM wine_chargings WHERE id = ?', [charging.id]);

      await conn.commit();
      res.json({ deletionType: check.deletionType });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
