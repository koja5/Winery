require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('./providers/config/logger');
const authenticateToken = require('./providers/helpers/authenticate-token');
const requireRole = require('./providers/helpers/require-role');

//#region providers
const general = require('./providers/apis/general');
const auth = require('./providers/apis/auth.routes');
const wineVessels = require('./providers/apis/admin/wine-vessels.routes');
const vesselTransfers = require('./providers/apis/admin/vessel-transfers.routes');
const wineBlends = require('./providers/apis/admin/wine-blends.routes');
const fermentations = require('./providers/apis/admin/fermentations.routes');
const wineAgings = require('./providers/apis/admin/wine-agings.routes');
const wineChargings = require('./providers/apis/admin/wine-chargings.routes');
const profile = require('./providers/apis/admin/profile.routes');
const tenantProfile = require('./providers/apis/admin/tenant-profile.routes');
const enologicalAdditions = require('./providers/apis/admin/enological-additions.routes');
const wineAnalyses = require('./providers/apis/admin/wine-analyses.routes');
const workOrders = require('./providers/apis/admin/work-orders.routes');
const documents = require('./providers/apis/admin/documents.routes');
const reports = require('./providers/apis/admin/reports.routes');
const suppliers = require('./providers/apis/admin/suppliers.routes');
const customers = require('./providers/apis/admin/customers.routes');
const employees = require('./providers/apis/admin/employees.routes');
const harvestAnnouncements = require('./providers/apis/admin/harvest-announcements.routes');
const grapeReceptions = require('./providers/apis/admin/grape-receptions.routes');
const harvestSettlements = require('./providers/apis/admin/harvest-settlements.routes');
const vineyardParcels = require('./providers/apis/admin/vineyard-parcels.routes');
const parcelTreatments = require('./providers/apis/admin/parcel-treatments.routes');
const vineyardWorkOrders = require('./providers/apis/admin/vineyard-work-orders.routes');
const soilAnalyses = require('./providers/apis/admin/soil-analyses.routes');
const ndvi = require('./providers/apis/admin/ndvi.routes');
const search = require('./providers/apis/admin/search.routes');
const notifications = require('./providers/apis/admin/notifications.routes');
const superadminTenants = require('./providers/apis/superadmin/tenants.routes');
const superadminUsers = require('./providers/apis/superadmin/users.routes');
const superadminTickets = require('./providers/apis/superadmin/support-tickets.routes');
//#endregion

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    credentials: true
  })
);

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(bodyParser.json({ limit: '25mb' }));
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));
app.use(cookieParser());

//#region routes
app.use('/api', general);
app.use('/api/auth', auth);
app.use('/api/admin', authenticateToken, wineVessels);
app.use('/api/admin', authenticateToken, vesselTransfers);
app.use('/api/admin', authenticateToken, wineBlends);
app.use('/api/admin', authenticateToken, fermentations);
app.use('/api/admin', authenticateToken, wineAgings);
app.use('/api/admin', authenticateToken, wineChargings);
app.use('/api/admin', authenticateToken, profile);
app.use('/api/admin', authenticateToken, tenantProfile);
app.use('/api/admin', authenticateToken, enologicalAdditions);
app.use('/api/admin', authenticateToken, wineAnalyses);
app.use('/api/admin', authenticateToken, workOrders);
app.use('/api/admin', authenticateToken, documents);
app.use('/api/admin', authenticateToken, reports);
app.use('/api/admin', authenticateToken, suppliers);
app.use('/api/admin', authenticateToken, customers);
app.use('/api/admin', authenticateToken, employees);
app.use('/api/admin', authenticateToken, harvestAnnouncements);
app.use('/api/admin', authenticateToken, grapeReceptions);
app.use('/api/admin', authenticateToken, harvestSettlements);
app.use('/api/admin', authenticateToken, vineyardParcels);
app.use('/api/admin', authenticateToken, parcelTreatments);
app.use('/api/admin', authenticateToken, vineyardWorkOrders);
app.use('/api/admin', authenticateToken, soilAnalyses);
app.use('/api/admin', authenticateToken, ndvi);
app.use('/api/admin', authenticateToken, search);
app.use('/api/admin', authenticateToken, notifications);
app.use('/api/superadmin', authenticateToken, requireRole('superadmin'), superadminTenants);
app.use('/api/superadmin', authenticateToken, requireRole('superadmin'), superadminUsers);
app.use('/api/superadmin', authenticateToken, requireRole('superadmin'), superadminTickets);
//#endregion

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta ne postoji.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(err.status || 500).json({ message: err.message || 'Interna greška servera.' });
});

module.exports = app;
