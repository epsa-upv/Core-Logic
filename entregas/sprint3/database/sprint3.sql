DROP DATABASE IF EXISTS `ronda_marroqui`;
CREATE DATABASE `ronda_marroqui` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ronda_marroqui`;

CREATE TABLE `Usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre_usuario` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `contraseña_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('jugador', 'admin') NOT NULL DEFAULT 'jugador',
  `partidas_ganadas` INT DEFAULT 0,
  `partidas_perdidas` INT DEFAULT 0,
  `partidas_jugadas` INT DEFAULT 0,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  INDEX `idx_email` (`email`),
  INDEX `idx_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Torneo` (
  `id_torneo` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `max_participantes` INT NOT NULL DEFAULT 4,
  `tipo` ENUM('eliminatorio', 'todos_contra_todos') NOT NULL DEFAULT 'eliminatorio',
  `cartas_iniciales` INT DEFAULT 5,
  `fecha_inicio` DATETIME NULL,
  `fecha_fin` DATETIME NULL,
  `descripcion` TEXT NULL,
  `estado` ENUM('pendiente', 'en_curso', 'finalizado') NOT NULL DEFAULT 'pendiente',
  PRIMARY KEY (`id_torneo`),
  INDEX `idx_torneo_estado` (`estado`),
  INDEX `idx_fecha_inicio` (`fecha_inicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Partida` (
  `id_partida` INT NOT NULL AUTO_INCREMENT,
  `fecha_inicio` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` TIMESTAMP NULL,
  `estado` ENUM('esperando_jugadores', 'en_curso', 'terminada', 'guardada') NOT NULL DEFAULT 'esperando_jugadores',
  `cartas_iniciales` INT DEFAULT 5,
  `max_jugadores` INT DEFAULT 4,
  `estado_juego_json` TEXT NULL,
  `id_ganador` INT NULL,
  `id_perdedor` INT NULL,
  `id_torneo` INT NULL,
  PRIMARY KEY (`id_partida`),
  FOREIGN KEY (`id_ganador`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL,
  FOREIGN KEY (`id_perdedor`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL,
  FOREIGN KEY (`id_torneo`) REFERENCES `Torneo`(`id_torneo`) ON DELETE SET NULL,
  INDEX `idx_estado` (`estado`),
  INDEX `idx_id_torneo` (`id_torneo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Partida_Jugador` (
  `id_partida` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_partida`, `id_usuario`),
  FOREIGN KEY (`id_partida`) REFERENCES `Partida`(`id_partida`) ON DELETE CASCADE,
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE CASCADE,
  INDEX `idx_usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Movimiento` (
  `id_movimiento` INT NOT NULL AUTO_INCREMENT,
  `id_partida` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `tipo_movimiento` ENUM('jugar', 'robar', 'cambiar_palo') NOT NULL,
  `carta_jugada` VARCHAR(50) NULL,
  `palo_elegido` VARCHAR(50) NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_movimiento`),
  FOREIGN KEY (`id_partida`) REFERENCES `Partida`(`id_partida`) ON DELETE CASCADE,
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE CASCADE,
  INDEX `idx_partida` (`id_partida`),
  INDEX `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Clasificacion_Torneo` (
  `id_clasificacion` INT NOT NULL AUTO_INCREMENT,
  `id_torneo` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `puntos` INT DEFAULT 0,
  PRIMARY KEY (`id_clasificacion`),
  UNIQUE KEY `idx_torneo_usuario` (`id_torneo`, `id_usuario`),
  FOREIGN KEY (`id_torneo`) REFERENCES `Torneo`(`id_torneo`) ON DELETE CASCADE,
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE CASCADE,
  INDEX `idx_clasificacion_puntos` (`puntos` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Usuario` (`nombre_usuario`, `email`, `contraseña_hash`, `rol`, `partidas_ganadas`, `partidas_perdidas`, `partidas_jugadas`) VALUES
('admin', 'admin@rondamarroqui.com', '$2b$10$rZ8qH9vXQ5ZlxYqF3MQ.NeZX7KV.HZ9M8Y5qF3MQ.NeZX7KV.HZ9M2', 'admin', 0, 0, 0),
('yahya', 'yahya@upv.es', '$2b$10$rZ8qH9vXQ5ZlxYqF3MQ.NeZX7KV.HZ9M8Y5qF3MQ.NeZX7KV.HZ9M2', 'jugador', 50, 10, 60),
('carlos_pro', 'carlos.pro@upv.es', '$2b$10$rZ8qH9vXQ5ZlxYqF3MQ.NeZX7KV.HZ9M8Y5qF3MQ.NeZX7KV.HZ9M2', 'jugador', 45, 15, 60),
('maria_champion', 'maria.champion@upv.es', '$2b$10$rZ8qH9vXQ5ZlxYqF3MQ.NeZX7KV.HZ9M8Y5qF3MQ.NeZX7KV.HZ9M2', 'jugador', 42, 18, 60),
('ahmed_master', 'ahmed.master@upv.es', '$2b$10$rZ8qH9vXQ5ZlxYqF3MQ.NeZX7KV.HZ9M8Y5qF3MQ.NeZX7KV.HZ9M2', 'jugador', 38, 17, 55),
('laura_gamer', 'laura.gamer@upv.es', '$2b$10$rZ8qH9vXQ5ZlxYqF3MQ.NeZX7KV.HZ9M8Y5qF3MQ.NeZX7KV.HZ9M2', 'jugador', 28, 22, 50),
('david_player', 'david.player@upv.es', '$2b$10$rZ8qH9vXQ5ZlxYqF3MQ.NeZX7KV.HZ9M8Y5qF3MQ.NeZX7KV.HZ9M2', 'jugador', 25, 20, 45),
('sofia_cards', 'sofia.cards@upv.es', '$2b$10$rZ8qH9vXQ5ZlxYqF3MQ.NeZX7KV.HZ9M8Y5qF3MQ.NeZX7KV.HZ9M2', 'jugador', 22, 23, 45),
('miguel_ace', 'miguel.ace@upv.es', '$2b$10$rZ8qH9vXQ5ZlxYqF3MQ.NeZX7KV.HZ9M8Y5qF3MQ.NeZX7KV.HZ9M2', 'jugador', 20, 20, 40);

INSERT INTO `Torneo` (`nombre`, `max_participantes`, `tipo`, `cartas_iniciales`, `fecha_inicio`, `estado`, `descripcion`) VALUES
('Campeonato de Verano 2025', 8, 'eliminatorio', 5, '2025-12-01 10:00:00', 'pendiente', 'Torneo eliminatorio de 8 jugadores para competir por el título de campeón de verano'),
('Liga Mensual Noviembre', 6, 'todos_contra_todos', 5, '2025-11-25 15:00:00', 'pendiente', 'Torneo todos contra todos donde cada jugador se enfrenta a todos los demás'),
('Copa Rápida', 4, 'eliminatorio', 3, '2025-11-20 18:00:00', 'pendiente', 'Torneo rápido de 4 jugadores con 3 cartas iniciales'),
('Torneo Veteranos', 8, 'eliminatorio', 6, '2025-12-15 16:00:00', 'pendiente', 'Torneo especial para jugadores experimentados con 6 cartas iniciales'),
('Liga de Primavera', 16, 'todos_contra_todos', 5, '2026-03-01 10:00:00', 'pendiente', 'Gran liga de primavera con 16 participantes');

INSERT INTO `Clasificacion_Torneo` (`id_torneo`, `id_usuario`, `puntos`) VALUES
(1, 2, 0),
(1, 3, 0),
(1, 4, 0),
(1, 5, 0),
(2, 2, 0),
(2, 6, 0),
(2, 7, 0),
(3, 3, 0),
(3, 4, 0),
(3, 8, 0),
(3, 9, 0);

INSERT INTO `Partida` (`fecha_inicio`, `fecha_fin`, `estado`, `cartas_iniciales`, `max_jugadores`, `id_ganador`, `id_perdedor`, `id_torneo`) VALUES
(NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR, 'terminada', 5, 4, 2, 3, NULL);

INSERT INTO `Partida_Jugador` (`id_partida`, `id_usuario`) VALUES
(1, 2),
(1, 3),
(1, 4),
(1, 5);

INSERT INTO `Movimiento` (`id_partida`, `id_usuario`, `tipo_movimiento`, `carta_jugada`, `timestamp`) VALUES
(1, 2, 'jugar', '7_oros', NOW() - INTERVAL 1 HOUR - INTERVAL 50 MINUTE),
(1, 3, 'jugar', '5_espadas', NOW() - INTERVAL 1 HOUR - INTERVAL 49 MINUTE),
(1, 4, 'robar', NULL, NOW() - INTERVAL 1 HOUR - INTERVAL 48 MINUTE),
(1, 5, 'jugar', '3_copas', NOW() - INTERVAL 1 HOUR - INTERVAL 47 MINUTE);

SELECT 'Usuarios registrados:' AS Info, COUNT(*) AS Total FROM Usuario;
SELECT 'Torneos creados:' AS Info, COUNT(*) AS Total FROM Torneo;
SELECT 'Partidas jugadas:' AS Info, COUNT(*) AS Total FROM Partida;
SELECT 'Inscripciones en torneos:' AS Info, COUNT(*) AS Total FROM Clasificacion_Torneo;

COMMIT;
