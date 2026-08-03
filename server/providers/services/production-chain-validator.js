/**
 * Production Chain Validator za vino
 * Validira delete/edit operacije kroz lanac:
 * grape_receptions -> must_fermentations -> wine_agings -> wine_chargings
 * (i vessel_transfers/wine_vessels kao prateća stanja)
 *
 * Isti obrazac kao eDestilerija production-chain-validator: svaka provera vraća
 * { canProceed, message, deletionType, affectedEntities, warnings } za delete,
 * ili { canProceed, message, allowedFields, blockedFields, warnings } za edit.
 * deletionType: 'none' | 'soft-only' | 'cascade' | 'both'.
 */
class WineProductionChainValidator {
  async _countRelatedRecords(pool, table, foreignKey, id) {
    const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table} WHERE ${foreignKey} = ?`, [id]);
    return rows[0].count;
  }

  // ---------------------------------------------------------------------
  // DELETE checks
  // ---------------------------------------------------------------------

  async canDeleteGrapeReception(pool, id, tenantId) {
    const [rows] = await pool.query('SELECT * FROM grape_receptions WHERE id = ? AND tenant_id = ?', [
      id,
      tenantId
    ]);
    if (!rows.length) {
      return this._notFound();
    }
    const reception = rows[0];

    const [consumedRows] = await pool.query(
      'SELECT COALESCE(SUM(quantity_kg), 0) as consumed FROM grape_reception_pressings WHERE reception_id = ?',
      [id]
    );
    const consumedQuantity = Number(consumedRows[0].consumed);

    if (consumedQuantity === 0) {
      return {
        canProceed: true,
        message: 'productionChain.canSafelyDelete',
        deletionType: 'both',
        affectedEntities: {},
        warnings: []
      };
    }

    const fermentationCount = await this._countRelatedRecords(
      pool,
      'grape_reception_pressings',
      'reception_id',
      id
    );

    return {
      canProceed: true,
      message: 'productionChain.cascadeDeleteRequired',
      deletionType: 'cascade',
      name: reception.grape_variety || reception.supplier_name,
      affectedEntities: { fermentations: fermentationCount, consumedQuantityKg: consumedQuantity },
      warnings: ['productionChain.warningCascadeDeleteAll']
    };
  }

  async canDeleteMustFermentation(pool, id, tenantId) {
    const [rows] = await pool.query('SELECT * FROM must_fermentations WHERE id = ? AND tenant_id = ?', [
      id,
      tenantId
    ]);
    if (!rows.length) {
      return this._notFound();
    }

    const agingCount = await this._countRelatedRecords(pool, 'wine_agings', 'fermentation_id', id);

    if (agingCount === 0) {
      return {
        canProceed: true,
        message: 'productionChain.canSafelyDelete',
        deletionType: 'both',
        affectedEntities: {},
        warnings: []
      };
    }

    const chainInfo = await this._getFermentationChainInfo(pool, id);

    return {
      canProceed: true,
      message: 'productionChain.cascadeDeleteRequired',
      deletionType: 'cascade',
      affectedEntities: chainInfo,
      warnings: ['productionChain.warningCascadeDeleteAll']
    };
  }

  async canDeleteWineAging(pool, id, tenantId) {
    const [rows] = await pool.query('SELECT * FROM wine_agings WHERE id = ? AND tenant_id = ?', [
      id,
      tenantId
    ]);
    if (!rows.length) {
      return this._notFound();
    }

    const chargingCount = await this._countRelatedRecords(pool, 'wine_chargings', 'aging_id', id);
    const transferCount = await this._countRelatedRecords(pool, 'vessel_transfers', 'aging_id', id);

    if (chargingCount > 0) {
      return {
        canProceed: true,
        message: 'productionChain.cascadeDeleteRequired',
        deletionType: 'cascade',
        affectedEntities: { chargings: chargingCount, transfers: transferCount },
        warnings: ['productionChain.warningAlreadyBottled', 'productionChain.warningCascadeDeleteAll']
      };
    }

    if (transferCount > 0) {
      return {
        canProceed: true,
        message: 'productionChain.hasTransferHistory',
        deletionType: 'soft-only',
        affectedEntities: { transfers: transferCount },
        warnings: ['productionChain.warningSoftDeletionPreservesHistory']
      };
    }

    return {
      canProceed: true,
      message: 'productionChain.canSafelyDelete',
      deletionType: 'both',
      affectedEntities: {},
      warnings: []
    };
  }

  async canDeleteWineCharging(pool, id, tenantId) {
    const [rows] = await pool.query('SELECT id FROM wine_chargings WHERE id = ? AND tenant_id = ?', [
      id,
      tenantId
    ]);
    if (!rows.length) {
      return this._notFound();
    }
    return {
      canProceed: true,
      message: 'productionChain.canSafelyDelete',
      deletionType: 'both',
      affectedEntities: {},
      warnings: []
    };
  }

  async canDeleteWineVessel(pool, id, tenantId) {
    const [rows] = await pool.query('SELECT * FROM wine_vessels WHERE id = ? AND tenant_id = ?', [
      id,
      tenantId
    ]);
    if (!rows.length) {
      return this._notFound();
    }

    const [activeFermentations] = await pool.query(
      "SELECT COUNT(*) as count FROM must_fermentations WHERE vessel_id = ? AND status = 'in_progress'",
      [id]
    );
    if (activeFermentations[0].count > 0) {
      return {
        canProceed: false,
        message: 'productionChain.vesselCurrentlyFermenting',
        deletionType: 'none',
        affectedEntities: { activeFermentations: activeFermentations[0].count },
        warnings: []
      };
    }

    const [activeAgings] = await pool.query(
      'SELECT COUNT(*) as count FROM wine_agings WHERE vessel_id = ? AND quantity_liters_current > 0',
      [id]
    );
    if (activeAgings[0].count > 0) {
      return {
        canProceed: false,
        message: 'productionChain.vesselCurrentlyHoldingWine',
        deletionType: 'none',
        affectedEntities: { activeAgings: activeAgings[0].count },
        warnings: []
      };
    }

    const historicalFermentations = await this._countRelatedRecords(pool, 'must_fermentations', 'vessel_id', id);
    const historicalAgings = await this._countRelatedRecords(pool, 'wine_agings', 'vessel_id', id);
    const [transferRefs] = await pool.query(
      'SELECT COUNT(*) as count FROM vessel_transfers WHERE from_vessel_id = ? OR to_vessel_id = ?',
      [id, id]
    );

    const hasHistory = historicalFermentations > 0 || historicalAgings > 0 || transferRefs[0].count > 0;

    if (hasHistory) {
      return {
        canProceed: true,
        message: 'productionChain.hasTransferHistory',
        deletionType: 'soft-only',
        affectedEntities: {
          fermentations: historicalFermentations,
          agings: historicalAgings,
          transfers: transferRefs[0].count
        },
        warnings: ['productionChain.warningSoftDeletionPreservesHistory']
      };
    }

    return {
      canProceed: true,
      message: 'productionChain.canSafelyDelete',
      deletionType: 'both',
      affectedEntities: {},
      warnings: []
    };
  }

  // ---------------------------------------------------------------------
  // EDIT checks
  // ---------------------------------------------------------------------

  async canEditGrapeReception(pool, id, changes, tenantId) {
    const [rows] = await pool.query('SELECT * FROM grape_receptions WHERE id = ? AND tenant_id = ?', [
      id,
      tenantId
    ]);
    if (!rows.length) {
      return this._notFoundEdit();
    }
    const reception = rows[0];

    const [consumedRows] = await pool.query(
      'SELECT COALESCE(SUM(quantity_kg), 0) as consumed FROM grape_reception_pressings WHERE reception_id = ?',
      [id]
    );
    const consumedQuantity = Number(consumedRows[0].consumed);

    const blockedFields = [];
    const criticalFields = ['parcel_id', 'grape_variety'];

    if (consumedQuantity > 0) {
      if (changes.quantity_kg !== undefined && changes.quantity_kg < consumedQuantity) {
        blockedFields.push({
          field: 'quantity_kg',
          currentValue: reception.quantity_kg,
          proposedValue: changes.quantity_kg,
          reason: `Nova količina (${changes.quantity_kg}kg) ne može biti manja od već preuzete količine (${consumedQuantity}kg).`
        });
      }
      criticalFields.forEach((field) => {
        if (changes[field] !== undefined && changes[field] !== reception[field]) {
          blockedFields.push({
            field,
            currentValue: reception[field],
            proposedValue: changes[field],
            reason: 'Ovo polje se ne može menjati jer je partija već delimično prerađena (fermentacija u toku).'
          });
        }
      });
    }

    return this._buildEditResult(changes, blockedFields);
  }

  async canEditMustFermentation(pool, id, changes, tenantId) {
    const [rows] = await pool.query('SELECT * FROM must_fermentations WHERE id = ? AND tenant_id = ?', [
      id,
      tenantId
    ]);
    if (!rows.length) {
      return this._notFoundEdit();
    }
    const fermentation = rows[0];

    const [consumedRows] = await pool.query(
      'SELECT COALESCE(SUM(quantity_liters), 0) as consumed FROM wine_agings WHERE fermentation_id = ?',
      [id]
    );
    const consumedQuantity = Number(consumedRows[0].consumed);

    const blockedFields = [];
    const criticalFields = ['vessel_id', 'wine_type'];

    if (consumedQuantity > 0) {
      if (changes.quantity_liters !== undefined && changes.quantity_liters < consumedQuantity) {
        blockedFields.push({
          field: 'quantity_liters',
          currentValue: fermentation.quantity_liters,
          proposedValue: changes.quantity_liters,
          reason: `Nova količina (${changes.quantity_liters}L) ne može biti manja od već pretočene količine u nege (${consumedQuantity}L).`
        });
      }
      criticalFields.forEach((field) => {
        if (changes[field] !== undefined && changes[field] !== fermentation[field]) {
          blockedFields.push({
            field,
            currentValue: fermentation[field],
            proposedValue: changes[field],
            reason: 'Ovo polje se ne može menjati jer je vino iz ove fermentacije već pretočeno u nege.'
          });
        }
      });
    }

    return this._buildEditResult(changes, blockedFields);
  }

  async canEditWineAging(pool, id, changes, tenantId) {
    const [rows] = await pool.query('SELECT * FROM wine_agings WHERE id = ? AND tenant_id = ?', [
      id,
      tenantId
    ]);
    if (!rows.length) {
      return this._notFoundEdit();
    }
    const aging = rows[0];

    const [chargingRows] = await pool.query(
      `SELECT COALESCE(SUM(number_of_bottles * bottle_volume_ml / 1000), 0) as bottled_liters
       FROM wine_chargings WHERE aging_id = ?`,
      [id]
    );
    const bottledLiters = Number(chargingRows[0].bottled_liters);

    const blockedFields = [];
    const criticalFields = ['vessel_id', 'fermentation_id'];

    if (bottledLiters > 0) {
      if (changes.quantity_liters_current !== undefined && changes.quantity_liters_current < bottledLiters) {
        blockedFields.push({
          field: 'quantity_liters_current',
          currentValue: aging.quantity_liters_current,
          proposedValue: changes.quantity_liters_current,
          reason: `Nova količina (${changes.quantity_liters_current}L) ne može biti manja od već flaširane količine (${bottledLiters}L).`
        });
      }
      criticalFields.forEach((field) => {
        if (changes[field] !== undefined && changes[field] !== aging[field]) {
          blockedFields.push({
            field,
            currentValue: aging[field],
            proposedValue: changes[field],
            reason: 'Ovo polje se ne može menjati jer je vino iz ove nege već flaširano.'
          });
        }
      });
    }

    return this._buildEditResult(changes, blockedFields);
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  async _getFermentationChainInfo(pool, fermentationId) {
    const [agings] = await pool.query('SELECT id FROM wine_agings WHERE fermentation_id = ?', [
      fermentationId
    ]);
    let chargings = 0;
    let transfers = 0;
    for (const aging of agings) {
      chargings += await this._countRelatedRecords(pool, 'wine_chargings', 'aging_id', aging.id);
      transfers += await this._countRelatedRecords(pool, 'vessel_transfers', 'aging_id', aging.id);
    }
    return { agings: agings.length, chargings, transfers };
  }

  _buildEditResult(changes, blockedFields) {
    return {
      canProceed: blockedFields.length === 0,
      message:
        blockedFields.length === 0
          ? 'productionChain.allChangesAllowed'
          : 'productionChain.someFieldsBlocked',
      allowedFields: Object.keys(changes).filter((f) => !blockedFields.some((bf) => bf.field === f)),
      blockedFields,
      warnings: []
    };
  }

  _notFound() {
    return {
      canProceed: false,
      message: 'productionChain.notFoundOrAccessDenied',
      deletionType: 'none',
      affectedEntities: {},
      warnings: []
    };
  }

  _notFoundEdit() {
    return {
      canProceed: false,
      message: 'productionChain.notFoundOrAccessDenied',
      allowedFields: [],
      blockedFields: [],
      warnings: []
    };
  }
}

module.exports = new WineProductionChainValidator();
