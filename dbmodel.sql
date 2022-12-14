
-- ------
-- BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
-- Abyss implementation : © sunil patel <sunil@xikka.com>
--
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----

-- dbmodel.sql

-- This is the file where you are describing the database schema of your game
-- Basically, you just have to export from PhpMyAdmin your table structure and copy/paste
-- this export here.
-- Note that the database itself and the standard tables ("global", "stats", "gamelog" and "player") are
-- already created and must not be created here

-- Note: The database schema is created from this file when the game starts. If you modify this file,
--       you have to restart a game to see your changes in database.

-- Example 1: create a standard "card" table to be used with the "Deck" tools (see example game "hearts"):

CREATE TABLE IF NOT EXISTS `lord` (
  `lord_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `points` int(11) unsigned NOT NULL,
  `keys` int(11) unsigned NOT NULL,
  `cost` int(11) unsigned NOT NULL,
  `diversity` int(11) unsigned NOT NULL,
  `used` tinyint(1) unsigned DEFAULT '0' NOT NULL,
  `turned` tinyint(1) unsigned DEFAULT '0' NOT NULL,
  `effect` int(11) unsigned DEFAULT '0' NOT NULL,
  `faction` int(11) unsigned,
  `place` int(11) NOT NULL DEFAULT '0',
  `location` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`lord_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `ally` (
  `ally_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `faction` int(11) unsigned,
  `value` int(11) unsigned NOT NULL,
  `just_spent` tinyint(1) unsigned DEFAULT '0' NOT NULL,
  `affiliated` tinyint(1) unsigned DEFAULT '0' NOT NULL,
  `place` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ally_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `location` (
  `location_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `place` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `monster` (
  `monster_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `value` int(11) unsigned NOT NULL,
  `place` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`monster_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;


ALTER TABLE `player` ADD `player_pearls` INT UNSIGNED NOT NULL DEFAULT '0';
ALTER TABLE `player` ADD `player_keys` INT UNSIGNED NOT NULL DEFAULT '0';
ALTER TABLE `player` ADD `player_has_purchased` TINYINT NOT NULL DEFAULT '0';
ALTER TABLE `player` ADD `player_autopass` VARCHAR(25) NOT NULL DEFAULT '0;0;0;0;0';
