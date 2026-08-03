const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.MAIL_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    auth: process.env.MAIL_USER ? { user: process.env.MAIL_USER, password: process.env.MAIL_PASSWORD } : undefined
  });
  return transporter;
}

async function send({ to, subject, html }) {
  const client = getTransporter();
  if (!client) {
    logger.warn(`MAIL_HOST nije podešen — email nije poslat. To: ${to}, Subject: ${subject}`);
    return { sent: false };
  }
  await client.sendMail({ from: process.env.MAIL_USER, to, subject, html });
  return { sent: true };
}

module.exports = { send };
