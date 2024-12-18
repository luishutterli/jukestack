/* -----------------------------------------------------
  db_setup.sql

  Creates the schema and its relations for the jukeStack project.

  Author: Luis Hutterli, 2i IMS Kantnsschule Frauenfeld
  Date:   18.12.2024

  History:
  Version    Date         Who     Changes
  1.0        18.12.2024   LH      created

  Copyright © 2024, Luis Hutterli, All rights reserved.
-------------------------------------------------------- */


-- -----------------------------------------------------
-- Schema JukeStackDB_Luis
-- -----------------------------------------------------
USE JukeStackDB_Luis ;

-- -----------------------------------------------------
-- Table TBenutzer
-- -----------------------------------------------------
DROP TABLE IF EXISTS TBenutzer ;

CREATE TABLE TBenutzer (
  benutzerId INT UNSIGNED NOT NULL AUTO_INCREMENT,
  benutzerEmail VARCHAR(255) NOT NULL,
  benutzerNachname VARCHAR(45) NOT NULL,
  benutzerVorname VARCHAR(45) NOT NULL,
  benutzerPWHash CHAR(64) NOT NULL,
  benutzerPWSalt CHAR(16) NOT NULL,
  benutzerLetztesLogin TIMESTAMP NULL,
  benutzerIstAdmin TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (benutzerId))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table TSongs
-- -----------------------------------------------------
DROP TABLE IF EXISTS TSongs ;

CREATE TABLE TSongs (
  songId INT UNSIGNED NOT NULL AUTO_INCREMENT,
  songName VARCHAR(45) NOT NULL,
  songDauer TIME NOT NULL,
  songJahr YEAR NOT NULL,
  songAlbum VARCHAR(45) NULL,
  songMP3link VARCHAR(255) NOT NULL,
  songCoverBildLink VARCHAR(255) NULL,
  PRIMARY KEY (songId))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table TAusleihen
-- -----------------------------------------------------
DROP TABLE IF EXISTS TAusleihen ;

CREATE TABLE TAusleihen (
  ausleihId INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ausleigStart DATE NULL,
  ausleihTage INT NOT NULL,
  benutzerId INT UNSIGNED NOT NULL,
  songId INT UNSIGNED NOT NULL,
  PRIMARY KEY (ausleihId))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table TMusiker
-- -----------------------------------------------------
DROP TABLE IF EXISTS TMusiker ;

CREATE TABLE TMusiker (
  musikerId INT UNSIGNED NOT NULL AUTO_INCREMENT,
  musikerName VARCHAR(100) NOT NULL,
  PRIMARY KEY (musikerId))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table TBeitraege
-- -----------------------------------------------------
DROP TABLE IF EXISTS TBeitraege ;

CREATE TABLE TBeitraege (
  musikerId INT UNSIGNED NOT NULL,
  songId INT UNSIGNED NOT NULL)
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table TAuthSessions
-- -----------------------------------------------------
DROP TABLE IF EXISTS TAuthSessions ;

CREATE TABLE TAuthSessions (
  sessToken CHAR(64) NOT NULL,
  sessExpires TIMESTAMP NOT NULL,
  sessCreated TIMESTAMP NOT NULL,
  sessUserIP VARCHAR(39) NOT NULL COMMENT '39 chars max, da ipv6 eine max laenge von 32 hat + 7 chars für doppelpunkt um die bloecke zu trennen',
  sessUserAgent VARCHAR(255) NOT NULL,
  benutzerId INT UNSIGNED NOT NULL,
  PRIMARY KEY (sessToken))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table TConfigs
-- -----------------------------------------------------
DROP TABLE IF EXISTS TConfigs ;

CREATE TABLE TConfigs (
  configKey VARCHAR(45) NOT NULL,
  configValue VARCHAR(255) NOT NULL,
  PRIMARY KEY (configKey))
ENGINE = MyISAM;