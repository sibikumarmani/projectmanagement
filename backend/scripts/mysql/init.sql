CREATE DATABASE IF NOT EXISTS projectmanagement
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'pms_user'@'localhost' IDENTIFIED BY 'pms_password';
GRANT ALL PRIVILEGES ON projectmanagement.* TO 'pms_user'@'localhost';
FLUSH PRIVILEGES;
