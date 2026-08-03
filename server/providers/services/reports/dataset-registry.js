// Whitelisted dataset registry za dynamic reports. Frontend nikad ne šalje
// sirov SQL/kolone — bira samo dimenzije/metrike po ključu iz ovog registra.
// Isti obrazac kao eDestilerija (kind: 'sql', from/where/dateColumn +
// dimensions/metrics/drilldownColumns), sveden na 'sql' kind jer Faza 0 nema
// invoices/purchase datasetove.

const datasets = {
  grape_receptions: {
    label: 'reports.grapeReceptions.label',
    kind: 'sql',
    from: `FROM grape_receptions gr
           LEFT JOIN vineyard_parcels vp ON vp.id = gr.parcel_id
           LEFT JOIN suppliers s ON s.id = gr.supplier_id`,
    where: 'gr.tenant_id = ?',
    dateColumn: 'gr.reception_date',
    dimensions: {
      grape_variety: { label: 'reports.dim.grapeVariety', sql: 'gr.grape_variety' },
      parcel: { label: 'reports.dim.parcel', sql: 'vp.name' },
      supplier: { label: 'reports.dim.supplier', sql: 'COALESCE(s.name, gr.supplier_name)' }
    },
    metrics: {
      quantity_kg: { label: 'reports.metric.quantityKg', sql: 'ROUND(SUM(gr.quantity_kg), 2)' },
      avg_sugar_degrees: { label: 'reports.metric.avgSugarDegrees', sql: 'ROUND(AVG(gr.sugar_degrees), 2)' },
      receptions_count: { label: 'reports.metric.receptionsCount', sql: 'COUNT(*)' }
    },
    drilldownColumns: [
      { key: 'reception_date', label: 'reports.col.date', sql: 'gr.reception_date' },
      { key: 'grape_variety', label: 'reports.dim.grapeVariety', sql: 'gr.grape_variety' },
      { key: 'parcel', label: 'reports.dim.parcel', sql: 'vp.name' },
      { key: 'supplier', label: 'reports.dim.supplier', sql: 'COALESCE(s.name, gr.supplier_name)' },
      { key: 'quantity_kg', label: 'reports.metric.quantityKg', sql: 'gr.quantity_kg' },
      { key: 'sugar_degrees', label: 'reports.col.sugarDegrees', sql: 'gr.sugar_degrees' }
    ]
  },

  // Prinos fermentacije (grožđe -> vino u nezi). Jedna fermentacija (šarža)
  // može biti pretočena u više posuda za negu (wine_agings), pa se ulazna
  // količina grožđa alocira proporcionalno udelu svake nege u ukupnom izlazu
  // te fermentacije — isti "proportional-allocation" obrazac kao
  // soft_brandy_production/soft_brandy_redestillation u eDestileriji.
  // SUM(input_kg_allocated) po fermentaciji == pravi ukupan ulaz (bez
  // duplog računanja), pa je yield_pct tačan bez obzira koliko je nega
  // šarža proizvela.
  fermentation_yield: {
    label: 'reports.fermentationYield.label',
    kind: 'sql',
    from: `FROM (
             SELECT
               mf.id AS id_fermentation,
               mf.start_date AS creation_date,
               mf.tenant_id AS tenant_id,
               wa.id AS id_aging,
               wa.vessel_id AS id_vessel,
               wa.wine_variety AS wine_variety,
               wa.quantity_liters AS output_l,
               grp_sum.input_kg * (
                 wa.quantity_liters / NULLIF(agings_sum.output_l_total, 0)
               ) AS input_kg_allocated
             FROM must_fermentations mf
             JOIN wine_agings wa ON wa.fermentation_id = mf.id
             LEFT JOIN (
               SELECT grp.fermentation_id, SUM(grp.quantity_kg) AS input_kg
               FROM grape_reception_pressings grp GROUP BY grp.fermentation_id
             ) grp_sum ON grp_sum.fermentation_id = mf.id
             LEFT JOIN (
               SELECT wa2.fermentation_id, SUM(wa2.quantity_liters) AS output_l_total
               FROM wine_agings wa2 GROUP BY wa2.fermentation_id
             ) agings_sum ON agings_sum.fermentation_id = mf.id
           ) row
           LEFT JOIN wine_vessels v ON v.id = row.id_vessel`,
    where: 'row.tenant_id = ?',
    dateColumn: 'row.creation_date',
    dimensions: {
      wine_variety: { label: 'reports.dim.wineVariety', sql: 'row.wine_variety' },
      vessel: { label: 'reports.dim.vessel', sql: 'v.name' }
    },
    metrics: {
      input_kg: { label: 'reports.metric.inputKg', sql: 'ROUND(SUM(row.input_kg_allocated), 2)' },
      output_l: { label: 'reports.metric.outputL', sql: 'ROUND(SUM(row.output_l), 2)' },
      yield_pct: {
        label: 'reports.metric.yieldPct',
        sql: 'ROUND(SUM(row.output_l) / NULLIF(SUM(row.input_kg_allocated), 0) * 100, 2)'
      }
    },
    drilldownColumns: [
      { key: 'creation_date', label: 'reports.col.date', sql: 'row.creation_date' },
      { key: 'wine_variety', label: 'reports.dim.wineVariety', sql: 'row.wine_variety' },
      { key: 'vessel', label: 'reports.dim.vessel', sql: 'v.name' },
      { key: 'input_kg', label: 'reports.metric.inputKg', sql: 'ROUND(row.input_kg_allocated, 2)' },
      { key: 'output_l', label: 'reports.metric.outputL', sql: 'ROUND(row.output_l, 2)' }
    ]
  },

  // Iskorišćenost kapaciteta posuda — trenutno stanje (nema dateColumn, pa
  // query-engine preskače filter po datumu i uvek vraća "sad").
  capacity_utilization: {
    label: 'reports.capacityUtilization.label',
    kind: 'sql',
    from: `FROM wine_vessels v
           LEFT JOIN must_fermentations f ON f.vessel_id = v.id AND f.status = 'in_progress'
           LEFT JOIN wine_agings a ON a.vessel_id = v.id AND a.quantity_liters_current > 0`,
    where: 'v.tenant_id = ?',
    dimensions: {
      vessel: { label: 'reports.dim.vessel', sql: 'v.name' },
      vessel_type: { label: 'reports.dim.vesselType', sql: 'v.vessel_type' }
    },
    metrics: {
      capacity_liters: { label: 'reports.metric.capacityLiters', sql: 'ROUND(SUM(v.capacity_liters), 2)' },
      current_liters: {
        label: 'reports.metric.currentLiters',
        sql: 'ROUND(SUM(COALESCE(f.quantity_liters_current, a.quantity_liters_current, 0)), 2)'
      },
      utilization_pct: {
        label: 'reports.metric.utilizationPct',
        sql: 'ROUND(SUM(COALESCE(f.quantity_liters_current, a.quantity_liters_current, 0)) / NULLIF(SUM(v.capacity_liters), 0) * 100, 2)'
      }
    },
    drilldownColumns: [
      { key: 'vessel', label: 'reports.dim.vessel', sql: 'v.name' },
      { key: 'vessel_type', label: 'reports.dim.vesselType', sql: 'v.vessel_type' },
      { key: 'capacity_liters', label: 'reports.metric.capacityLiters', sql: 'v.capacity_liters' },
      {
        key: 'current_liters',
        label: 'reports.metric.currentLiters',
        sql: 'COALESCE(f.quantity_liters_current, a.quantity_liters_current, 0)'
      }
    ]
  },

  // Gubici tokom nege (isparavanje i sl.): initial - trenutno - flaширано.
  // Uprošćeno za MVP — ne modeluje zapreminu dodatu naknadnim pretocima u
  // ovu negu, samo prirodni pad polazne količine.
  aging_losses: {
    label: 'reports.agingLosses.label',
    kind: 'sql',
    from: `FROM (
             SELECT
               a.id, a.tenant_id, a.start_date AS creation_date, a.wine_variety, a.vessel_id,
               a.quantity_liters AS initial_liters,
               a.quantity_liters_current AS current_liters,
               COALESCE(ch.bottled_liters, 0) AS bottled_liters,
               (a.quantity_liters - a.quantity_liters_current - COALESCE(ch.bottled_liters, 0)) AS loss_liters
             FROM wine_agings a
             LEFT JOIN (
               SELECT aging_id, SUM(number_of_bottles * bottle_volume_ml / 1000) AS bottled_liters
               FROM wine_chargings GROUP BY aging_id
             ) ch ON ch.aging_id = a.id
           ) row
           LEFT JOIN wine_vessels v ON v.id = row.vessel_id`,
    where: 'row.tenant_id = ?',
    dateColumn: 'row.creation_date',
    dimensions: {
      wine_variety: { label: 'reports.dim.wineVariety', sql: 'row.wine_variety' },
      vessel: { label: 'reports.dim.vessel', sql: 'v.name' }
    },
    metrics: {
      initial_liters: { label: 'reports.metric.initialLiters', sql: 'ROUND(SUM(row.initial_liters), 2)' },
      loss_liters: { label: 'reports.metric.lossLiters', sql: 'ROUND(SUM(row.loss_liters), 2)' },
      loss_pct: {
        label: 'reports.metric.lossPct',
        sql: 'ROUND(SUM(row.loss_liters) / NULLIF(SUM(row.initial_liters), 0) * 100, 2)'
      }
    },
    drilldownColumns: [
      { key: 'creation_date', label: 'reports.col.date', sql: 'row.creation_date' },
      { key: 'wine_variety', label: 'reports.dim.wineVariety', sql: 'row.wine_variety' },
      { key: 'vessel', label: 'reports.dim.vessel', sql: 'v.name' },
      { key: 'initial_liters', label: 'reports.metric.initialLiters', sql: 'row.initial_liters' },
      { key: 'loss_liters', label: 'reports.metric.lossLiters', sql: 'row.loss_liters' }
    ]
  },

  // T2.7: obračuni berbe i isplate dobavljačima — koliko duguje/plaćeno po dobavljaču/periodu.
  harvest_settlements: {
    label: 'reports.harvestSettlements.label',
    kind: 'sql',
    from: `FROM harvest_settlements hs
           LEFT JOIN suppliers s ON s.id = hs.supplier_id
           LEFT JOIN (
             SELECT settlement_id, SUM(amount) AS paid_amount
             FROM harvest_settlement_payments GROUP BY settlement_id
           ) p ON p.settlement_id = hs.id`,
    where: 'hs.tenant_id = ?',
    dateColumn: 'hs.settlement_date',
    dimensions: {
      supplier: { label: 'reports.dim.supplier', sql: 's.name' },
      status: { label: 'reports.dim.status', sql: 'hs.status' }
    },
    metrics: {
      total_amount: { label: 'reports.metric.totalAmount', sql: 'ROUND(SUM(hs.total_amount), 2)' },
      paid_amount: { label: 'reports.metric.paidAmount', sql: 'ROUND(SUM(COALESCE(p.paid_amount, 0)), 2)' },
      balance_due: {
        label: 'reports.metric.balanceDue',
        sql: 'ROUND(SUM(hs.total_amount - COALESCE(p.paid_amount, 0)), 2)'
      }
    },
    drilldownColumns: [
      { key: 'settlement_date', label: 'reports.col.date', sql: 'hs.settlement_date' },
      { key: 'supplier', label: 'reports.dim.supplier', sql: 's.name' },
      { key: 'total_amount', label: 'reports.metric.totalAmount', sql: 'hs.total_amount' },
      { key: 'paid_amount', label: 'reports.metric.paidAmount', sql: 'COALESCE(p.paid_amount, 0)' },
      { key: 'status', label: 'reports.dim.status', sql: 'hs.status' }
    ]
  },

  // T2.6: obračun troškova proizvodnje vina — trošak grožđa (iz obračuna berbe)
  // alociran proporcionalno na nege, isti "proportional-allocation" obrazac
  // kao fermentation_yield iznad (i soft_brandy_production u eDestileriji):
  // trošak fermentacije se deli među negama po udelu njihove zapremine u
  // ukupnom izlazu te fermentacije, pa SUM(cost_allocated) po fermentaciji
  // ostaje tačan bez obzira na broj nega. Prijemi koji još nisu obračunati
  // (nema harvest_settlement_receptions zapisa) doprinose trošak 0, ne NULL,
  // da ne bi obarali zbir za već obračunate partije u istoj šarži.
  wine_production_cost: {
    label: 'reports.wineProductionCost.label',
    kind: 'sql',
    from: `FROM (
             SELECT
               mf.id AS id_fermentation,
               mf.start_date AS creation_date,
               mf.tenant_id AS tenant_id,
               wa.id AS id_aging,
               wa.vessel_id AS id_vessel,
               wa.wine_variety AS wine_variety,
               wa.quantity_liters AS output_l,
               fc.input_cost * (
                 wa.quantity_liters / NULLIF(agings_sum.output_l_total, 0)
               ) AS cost_allocated
             FROM must_fermentations mf
             JOIN wine_agings wa ON wa.fermentation_id = mf.id
             LEFT JOIN (
               SELECT grp.fermentation_id, SUM(grp.quantity_kg * COALESCE(rc.price_per_kg, 0)) AS input_cost
               FROM grape_reception_pressings grp
               LEFT JOIN (
                 SELECT hsr.reception_id, hs.price_per_kg
                 FROM harvest_settlement_receptions hsr
                 JOIN harvest_settlements hs ON hs.id = hsr.settlement_id
               ) rc ON rc.reception_id = grp.reception_id
               GROUP BY grp.fermentation_id
             ) fc ON fc.fermentation_id = mf.id
             LEFT JOIN (
               SELECT wa2.fermentation_id, SUM(wa2.quantity_liters) AS output_l_total
               FROM wine_agings wa2 GROUP BY wa2.fermentation_id
             ) agings_sum ON agings_sum.fermentation_id = mf.id
           ) row
           LEFT JOIN wine_vessels v ON v.id = row.id_vessel`,
    where: 'row.tenant_id = ?',
    dateColumn: 'row.creation_date',
    dimensions: {
      wine_variety: { label: 'reports.dim.wineVariety', sql: 'row.wine_variety' },
      vessel: { label: 'reports.dim.vessel', sql: 'v.name' }
    },
    metrics: {
      cost_total: { label: 'reports.metric.costTotal', sql: 'ROUND(SUM(row.cost_allocated), 2)' },
      output_l: { label: 'reports.metric.outputL', sql: 'ROUND(SUM(row.output_l), 2)' },
      cost_per_liter: {
        label: 'reports.metric.costPerLiter',
        sql: 'ROUND(SUM(row.cost_allocated) / NULLIF(SUM(row.output_l), 0), 4)'
      }
    },
    drilldownColumns: [
      { key: 'creation_date', label: 'reports.col.date', sql: 'row.creation_date' },
      { key: 'wine_variety', label: 'reports.dim.wineVariety', sql: 'row.wine_variety' },
      { key: 'vessel', label: 'reports.dim.vessel', sql: 'v.name' },
      { key: 'cost_total', label: 'reports.metric.costTotal', sql: 'ROUND(row.cost_allocated, 2)' },
      { key: 'output_l', label: 'reports.metric.outputL', sql: 'row.output_l' }
    ]
  }
};

function get(name) {
  return datasets[name];
}

function list() {
  return Object.entries(datasets).map(([name, ds]) => ({
    name,
    label: ds.label,
    dimensions: Object.fromEntries(Object.entries(ds.dimensions).map(([k, v]) => [k, { label: v.label }])),
    metrics: Object.fromEntries(Object.entries(ds.metrics).map(([k, v]) => [k, { label: v.label }])),
    hasDateRange: !!ds.dateColumn
  }));
}

module.exports = { get, list };
