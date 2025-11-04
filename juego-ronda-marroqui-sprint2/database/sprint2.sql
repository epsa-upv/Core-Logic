-- -----------------------------------------------------
-- Script SQL para crear la base de datos de "Ronda Marroqui"
-- Dialecto: MySQL
-- -----------------------------------------------------

-- Para evitar problemas, borramos las tablas si ya existen (opcional)
DROP TABLE IF EXISTS `Movimiento`;
DROP TABLE IF EXISTS `Clasificacion_Torneo`;
DROP TABLE IF EXISTS `Partida_Jugador`;
DROP TABLE IF EXISTS `Partida`;
DROP TABLE IF EXISTS `Torneo`;
DROP TABLE IF EXISTS `Usuario`;


-- ---
-- Tabla `Usuario`
-- Almacena a todos los jugadores y administradores.
-- Cumple con RF-01 (roles) y RF-06 (ranking global).
-- ---
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
  PRIMARY KEY (`id_usuario`)
);


-- ---
-- Tabla `Torneo`
-- Almacena los torneos que crean los administradores.
-- ---
CREATE TABLE `Torneo` (
  `id_torneo` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `fecha_inicio` DATETIME NULL,
  `fecha_fin` DATETIME NULL,
  `descripcion` TEXT NULL,
  PRIMARY KEY (`id_torneo`)
);


-- ---
-- Tabla `Partida`
-- Almacena cada partida individual.
-- Cumple con RF-05 (fin de partida) y se conecta a Torneos.
-- ---
CREATE TABLE `Partida` (
  `id_partida` INT NOT NULL AUTO_INCREMENT,
  `fecha_inicio` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` TIMESTAMP NULL,
  `estado` ENUM('en_curso', 'terminada', 'guardada') NOT NULL DEFAULT 'en_curso',
  `cartas_iniciales` INT DEFAULT 5,
  `estado_juego_json` TEXT NULL,
  `id_ganador` INT NULL,
  `id_perdedor` INT NULL,
  `id_torneo` INT NULL,
  PRIMARY KEY (`id_partida`),
  FOREIGN KEY (`id_ganador`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL,
  FOREIGN KEY (`id_perdedor`) REFERENCES `Usuario`(`id_usuario`) ON DELETE SET NULL,
  FOREIGN KEY (`id_torneo`) REFERENCES `Torneo`(`id_torneo`) ON DELETE SET NULL
);


-- ---
-- Tabla `Partida_Jugador`
-- Tabla "puente" que conecta a los jugadores con sus partidas.
-- Resuelve la relación Muchos-a-Muchos.
-- ---
CREATE TABLE `Partida_Jugador` (
  `id_partida` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_partida`, `id_usuario`),
  FOREIGN KEY (`id_partida`) REFERENCES `Partida`(`id_partida`) ON DELETE CASCADE,
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE CASCADE
);


-- ---
-- Tabla `Movimiento`
-- Almacena un historial de cada jugada en cada partida.
-- ---
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
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE CASCADE
);


-- ---
-- Tabla `Clasificacion_Torneo`
-- Almacena los puntos de cada jugador para un torneo específico.
-- ---
CREATE TABLE `Clasificacion_Torneo` (
  `id_clasificacion` INT NOT NULL AUTO_INCREMENT,
  `id_torneo` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `puntos` INT DEFAULT 0,
  PRIMARY KEY (`id_clasificacion`),
  UNIQUE KEY `idx_torneo_usuario` (`id_torneo`, `id_usuario`),
  FOREIGN KEY (`id_torneo`) REFERENCES `Torneo`(`id_torneo`) ON DELETE CASCADE,
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE CASCADE
);

-- ---
-- Fin del script
-- ---
