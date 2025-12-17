SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS `ronda_marroqui`;
CREATE DATABASE `ronda_marroqui` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `ronda_marroqui`;

CREATE TABLE `Usuario` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_usuario` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contraseña_hash` varchar(255) NOT NULL,
  `rol` enum('jugador','admin') NOT NULL DEFAULT 'jugador',
  `partidas_ganadas` int(11) DEFAULT 0,
  `partidas_perdidas` int(11) DEFAULT 0,
  `partidas_jugadas` int(11) DEFAULT 0,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Torneo` (
  `id_torneo` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `max_participantes` int(11) NOT NULL DEFAULT 4,
  `tipo` enum('eliminatorio','todos_contra_todos') NOT NULL DEFAULT 'eliminatorio',
  `cartas_iniciales` int(11) DEFAULT 5,
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` enum('pendiente','en_curso','finalizado') NOT NULL DEFAULT 'pendiente',
  PRIMARY KEY (`id_torneo`),
  KEY `idx_torneo_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Partida` (
  `id_partida` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_inicio` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_fin` timestamp NULL DEFAULT NULL,
  `estado` enum('esperando_jugadores','en_curso','terminada','guardada') DEFAULT 'esperando_jugadores',
  `cartas_iniciales` int(11) DEFAULT 5,
  `max_jugadores` int(11) DEFAULT 4,
  `tipo_partida` enum('multijugador','vs_bot') DEFAULT 'multijugador',
  `bots_info` text DEFAULT NULL,

  `estado_juego_json` text DEFAULT NULL,

  `id_ganador` int(11) DEFAULT NULL,
  `id_perdedor` int(11) DEFAULT NULL,
  `id_torneo` int(11) DEFAULT NULL,
  `es_privada` tinyint(1) NOT NULL DEFAULT 0,
  `codigo_acceso` varchar(12) DEFAULT NULL,

  PRIMARY KEY (`id_partida`),
  UNIQUE KEY `uq_partida_codigo_acceso` (`codigo_acceso`),
  KEY `id_ganador` (`id_ganador`),
  KEY `id_perdedor` (`id_perdedor`),
  KEY `id_torneo` (`id_torneo`),
  KEY `idx_tipo_partida` (`tipo_partida`,`estado`),
  KEY `idx_partida_visibilidad` (`es_privada`,`estado`,`tipo_partida`),

  CONSTRAINT `partida_ibfk_1` FOREIGN KEY (`id_ganador`) REFERENCES `Usuario` (`id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `partida_ibfk_2` FOREIGN KEY (`id_perdedor`) REFERENCES `Usuario` (`id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `partida_ibfk_3` FOREIGN KEY (`id_torneo`) REFERENCES `Torneo` (`id_torneo`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Partida_Jugador` (
  `id_partida_jugador` int(11) NOT NULL AUTO_INCREMENT,
  `id_partida` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  PRIMARY KEY (`id_partida_jugador`),
  UNIQUE KEY `uq_partida_usuario` (`id_partida`,`id_usuario`),
  KEY `id_partida` (`id_partida`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `partida_jugador_ibfk_1` FOREIGN KEY (`id_partida`) REFERENCES `Partida` (`id_partida`) ON DELETE CASCADE,
  CONSTRAINT `partida_jugador_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Movimiento` (
  `id_movimiento` int(11) NOT NULL AUTO_INCREMENT,
  `id_partida` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `tipo_movimiento` enum('jugar','robar','cambiar_palo') NOT NULL,
  `carta_jugada` varchar(50) DEFAULT NULL,
  `palo_elegido` varchar(50) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_movimiento`),
  KEY `id_partida` (`id_partida`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `movimiento_ibfk_1` FOREIGN KEY (`id_partida`) REFERENCES `Partida` (`id_partida`) ON DELETE CASCADE,
  CONSTRAINT `movimiento_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Clasificacion_Torneo` (
  `id_clasificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_torneo` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `puntos` int(11) DEFAULT 0,
  PRIMARY KEY (`id_clasificacion`),
  UNIQUE KEY `idx_torneo_usuario` (`id_torneo`,`id_usuario`),
  KEY `id_usuario` (`id_usuario`),
  KEY `idx_clasificacion_puntos` (`puntos`),
  CONSTRAINT `clasificacion_torneo_ibfk_1` FOREIGN KEY (`id_torneo`) REFERENCES `Torneo` (`id_torneo`) ON DELETE CASCADE,
  CONSTRAINT `clasificacion_torneo_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;

COMMIT;

