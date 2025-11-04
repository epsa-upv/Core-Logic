# Ronda Marroquí - Sprint 2

Juego de cartas digital basado en el popular juego marroquí de baraja española.

**Versión:** 2.0 (Sprint 2)  
**Fecha:** 01 de noviembre de 2025  
**Autores:** Yahya Aboulafiya, Adrián Hoyos Sánchez, Souhail Batah, Carlos Robledo Badía

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Novedades del Sprint 2](#-novedades-del-sprint-2)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración de la Base de Datos](#-configuración-de-la-base-de-datos)
- [Uso](#-uso)
- [Arquitectura](#-arquitectura)
- [Componentes Principales](#-componentes-principales)
- [Base de Datos](#-base-de-datos)
- [Funcionalidades Implementadas](#-funcionalidades-implementadas)
- [Próximos Pasos (Sprint 3)](#-próximos-pasos-sprint-3)
- [Documentación](#-documentación)
- [Licencia](#-licencia)

---

## 🎮 Descripción

Ronda Marroquí es un juego de cartas para 3-6 jugadores que utiliza la baraja española de 40 cartas. El objetivo es ser el primer jugador en quedarse sin cartas, evitando ser el último (el "perdedor").

El juego incluye cartas especiales con efectos únicos:
- **As (1)**: El siguiente jugador roba 3 cartas
- **Dos (2)**: El siguiente jugador roba 2 cartas  
- **Cuatro (4)**: Se salta el turno del siguiente jugador
- **Siete (7)**: Permite cambiar de palo

---

## 🆕 Novedades del Sprint 2

### Sistema de Usuarios y Autenticación
- ✅ Página de **login** con autenticación segura
- ✅ Página de **registro** de nuevos usuarios
- ✅ Sistema de roles (Jugador y Administrador)
- ✅ Gestión de sesiones

### Base de Datos MySQL
- ✅ Esquema completo de base de datos
- ✅ Tablas: Usuario, Partida, Torneo, Movimiento, Clasificación
- ✅ Relaciones y claves foráneas
- ✅ Script SQL de inicialización

### Backend y Clases
- ✅ **DBControlador**: Gestión de operaciones CRUD
- ✅ **Usuario** (clase abstracta): Modelo base
- ✅ **Jugador**: Usuario con permisos de juego
- ✅ **Administrador**: Usuario con permisos administrativos
- ✅ Configuración de conexión a MySQL

### Documentación
- ✅ ERS v2.0 actualizado con requisitos del Sprint 2
- ✅ Diagramas E/R y UML
- ✅ Documentación completa de código

---

## 📁 Estructura del Proyecto

```
juego-ronda-marroqui-sprint2/
├── database/
│   └── sprint2.sql              # Script de creación de la base de datos
├── doc/
│   └── ERS_v2.0.md              # Documento de Especificación de Requisitos
├── lib/
│   └── img/                      # Imágenes de las cartas
│       ├── 01-oros.png
│       ├── 02-oros.png
│       ├── ...
│       └── reverso.png
├── src/
│   ├── index.html               # Página principal del juego
│   ├── login.html               # Página de inicio de sesión
│   ├── register.html            # Página de registro
│   ├── app.js                   # Aplicación principal
│   ├── RondaGame.js             # Motor del juego
│   ├── DBControlador.js         # Controlador de base de datos
│   ├── db-config.js             # Configuración de MySQL
│   ├── Usuario.js               # Clase abstracta Usuario
│   ├── Jugador.js               # Clase Jugador
│   ├── Administrador.js         # Clase Administrador
│   └── styles.css               # Estilos personalizados
└── README.md                    # Este archivo
```

---

## 💻 Requisitos

### Software Necesario

- **Navegador Web Moderno** (Chrome, Firefox, Edge, Safari)
- **MySQL Server** 8.0 o superior
- **Node.js** 16.x o superior (para el backend)
- **npm** (incluido con Node.js)

### Dependencias de Node.js

```json
{
  "dependencies": {
    "mysql2": "^3.6.0",
    "bcrypt": "^5.1.1",
    "express": "^4.18.2",
    "express-session": "^1.17.3"
  }
}
```

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/usuario/juego-ronda-marroqui.git
cd juego-ronda-marroqui-sprint2
```

### 2. Instalar MySQL

#### Windows
1. Descargar desde [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)
2. Instalar siguiendo el asistente
3. Configurar contraseña para el usuario root

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install mysql-server
sudo mysql_secure_installation
```

#### macOS
```bash
brew install mysql
brew services start mysql
```

### 3. Instalar Dependencias de Node.js

```bash
npm install mysql2
npm install bcrypt
npm install express
npm install express-session
```

---

## 🗄️ Configuración de la Base de Datos

### 1. Iniciar MySQL

```bash
# Linux/macOS
sudo systemctl start mysql

# Windows
# Iniciar desde el Panel de Servicios o MySQL Workbench
```

### 2. Crear la Base de Datos

```bash
# Acceder a MySQL
mysql -u root -p

# Crear la base de datos
CREATE DATABASE ronda_marroqui;
USE ronda_marroqui;

# Salir
exit;
```

### 3. Ejecutar el Script SQL

```bash
# Desde la terminal
mysql -u root -p ronda_marroqui < database/sprint2.sql

# O desde MySQL Workbench
# Abrir el archivo database/sprint2.sql y ejecutarlo
```

### 4. Configurar Credenciales

Editar el archivo `src/db-config.js`:

```javascript
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'TU_CONTRASEÑA',  // Cambiar aquí
    database: 'ronda_marroqui',
    connectionLimit: 10
};
```

### 5. Verificar la Conexión

```bash
node src/db-config.js
```

Deberías ver:
```
✅ Pool de conexiones MySQL creado exitosamente
   Host: localhost
   Database: ronda_marroqui
```

---

## 🎯 Uso

### Modo Desarrollo (Frontend)

1. Abrir `src/index.html` en un navegador web
2. Explorar el tablero de juego visual
3. Ver la consola del navegador para logs y debugging

### Acceder al Sistema de Autenticación

1. Abrir `src/login.html` en un navegador
2. Para registrarse, hacer clic en "Regístrate aquí"
3. Completar el formulario de registro
4. Iniciar sesión con las credenciales creadas

### Credenciales de Prueba

**Usuario de Prueba:**
- Email: test@ejemplo.com
- Contraseña: test123 (mínimo 6 caracteres)

---

## 🏗️ Arquitectura

### Modelo Cliente-Servidor

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   CLIENTE WEB   │ ◄────► │  SERVIDOR NODE.JS │ ◄────► │   MYSQL DB  │
│  (HTML/CSS/JS)  │         │    (Express)      │         │  (Datos)    │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

### Capas de la Aplicación

1. **Presentación** (`*.html`, `styles.css`, `app.js`)
   - Interfaz de usuario
   - Interacción con el jugador
   - Visualización del tablero

2. **Lógica de Negocio** (`RondaGame.js`, `Usuario.js`, `Jugador.js`, `Administrador.js`)
   - Motor del juego
   - Reglas y validaciones
   - Gestión de usuarios

3. **Acceso a Datos** (`DBControlador.js`, `db-config.js`)
   - Operaciones CRUD
   - Conexión a MySQL
   - Persistencia de datos

4. **Base de Datos** (`sprint2.sql`)
   - Almacenamiento persistente
   - Integridad referencial
   - Consultas optimizadas

---

## 🧩 Componentes Principales

### 1. RondaGame.js
Motor principal del juego que gestiona:
- Creación y barajado del mazo
- Reparto de cartas
- Turnos y validaciones
- Estado del juego

```javascript
const game = new RondaGame(4, 5);  // 4 jugadores, 5 cartas cada uno
game.startGame();
const state = game.getGameState();
```

### 2. DBControlador.js
Controlador de base de datos que proporciona:
- `crearUsuario(userData)` - RF-07
- `autenticarUsuario(email, password)` - RF-08
- `crearPartida(partidaData)` - RF-09
- `actualizarEstadisticasUsuario(id, stats)` - RF-10
- `crearTorneo(torneoData)` - RF-11
- `actualizarClasificacionTorneo(...)` - RF-12
- `registrarMovimiento(movimientoData)` - RF-13

### 3. Usuario.js (Clase Abstracta)
Clase base para todos los usuarios:
- Propiedades comunes (id, nombre, email, rol)
- Estadísticas (ganadas, perdidas, jugadas)
- Métodos abstractos para implementar

### 4. Jugador.js
Hereda de Usuario y añade:
- Partidas activas
- Sistema de amigos
- Nivel y experiencia
- Permisos de jugador

```javascript
const jugador = new Jugador(1, 'Juan', 'juan@email.com');
jugador.unirseAPartida(123);
jugador.ganarExperiencia(50);
```

### 5. Administrador.js
Hereda de Usuario y añade:
- Gestión de torneos
- Moderación de usuarios
- Estadísticas globales
- Permisos administrativos

```javascript
const admin = new Administrador(1, 'Admin', 'admin@email.com');
await admin.crearTorneo({ nombre: 'Torneo de Verano', ... });
await admin.banearUsuario(userId, 'Comportamiento inapropiado', 7);
```

---

## 🗄️ Base de Datos

### Diagrama Entidad-Relación

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│   Usuario   │       │ Partida_Jugador  │       │   Partida   │
│─────────────│       │──────────────────│       │─────────────│
│ id_usuario  │◄──────│ id_usuario       │───────►│ id_partida  │
│ nombre      │       │ id_partida       │       │ fecha_inicio│
│ email       │       └──────────────────┘       │ id_ganador  │
│ rol         │                                  │ id_perdedor │
│ estadísticas│                                  └─────────────┘
└─────────────┘                                         │
      │                                                 │
      │         ┌──────────────────┐                   │
      │         │    Torneo        │                   │
      └────────►│──────────────────│                   │
                │ id_torneo        │                   │
                │ nombre           │                   │
                └──────────────────┘                   │
                        │                              │
                        │         ┌──────────────────┐ │
                        └────────►│   Movimiento     │◄┘
                                  │──────────────────│
                                  │ id_movimiento    │
                                  │ tipo_movimiento  │
                                  │ carta_jugada     │
                                  └──────────────────┘
```

### Tablas Principales

#### Usuario
```sql
- id_usuario (PK)
- nombre_usuario
- email (UNIQUE)
- contraseña_hash
- rol (jugador/admin)
- partidas_ganadas
- partidas_perdidas
- partidas_jugadas
- fecha_registro
```

#### Partida
```sql
- id_partida (PK)
- fecha_inicio
- fecha_fin
- estado (en_curso/terminada/guardada)
- cartas_iniciales
- estado_juego_json
- id_ganador (FK → Usuario)
- id_perdedor (FK → Usuario)
- id_torneo (FK → Torneo)
```

#### Torneo
```sql
- id_torneo (PK)
- nombre
- fecha_inicio
- fecha_fin
- descripcion
```

#### Movimiento
```sql
- id_movimiento (PK)
- id_partida (FK → Partida)
- id_usuario (FK → Usuario)
- tipo_movimiento (jugar/robar/cambiar_palo)
- carta_jugada
- palo_elegido
- timestamp
```

---

## ✅ Funcionalidades Implementadas

### Sprint 1
- [x] Creación del mazo de 40 cartas
- [x] Barajado aleatorio (algoritmo Fisher-Yates)
- [x] Reparto de cartas a 3-6 jugadores
- [x] Interfaz visual del tablero
- [x] Sistema de turnos básico
- [x] Identificación de cartas especiales

### Sprint 2
- [x] **RF-07:** Registro de usuarios en base de datos
- [x] **RF-08:** Autenticación de usuarios
- [x] **RF-09:** Persistencia de partidas
- [x] **RF-10:** Actualización de ranking
- [x] **RF-11:** Gestión de torneos
- [x] **RF-12:** Clasificación de torneos
- [x] **RF-13:** Historial de movimientos
- [x] **RNF-04:** Seguridad (hashing de contraseñas)
- [x] **RNF-05:** Integridad de datos (claves foráneas)
- [x] Sistema de usuarios con roles
- [x] Páginas de login y registro
- [x] Controlador de base de datos
- [x] Clases Usuario, Jugador, Administrador

---

## 🔜 Próximos Pasos (Sprint 3)

### Funcionalidades Pendientes
- [ ] **RF-03:** Lógica completa del juego (jugar/robar cartas)
- [ ] **RF-04:** Efectos de cartas especiales
- [ ] **RF-05:** Detección de ganador y perdedor
- [ ] **RF-06:** Ranking global con interfaz
- [ ] **RNF-03:** Optimización de rendimiento
- [ ] Multijugador en tiempo real (WebSockets)
- [ ] Sistema de notificaciones
- [ ] Dashboard de administración
- [ ] Sistema de amigos y chat
- [ ] Animaciones avanzadas

### Mejoras Técnicas
- [ ] Integración completa con el backend
- [ ] Tests unitarios y de integración
- [ ] CI/CD pipeline
- [ ] Documentación API REST
- [ ] Docker y contenedorización
- [ ] Monitoreo y logs

---

## 📚 Documentación

### Documentos Disponibles
- `doc/ERS_v2.0.md` - Especificación de Requisitos Software (Sprint 2)
- `database/sprint2.sql` - Script de base de datos documentado
- Código fuente con JSDoc completo

### Recursos Externos
- [Documentación de MySQL](https://dev.mysql.com/doc/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/guide/)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)

---

## 🤝 Contribuir

### Equipo de Desarrollo
- **Yahya Aboulafiya**
- **Adrián Hoyos Sánchez**
- **Souhail Batah**
- **Carlos Robledo Badía**

### Reportar Problemas
Si encuentras algún bug o tienes una sugerencia, por favor abre un issue en el repositorio.

---

## 📄 Licencia

Este proyecto es parte de un trabajo académico para la asignatura de Ingeniería de Software Orientada a Sistemas.

**Universidad:** [Tu Universidad]  
**Curso Académico:** 2025-2026  
**Asignatura:** Proyecto de ISO

---

## 📞 Contacto

Para más información sobre el proyecto, contacta con cualquier miembro del equipo.

---

**Última actualización:** 01 de noviembre de 2025  
**Versión:** 2.0 (Sprint 2)

✨ **¡Que disfrutes jugando a Ronda Marroquí!** ✨
