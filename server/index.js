const app = require('./server');
const logger = require('./providers/config/logger');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`eVinarija API sluša na portu ${PORT}`);
});
