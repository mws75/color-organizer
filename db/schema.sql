-- db/schema.sql
-- Color Pallet Organizer (app acronym: cp)
-- Uses the shared PlanetScale database: one-offs-v2
-- PlanetScale/Vitess: no foreign key constraints — relationships enforced in app code.
SET NAMES utf8mb4;
SET time_zone = '+00:00';

USE `one-offs-v2`;

-- cp_USERS (sourced from Clerk login; stripe columns reserved for future billing)
CREATE TABLE IF NOT EXISTS cp_users (
  user_id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_name              VARCHAR(255)    NOT NULL,
  email                  VARCHAR(255)    NOT NULL,
  profile_pic_url        VARCHAR(255)    NULL,
  plan_tier              VARCHAR(25)     NOT NULL DEFAULT 'free',
  stripe_customer_id     VARCHAR(255)    NULL,
  stripe_subscription_id VARCHAR(255)    NULL,
  is_deleted             TINYINT(1)      NOT NULL DEFAULT 0,
  created_on             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_on            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY ux_cp_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- cp_COLOR_PALETTES (1 user : many palettes)
-- colors_json holds the ordered color list: [{"name": "Sunset Peach", "hex": "#FFB59E"}, ...] (max 20)
CREATE TABLE IF NOT EXISTS cp_color_palettes (
  palette_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  palette_name  VARCHAR(100)    NOT NULL,
  colors_json   JSON            NOT NULL,
  created_on    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_on   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (palette_id),
  KEY ix_cp_palettes_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
