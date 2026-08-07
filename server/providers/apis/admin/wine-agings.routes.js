const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const validator = require('../../services/production-chain-validator');

const LIST_SQL = `
  SELECT wa.id, wa.tenant_id, wa.vessel_id, wa.fermentation_id, wa.wine_variety, wa.vintage_year, wa.lot,
         wa.start_date, wa.end_date, wa.quantity_liters, wa.quantity_liters_current, wa.notes,
         wa.created_at, wa.updated_at,
         COALESCE(wa.name, CONCAT(
           COALESCE(wa.wine_variety, 'Vino'),
           IF(wa.vintage_year IS NOT NULL, CONCAT(' ', wa.vintage_year), ''),
           IF(wa.lot IS NOT NULL, CONCAT(' – ', wa.lot), '')
         )) AS name,
         v.name AS vessel_name,
         mf.wine_type AS source_wine_type
  FROM wine_agings wa
  JOIN wine_vessels v ON v.id = wa.vessel_id
  LEFT JOIN must_fermentations mf ON mf.id = wa.fermentation_id
  WHERE wa.tenant_id = ?
  ORDER BY wa.start_date DESC
`;

router.get('/wine-agings', async (req, res, next) => {
  try {
    const [rows] = await pool.query(LIST_SQL, [req.user.tenant_id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /wine-agings -> pretače (raca) vino iz fermentacije u posudu za negu.
// body: { id?, fermentation_id?, vessel_id, name, wine_variety, vintage_year,
// lot, start_date, end_date, quantity_liters_current, notes }
// `quantity_liters_current` je direktno editabilno polje (za razliku od
// fermentacije/prijema) — predstavlja trenutnu raspoloživu količinu u nezi.
router.post('/wine-agings', async (req, res, next) => {
  const tenantId = req.user.tenant_id;
  const { id, fermentation_id, vessel_id, name, wine_variety, vintage_year, lot, start_date, end_date, quantity_liters_current, notes } =
    req.body;

  try {
    if (id) {
      const check = await validator.canEditWineAging(pool, id, { vessel_id, fermentation_id, quantity_liters_current }, tenantId);
      if (!check.canProceed) {
        return res.status(409).json({ message: check.message, ...check });
      }

      await pool.query(
        `UPDATE wine_agings
         SET vessel_id = ?, fermentation_id = ?, name = ?, wine_variety = ?, vintage_year = ?, lot = ?,
             start_date = ?, end_date = ?, quantity_liters_current = ?, notes = ?
         WHERE id = ? AND tenant_id = ?`,
        [
          vessel_id,
          fermentation_id || null,
          name || null,
          wine_variety || null,
          vintage_year || null,
          lot || null,
          start_date,
          end_date || null,
          quantity_liters_current,
          notes || null,
          id,
          tenantId
        ]
      );
      return res.json({ id });
    }

    if (!vessel_id || !start_date || !quantity_liters_current) {
      return res.status(400).json({ message: 'Posuda, datum početka i količina su obavezni.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (fermentation_id) {
        const [[fermentation]] = await conn.query(
          'SELECT * FROM must_fermentations WHERE id = ? AND tenant_id = ? FOR UPDATE',
          [fermentation_id, tenantId]
        );
        if (!fermentation) {
          throw Object.assign(new Error('Fermentacija nije pronađena.'), { status: 404 });
        }
        if (Number(fermentation.quantity_liters_current) < Number(quantity_liters_current)) {
          throw Object.assign(
            new Error(
              `Nema dovoljno vina u fermentaciji (dostupno ${fermentation.quantity_liters_current}L, traženo ${quantity_liters_current}L).`
            ),
            { status: 409 }
          );
        }
        await conn.query('UPDATE must_fermentations SET quantity_liters_current = quantity_liters_current - ? WHERE id = ?', [
          quantity_liters_current,
          fermentation_id
        ]);
      }

      const newId = randomUUID();
      await conn.query(
        `INSERT INTO wine_agings
         (id, tenant_id, vessel_id, fermentation_id, name, wine_variety, vintage_year, lot, start_date, end_date, quantity_liters, quantity_liters_current, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          newId,
          tenantId,
          vessel_id,
          fermentation_id || null,
          name || null,
          wine_variety || null,
          vintage_year || null,
          lot || null,
          start_date,
          end_date || null,
          quantity_liters_current,
          quantity_liters_current,
          notes || null
        ]
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

// DELETE /wine-agings/:id -> vraća preostalu (nepotrošenu) količinu izvornoj
// fermentaciji (ako postoji) i kaskadno briše punjenja/pretoke ove nege.
router.delete('/wine-agings/:id', async (req, res, next) => {
  const tenantId = req.user.tenant_id;
  try {
    const check = await validator.canDeleteWineAging(pool, req.params.id, tenantId);
    if (!check.canProceed) {
      return res.status(409).json({ message: check.message, ...check });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[aging]] = await conn.query('SELECT * FROM wine_agings WHERE id = ? AND tenant_id = ?', [
        req.params.id,
        tenantId
      ]);

      await conn.query('DELETE FROM wine_chargings WHERE aging_id = ?', [aging.id]);
      await conn.query('DELETE FROM vessel_transfers WHERE aging_id = ?', [aging.id]);

      if (aging.fermentation_id) {
        await conn.query('UPDATE must_fermentations SET quantity_liters_current = quantity_liters_current + ? WHERE id = ?', [
          aging.quantity_liters_current,
          aging.fermentation_id
        ]);
      }

      await conn.query('DELETE FROM wine_agings WHERE id = ?', [aging.id]);

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
