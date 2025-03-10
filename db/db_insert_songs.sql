/* -----------------------------------------------------
  db_insert_songs.sql

  Inserts the songs and artists into the jukeStack project.

  Author: Luis Hutterli, 2i IMS Kantonsschule Frauenfeld
  Date:   10.01.2025

  History:
  Version    Date         Who     Changes
  1.0        10.01.2025   LH      created
  1.1        10.01.2025   LH      added 4 songs
  1.2        10.01.2025   LH      added artists and contributions

  Copyright © 2025, Luis Hutterli, All rights reserved.
-------------------------------------------------------- */
use JukeStackDB_Luis;
truncate TSongs;

insert into TSongs (songName, songDauer, songJahr, songAlbum, songMP3Objekt, songCoverObjekt)  values 
('10 Freaky Girls (with 21 Savage)', '00:03:30', 2018, 'NOT ALL HEROES WEAR CAPES', '10 Freaky Girls (with 21 Savage).mp3', '10 Freaky Girls (with 21 Savage).jpg'),
('500lbs', '00:02:33', 2023, 'Tec', '500lbs.mp3', '500lbs.jpg'),
('All Eyes On Me', '00:03:00', 2022, '', 'All Eyes On Me.mp3', 'All Eyes On Me.jpg'),
('Au Revoir', '00:02:42', 2023, '', 'Au Revoir.mp3', 'Au Revoir.jpg'),
('Back One Day (Outro Song)', '00:03:54', 2022, '', 'Back One Day (Outro Song).mp3', 'Back One Day (Outro Song).jpg'),
('BΘcane - A COLORS SHOW', '00:03:05', 2023, '', 'BΘcane - A COLORS SHOW.mp3', 'BΘcane - A COLORS SHOW.jpg'),
('90210', '00:05:40', 2015, 'Rodeo', '90210.mp3', '90210.jpg'),
('All Eyez On Me', '00:05:07', 1996, 'All Eyez On Me', 'All Eyez On Me.mp3', 'All Eyez On Me.jpg'),
('HIGHEST IN THE ROOM', '00:02:57', 2019, 'JACKBOYS', 'HIGHEST IN THE ROOM.mp3', 'HIGHEST IN THE ROOM.jpg'),
('Timeless', '00:04:16', 2024, 'Hurry Up Tomorrow', 'Timeless.mp3', 'Timeless.jpg');
update TSongs set songAlbum = NULL where songAlbum = '';

truncate TMusiker;

insert into TMusiker (musikerName) values
('Metro Boomin'),
('21 Savage'),
('Lil Tecca'),
('VALORANT'),
('JeanDeaux'),
('Whipped Cream'),
('Milano'),
('Eddin'),
('NEFFEX'),
('TheFatRat'),
('Yamê'),
('Travis Scott'),
('Kacy Hill'),
('2Pac'),
('Big Syke'),
('Playboi Carti'),
('the Weeknd');


truncate TBeitraege;

insert into TBeitraege (musikerId, songId) values
((select musikerId from TMusiker where musikerName = 'Metro Boomin'), (select songId from TSongs where songName = '10 Freaky Girls (with 21 Savage)')),
((select musikerId from TMusiker where musikerName = '21 Savage'), (select songId from TSongs where songName = '10 Freaky Girls (with 21 Savage)')),
((select musikerId from TMusiker where musikerName = 'Lil Tecca'), (select songId from TSongs where songName = '500lbs')),
((select musikerId from TMusiker where musikerName = 'VALORANT'), (select songId from TSongs where songName = 'All Eyes On Me')),
((select musikerId from TMusiker where musikerName = 'JeanDeaux'), (select songId from TSongs where songName = 'All Eyes On Me')),
((select musikerId from TMusiker where musikerName = 'Whipped Cream'), (select songId from TSongs where songName = 'All Eyes On Me')),
((select musikerId from TMusiker where musikerName = 'Milano'), (select songId from TSongs where songName = 'Au Revoir')),
((select musikerId from TMusiker where musikerName = 'Eddin'), (select songId from TSongs where songName = 'Au Revoir')),
((select musikerId from TMusiker where musikerName = 'NEFFEX'), (select songId from TSongs where songName = 'Back One Day (Outro Song)')),
((select musikerId from TMusiker where musikerName = 'TheFatRat'), (select songId from TSongs where songName = 'Back One Day (Outro Song)')),
((select musikerId from TMusiker where musikerName = 'Yamê'), (select songId from TSongs where songName = 'BΘcane - A COLORS SHOW')),
((select musikerId from TMusiker where musikerName = '2Pac'), (select songId from TSongs where songName = 'All Eyez On Me')),
((select musikerId from TMusiker where musikerName = 'Big Syke'), (select songId from TSongs where songName = 'All Eyez On Me')),
((select musikerId from TMusiker where musikerName = 'Travis Scott'), (select songId from TSongs where songName = '90210')),
((select musikerId from TMusiker where musikerName = 'Kacy Hill'), (select songId from TSongs where songName = '90210')),
((select musikerId from TMusiker where musikerName = 'Travis Scott'), (select songId from TSongs where songName = 'HIGHEST IN THE ROOM')),
((select musikerId from TMusiker where musikerName = 'the Weeknd'), (select songId from TSongs where songName = 'Timeless')),
((select musikerId from TMusiker where musikerName = 'Playboi Carti'), (select songId from TSongs where songName = 'Timeless'));