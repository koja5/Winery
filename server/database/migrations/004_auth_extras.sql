-- T0.8: Auth, 2FA, onboarding/demo cloner
-- login_otps: kratkoživeći kodovi za email 2FA (TOTP ne treba bazu, secret je već
-- na users.two_factor_secret). onboarded_at: da klijent zna da li da prikaže
-- welcome popup posle prve prijave.

ALTER TABLE `users`
  ADD COLUMN `onboarded_at` TIMESTAMP NULL DEFAULT NULL AFTER `two_factor_secret`;

CREATE TABLE IF NOT EXISTS `login_otps` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `code_hash` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `consumed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_login_otps_user` (`user_id`),
  CONSTRAINT `fk_login_otps_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
