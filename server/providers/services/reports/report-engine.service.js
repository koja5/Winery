const registry = require('./dataset-registry');
const { runSqlDataset, drilldownSqlDataset } = require('./query-engine');

class ReportEngineService {
  listDatasets() {
    return registry.list();
  }

  async run(pool, datasetName, request, tenantId) {
    const ds = this._getDatasetOrThrow(datasetName);
    const dimensions = this._whitelist(request.dimensions, ds.dimensions);
    const metrics = this._whitelist(request.metrics, ds.metrics);

    if (!metrics.length) {
      this._badRequest('Bar jedna metrika je obavezna.');
    }

    return runSqlDataset(pool, ds, {
      dimensions,
      metrics,
      period: this._validPeriod(request.period),
      from: request.from,
      to: request.to,
      tenantId
    });
  }

  async drilldown(pool, datasetName, request, tenantId) {
    const ds = this._getDatasetOrThrow(datasetName);
    const dimensionValues = {};
    for (const [key, value] of Object.entries(request.dimensionValues || {})) {
      if (ds.dimensions[key]) dimensionValues[key] = value;
    }

    return drilldownSqlDataset(pool, ds, {
      dimensionValues,
      period: this._validPeriod(request.period),
      periodValue: request.periodValue,
      from: request.from,
      to: request.to,
      tenantId
    });
  }

  _getDatasetOrThrow(name) {
    const ds = registry.get(name);
    if (!ds) {
      const err = new Error(`Nepoznat dataset: ${name}`);
      err.status = 404;
      throw err;
    }
    return ds;
  }

  _whitelist(requested, allowed) {
    if (!Array.isArray(requested)) return [];
    return requested.filter((key) => Object.hasOwn(allowed, key));
  }

  _validPeriod(period) {
    return ['day', 'month', 'quarter', 'year'].includes(period) ? period : null;
  }

  _badRequest(message) {
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
}

module.exports = new ReportEngineService();
