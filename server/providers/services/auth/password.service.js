const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

exports.hash = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
exports.compare = (plain, hash) => bcrypt.compare(plain, hash);
