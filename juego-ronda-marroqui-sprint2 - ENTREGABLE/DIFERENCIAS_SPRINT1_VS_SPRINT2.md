# 🔄 Diferencias entre Sprint 1 y Sprint 2

## 📋 Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Nuevas Funcionalidades Sprint 2](#nuevas-funcionalidades-sprint-2)
3. [Arquitectura y Tecnologías](#arquitectura-y-tecnologías)
4. [Comparación Detallada](#comparación-detallada)
5. [Base de Datos](#base-de-datos)
6. [Seguridad](#seguridad)
7. [Interfaz de Usuario](#interfaz-de-usuario)
8. [Archivos Nuevos](#archivos-nuevos)
9. [Archivos Modificados](#archivos-modificados)

---

## 🎯 Resumen Ejecutivo

### Sprint 1 (Completado)
- **Objetivo**: Interfaz básica del juego de cartas
- **Tecnología**: Solo Frontend (HTML, CSS, JavaScript)
- **Funcionalidad**: Juego de cartas simulado sin persistencia
- **Usuarios**: Sin autenticación, datos en memoria local

### Sprint 2 (Actual)
- **Objetivo**: Sistema completo con autenticación y persistencia
- **Tecnología**: Frontend + Backend + Base de Datos
- **Funcionalidad**: Autenticación real, datos persistentes, arquitectura cliente-servidor
- **Usuarios**: Registro, login, sesiones seguras, roles (jugador/administrador)

---

## ⚡ Nuevas Funcionalidades Sprint 2

### 1. Sistema de Autenticación Completo
#### 🆕 Registro de Usuarios
- Formulario de registro con validación
- Campos: nombre de usuario, email, contraseña, rol
- Validaciones frontend y backend
- Verificación de unicidad (email y username)
- Cifrado de contraseñas con bcrypt (10 rounds)
- Indicador de fortaleza de contraseña en tiempo real

#### 🆕 Inicio de Sesión
- Login con email y contraseña
- Verificación contra base de datos MySQL
- Comparación segura de contraseñas hasheadas
- Creación de sesión persistente (24 horas)
- Redirección automática al juego tras login exitoso

#### 🆕 Gestión de Sesiones
- Sistema de sesiones con express-session
- Cookies HTTP-only para mayor seguridad
- Persistencia de sesión entre páginas
- Cierre de sesión con destrucción de sesión
- Verificación de sesión activa

#### 🆕 Página de Bienvenida
- Landing page profesional
- Dos CTAs principales: "Jugar Ahora" y "Crear Cuenta"
- Presentación de características del juego
- Detección de sesión activa
- Diseño responsive y moderno

### 2. Backend con Node.js y Express

#### 🆕 Servidor Express
- Puerto 3000 (localhost)
- Middleware CORS configurado
- Manejo de JSON y URL-encoded
- Sistema de rutas RESTful
- Gestión de errores centralizada

#### 🆕 API REST Endpoints
```
POST /api/register     → Registrar nuevo usuario
POST /api/login        → Autenticar usuario
POST /api/logout       → Cerrar sesión
GET  /api/session      → Obtener sesión actual
GET  /api/profile      → Perfil de usuario (protegido)
GET  /                 → Página de bienvenida
```

### 3. Base de Datos MySQL

#### 🆕 Esquema Completo (6 Tablas)

**Tabla Usuario**
```sql
- id_usuario (PK, AUTO_INCREMENT)
- nombre_usuario (UNIQUE, VARCHAR(100))
- email (UNIQUE, VARCHAR(255))
- contraseña_hash (VARCHAR(255))
- rol (ENUM: 'jugador', 'admin')
- partidas_ganadas (INT, DEFAULT 0)
- partidas_perdidas (INT, DEFAULT 0)
- partidas_jugadas (INT, DEFAULT 0)
- fecha_registro (TIMESTAMP)
```

**Tabla Torneo**
```sql
- id_torneo (PK, AUTO_INCREMENT)
- nombre (VARCHAR(255))
- fecha_inicio (DATETIME)
- fecha_fin (DATETIME)
- descripcion (TEXT)
```

**Tabla Partida**
```sql
- id_partida (PK, AUTO_INCREMENT)
- id_torneo (FK → Torneo, NULL)
- fecha_inicio (DATETIME)
- fecha_fin (DATETIME)
- estado (ENUM: 'en_curso', 'finalizada', 'cancelada')
- ganador_id (FK → Usuario, NULL)
```

**Tabla Movimiento**
```sql
- id_movimiento (PK, AUTO_INCREMENT)
- id_partida (FK → Partida)
- id_usuario (FK → Usuario)
- tipo_movimiento (ENUM: 'jugar_carta', 'robar_carta', 'pasar_turno')
- carta_jugada (VARCHAR(50))
- orden_turno (INT)
- timestamp (TIMESTAMP)
```

**Tabla Partida_Jugador**
```sql
- id_partida (FK → Partida)
- id_usuario (FK → Usuario)
- orden_jugador (INT)
- puntos (INT, DEFAULT 0)
- PRIMARY KEY (id_partida, id_usuario)
```

**Tabla Clasificacion_Torneo**
```sql
- id_torneo (FK → Torneo)
- id_usuario (FK → Usuario)
- puntos_totales (INT, DEFAULT 0)
- posicion (INT)
- PRIMARY KEY (id_torneo, id_usuario)
```

### 4. Arquitectura Orientada a Objetos

#### 🆕 Jerarquía de Clases

**Clase Usuario (Abstracta)**
```javascript
class Usuario {
    constructor(id_usuario, nombre_usuario, email, rol)
    getId()
    getNombre()
    getEmail()
    getRol()
    getEstadisticas()
    actualizarEstadisticas(gano)
    obtenerPermisos() // Abstracto
    toJSON()
    toString()
}
```

**Clase Jugador (Hereda de Usuario)**
```javascript
class Jugador extends Usuario {
    constructor(id_usuario, nombre_usuario, email)
    // Propiedades adicionales:
    - nivel (INT)
    - experiencia (INT)
    - partidas_activas (Array)
    
    // Métodos específicos:
    obtenerPermisos()
    unirseAPartida(id_partida)
    abandonarPartida(id_partida)
    subirNivel()
    ganarExperiencia(puntos)
}
```

**Clase Administrador (Hereda de Usuario)**
```javascript
class Administrador extends Usuario {
    constructor(id_usuario, nombre_usuario, email)
    
    // Métodos específicos (17 permisos):
    obtenerPermisos()
    crearTorneo(datos)
    modificarTorneo(id, datos)
    eliminarTorneo(id)
    gestionarUsuarios()
    banearUsuario(id_usuario, razon)
    desbanearUsuario(id_usuario)
    verEstadisticasGlobales()
    generarReportes()
    moderarPartidas()
    configurarSistema()
    // ... más métodos administrativos
}
```

**Clase DBControlador**
```javascript
class DBControlador {
    // CRUD Usuarios
    crearUsuario(datos)
    obtenerUsuario(id)
    actualizarUsuario(id, datos)
    eliminarUsuario(id)
    listarUsuarios()
    
    // CRUD Partidas
    crearPartida(datos)
    obtenerPartida(id)
    finalizarPartida(id, ganador_id)
    listarPartidas()
    
    // CRUD Torneos
    crearTorneo(datos)
    obtenerTorneo(id)
    actualizarTorneo(id, datos)
    eliminarTorneo(id)
    
    // Estadísticas
    obtenerEstadisticasUsuario(id)
    obtenerRankingGlobal()
    obtenerClasificacionTorneo(id_torneo)
}
```

### 5. Seguridad Implementada

#### 🆕 Medidas de Seguridad

**Cifrado de Contraseñas**
- Biblioteca: bcrypt
- Salt rounds: 10
- Hash almacenado en BD (no plain text)
- Comparación segura en login

**Gestión de Sesiones**
- express-session configurado
- Secret key: 'ronda_marroqui_secret_2025'
- Cookies HTTP-only (no accesibles por JavaScript)
- Expiración: 24 horas
- Almacenamiento server-side

**Validaciones**
- Frontend: HTML5 validation + JavaScript
- Backend: Validación de todos los campos
- Longitud mínima contraseña: 6 caracteres
- Formato email validado
- Username mínimo: 3 caracteres

**Protección de Rutas**
- Middleware requireAuth()
- Verificación de sesión en rutas protegidas
- Redirección automática si no autenticado

**Constraints en BD**
- UNIQUE en email y nombre_usuario
- Foreign Keys con ON DELETE CASCADE
- NOT NULL en campos críticos
- ENUM para valores predefinidos

---

## 🏗️ Arquitectura y Tecnologías

### Sprint 1 - Arquitectura Monolítica Frontend

```
┌─────────────────────────────────────┐
│         NAVEGADOR WEB               │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   index.html (Interfaz)      │  │
│  │   ├── app.js (Lógica)        │  │
│  │   ├── RondaGame.js (Juego)   │  │
│  │   └── styles.css (Estilos)   │  │
│  └──────────────────────────────┘  │
│                                     │
│  📦 localStorage (Datos temporales) │
└─────────────────────────────────────┘
```

**Tecnologías Sprint 1:**
- HTML5
- CSS3
- JavaScript ES6+ (Vanilla)
- Bootstrap 5
- Font Awesome

### Sprint 2 - Arquitectura Cliente-Servidor

```
┌──────────────────────────────────────────────────────┐
│                    NAVEGADOR WEB                      │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │          FRONTEND (Puerto 3000)                │ │
│  │                                                │ │
│  │  • welcome.html (Landing)                     │ │
│  │  • login.html (Autenticación)                 │ │
│  │  • register.html (Registro)                   │ │
│  │  • index.html (Juego)                         │ │
│  │  • styles.css (Estilos)                       │ │
│  │  • app.js, RondaGame.js (Lógica)              │ │
│  │                                                │ │
│  │  Classes (OOP):                               │ │
│  │  • Usuario.js (Abstract)                      │ │
│  │  • Jugador.js (extends Usuario)               │ │
│  │  • Administrador.js (extends Usuario)         │ │
│  │  • DBControlador.js (CRUD)                    │ │
│  └────────────────────────────────────────────────┘ │
│                         ↕                            │
│                    fetch API                         │
│                  (HTTP Requests)                     │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│              SERVIDOR BACKEND (Node.js)              │
│                  Puerto: 3000                        │
│                                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │         server.js (Express.js)                 │ │
│  │                                                │ │
│  │  Middleware:                                   │ │
│  │  • cors (CORS policy)                          │ │
│  │  • express.json() (JSON parser)                │ │
│  │  • express-session (Sesiones)                  │ │
│  │  • express.static() (Archivos estáticos)       │ │
│  │                                                │ │
│  │  API Routes:                                   │ │
│  │  • POST /api/register                          │ │
│  │  • POST /api/login                             │ │
│  │  • POST /api/logout                            │ │
│  │  • GET  /api/session                           │ │
│  │  • GET  /api/profile                           │ │
│  │                                                │ │
│  │  Libraries:                                    │ │
│  │  • bcrypt (Hashing passwords)                  │ │
│  │  • mysql2 (MySQL driver)                       │ │
│  └────────────────────────────────────────────────┘ │
│                         ↕                            │
│                   mysql2/promise                     │
│                  (Connection Pool)                   │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│            BASE DE DATOS MySQL 8.0                    │
│                  (XAMPP - Puerto 3306)               │
│                                                       │
│  Database: ronda_marroqui                            │
│                                                       │
│  Tablas:                                             │
│  ┌──────────────────────────────────────┐           │
│  │ 1. Usuario (Jugadores y Admins)      │           │
│  │ 2. Torneo (Competiciones)            │           │
│  │ 3. Partida (Juegos individuales)     │           │
│  │ 4. Movimiento (Historial de jugadas) │           │
│  │ 5. Partida_Jugador (N:M)             │           │
│  │ 6. Clasificacion_Torneo (Rankings)   │           │
│  └──────────────────────────────────────┘           │
│                                                       │
│  Foreign Keys + Constraints + Indexes                │
└──────────────────────────────────────────────────────┘
```

**Nuevas Tecnologías Sprint 2:**
- **Backend**: Node.js 16+, Express.js 4.18.2
- **Base de Datos**: MySQL 8.0 (vía XAMPP)
- **Driver BD**: mysql2 3.6.0 (promise-based)
- **Seguridad**: bcrypt 5.1.1, express-session 1.17.3
- **Middleware**: cors 2.8.5
- **OOP**: Clases ES6+ con herencia

---

## 📊 Comparación Detallada

### Almacenamiento de Datos

| Característica | Sprint 1 | Sprint 2 |
|----------------|----------|----------|
| **Tipo** | localStorage (navegador) | MySQL (servidor) |
| **Persistencia** | ❌ Temporal, por navegador | ✅ Permanente, centralizada |
| **Usuarios** | ❌ Simulados, sin registro | ✅ Reales, con registro |
| **Contraseñas** | ❌ Plain text en memoria | ✅ Hasheadas con bcrypt |
| **Sesiones** | ❌ No implementadas | ✅ Express-session (24h) |
| **Estadísticas** | ❌ Locales, no compartidas | ✅ Globales, ranking real |
| **Escalabilidad** | ❌ Limitado a 1 navegador | ✅ Múltiples usuarios simultáneos |

### Autenticación

| Característica | Sprint 1 | Sprint 2 |
|----------------|----------|----------|
| **Login** | ❌ Simulado | ✅ Real con BD |
| **Registro** | ❌ No disponible | ✅ Formulario completo |
| **Validación** | ❌ Solo frontend | ✅ Frontend + Backend |
| **Seguridad** | ❌ Sin cifrado | ✅ bcrypt + sesiones |
| **Roles** | ❌ No implementados | ✅ Jugador/Admin |
| **Sesión persistente** | ❌ No | ✅ Sí (24 horas) |

### Páginas Web

| Página | Sprint 1 | Sprint 2 |
|--------|----------|----------|
| **welcome.html** | ❌ No existe | ✅ Landing page profesional |
| **login.html** | ❌ No existe | ✅ Login con BD |
| **register.html** | ❌ No existe | ✅ Registro completo |
| **index.html** | ✅ Juego básico | ✅ Juego + sesión activa |

### Clases JavaScript

| Clase | Sprint 1 | Sprint 2 |
|-------|----------|----------|
| **RondaGame** | ✅ Lógica del juego | ✅ Mantenida |
| **Usuario** | ❌ No existe | ✅ Clase abstracta base |
| **Jugador** | ❌ No existe | ✅ Hereda de Usuario |
| **Administrador** | ❌ No existe | ✅ Hereda de Usuario |
| **DBControlador** | ❌ No existe | ✅ CRUD completo |

### Funcionalidades

| Funcionalidad | Sprint 1 | Sprint 2 |
|---------------|----------|----------|
| **Jugar cartas** | ✅ Implementado | ✅ Mantenido |
| **Robar cartas** | ✅ Implementado | ✅ Mantenido |
| **Validar jugadas** | ✅ Implementado | ✅ Mantenido |
| **Detectar ganador** | ✅ Implementado | ✅ Mantenido |
| **Registro usuarios** | ❌ No | ✅ Implementado |
| **Login usuarios** | ❌ No | ✅ Implementado |
| **Gestión sesiones** | ❌ No | ✅ Implementado |
| **Estadísticas BD** | ❌ No | ✅ Implementado |
| **Roles usuarios** | ❌ No | ✅ Implementado |
| **Torneos** | ❌ No | 🔄 Estructura BD lista |
| **Ranking global** | ❌ No | 🔄 Estructura BD lista |
| **Historial partidas** | ❌ No | 🔄 Estructura BD lista |

---

## 📁 Archivos Nuevos en Sprint 2

### Backend
```
src/backend/
└── server.js (386 líneas) ← NUEVO
    - Configuración Express
    - API REST endpoints
    - Conexión MySQL
    - Gestión de sesiones
    - Middleware de autenticación
```

### Clases OOP
```
src/
├── Usuario.js (71 líneas) ← NUEVO
│   - Clase abstracta base
│   - Métodos comunes (getId, getNombre, getEmail, etc.)
│   - Sistema de estadísticas
│
├── Jugador.js (90 líneas) ← NUEVO
│   - Hereda de Usuario
│   - Sistema de nivel y experiencia
│   - Gestión de partidas activas
│
├── Administrador.js (150 líneas) ← NUEVO
│   - Hereda de Usuario
│   - 17 permisos administrativos
│   - Gestión de torneos y usuarios
│
└── DBControlador.js (420 líneas) ← NUEVO
    - CRUD Usuarios
    - CRUD Partidas
    - CRUD Torneos
    - Gestión de estadísticas
```

### Páginas Web
```
src/
├── welcome.html (350 líneas) ← NUEVO
│   - Landing page
│   - Presentación del juego
│   - CTAs para login/registro
│
├── login.html (286 líneas) ← NUEVO
│   - Formulario de login
│   - Integración con API
│   - Validaciones
│
└── register.html (406 líneas) ← NUEVO
    - Formulario de registro
    - Indicador de fortaleza de contraseña
    - Validaciones frontend/backend
```

### Configuración
```
src/
└── db-config.js (45 líneas) ← NUEVO
    - Configuración MySQL para XAMPP
    - Pool de conexiones
```

### Base de Datos
```
database/
└── sprint2.sql (120 líneas) ← NUEVO
    - 6 tablas relacionales
    - Foreign keys
    - Constraints e índices
```

### Scripts
```
├── INICIAR.bat (15 líneas) ← NUEVO
│   - Inicia servidor automáticamente
│
└── REINICIAR.bat (20 líneas) ← NUEVO
    - Reinicia servidor
```

### Configuración Node.js
```
├── package.json ← NUEVO
│   - Dependencias del proyecto
│   - Scripts npm
│
└── package-lock.json ← NUEVO
    - Versiones exactas de dependencias
```

---

## 🔧 Archivos Modificados de Sprint 1

### index.html
**Cambios:**
- ✅ Detección de sesión activa
- ✅ Muestra nombre de usuario logueado
- ✅ Botón de cerrar sesión
- ✅ Redirección a login si no hay sesión

### app.js
**Cambios:**
- ✅ Integración con clases Usuario/Jugador
- ✅ Verificación de sesión al cargar
- ✅ Actualización de estadísticas en BD
- ✅ Sincronización con backend

### styles.css
**Cambios:**
- ✅ Estilos para páginas de autenticación
- ✅ Animaciones mejoradas
- ✅ Responsive design optimizado
- ✅ Tema consistente en todas las páginas

---

## 🎨 Interfaz de Usuario

### Nuevas Páginas

#### 1. Página de Bienvenida (welcome.html)
**Elementos:**
- Hero section con título animado
- Descripción del juego
- 2 CTAs principales: "Jugar Ahora" y "Crear Cuenta"
- Sección de características (3 cards)
- Sección de información del juego
- Animaciones de cartas flotantes (4 palos)
- Detección de sesión activa

**Diseño:**
- Background: Gradiente azul oscuro
- Animaciones: Glow effects, floating cards
- Responsive: Adaptado a móvil y desktop
- Iconos: Font Awesome 6.4.0

#### 2. Página de Login (login.html)
**Elementos:**
- Formulario centrado con glassmorphism
- Campos: Email, Contraseña
- Validación HTML5 y JavaScript
- Mensajes de error/éxito
- Link a página de registro
- Animaciones de carga

**Funcionalidad:**
- Validación en tiempo real
- Llamada a API /api/login
- Redirección automática tras login exitoso
- Manejo de errores detallado

#### 3. Página de Registro (register.html)
**Elementos:**
- Formulario completo
- Campos: Username, Email, Contraseña, Confirmar Contraseña, Rol
- Indicador de fortaleza de contraseña (visual)
- Validaciones múltiples
- Mensajes de error específicos
- Link a página de login

**Validaciones:**
- Username: mínimo 3 caracteres
- Email: formato válido
- Contraseña: mínimo 6 caracteres
- Confirmar contraseña: debe coincidir
- Verificación de unicidad en backend

---

## 🔐 Seguridad Sprint 2

### Nivel 1: Frontend
```javascript
✅ Validación HTML5 (required, type="email", minlength)
✅ Validación JavaScript antes de enviar
✅ Indicador de fortaleza de contraseña
✅ Confirmación de contraseña
✅ Mensajes de error descriptivos
```

### Nivel 2: Backend
```javascript
✅ Validación de todos los campos recibidos
✅ Verificación de longitudes mínimas
✅ Comprobación de unicidad (email/username)
✅ Sanitización de inputs
✅ Manejo de errores con try-catch
```

### Nivel 3: Base de Datos
```sql
✅ UNIQUE constraints en email y nombre_usuario
✅ NOT NULL en campos críticos
✅ ENUM para valores predefinidos
✅ Foreign Keys con ON DELETE CASCADE
✅ Indexes para optimización
```

### Nivel 4: Cifrado
```javascript
✅ bcrypt para hashing de contraseñas
✅ Salt rounds: 10
✅ Comparación segura con bcrypt.compare()
✅ No almacenamiento de contraseñas en plain text
```

### Nivel 5: Sesiones
```javascript
✅ express-session configurado
✅ Secret key fuerte
✅ Cookies HTTP-only (no accesibles por JS)
✅ Expiración: 24 horas
✅ Almacenamiento server-side
✅ Destrucción segura en logout
```

---

## 📦 Dependencias (package.json)

### Nuevas Dependencias Sprint 2
```json
{
  "dependencies": {
    "express": "^4.18.2",        // Framework web
    "mysql2": "^3.6.0",          // Driver MySQL con promises
    "bcrypt": "^5.1.1",          // Hashing de contraseñas
    "express-session": "^1.17.3", // Gestión de sesiones
    "cors": "^2.8.5"             // Middleware CORS
  },
  "scripts": {
    "start": "node src/backend/server.js"
  }
}
```

**Total de dependencias instaladas:** ~50 (incluyendo sub-dependencias)
**Tamaño node_modules:** ~45 MB

---

## 🎯 Requisitos Funcionales Implementados

### Sprint 1 - Requisitos Básicos
- ✅ **RF-02**: Crear partida (interfaz)
- ✅ **RF-03**: Jugar cartas (lógica básica)
- ✅ **RF-04**: Cartas especiales (As, Dos, Cuatro, Siete)
- ✅ **RF-05**: Detectar ganador
- ✅ **RF-06**: Ranking de jugadores (visual)

### Sprint 2 - Requisitos Nuevos
- ✅ **RF-01**: Gestionar roles (Jugador/Administrador)
- ✅ **RF-07**: Registrar usuario
- ✅ **RF-08**: Iniciar sesión
- ✅ **RF-09**: Gestionar perfil de usuario
- ✅ **RF-10**: Ver estadísticas personales
- ✅ **RF-11**: Crear torneo (estructura BD)
- ✅ **RF-12**: Gestionar torneos (estructura BD)
- ✅ **RF-13**: Ver ranking global (estructura BD)

### Requisitos No Funcionales Sprint 2
- ✅ **RNF-04**: Seguridad (bcrypt + sesiones + HTTPS-ready)
- ✅ **RNF-05**: Escalabilidad (arquitectura cliente-servidor)

---

## 📈 Métricas de Crecimiento

### Líneas de Código
| Métrica | Sprint 1 | Sprint 2 | Incremento |
|---------|----------|----------|------------|
| **Archivos JS** | 2 | 9 | +350% |
| **Archivos HTML** | 1 | 4 | +300% |
| **Líneas JS** | ~800 | ~2500 | +212% |
| **Líneas HTML** | ~400 | ~1400 | +250% |
| **Líneas SQL** | 0 | 120 | +∞ |
| **Archivos totales** | 5 | 22 | +340% |

### Funcionalidades
| Categoría | Sprint 1 | Sprint 2 | Incremento |
|-----------|----------|----------|------------|
| **Páginas web** | 1 | 4 | +300% |
| **API endpoints** | 0 | 5 | +∞ |
| **Tablas BD** | 0 | 6 | +∞ |
| **Clases OOP** | 1 | 5 | +400% |
| **Scripts utilidad** | 0 | 2 | +∞ |

---

## 🚀 Cómo Ejecutar Sprint 2

### Requisitos Previos
1. **XAMPP** instalado y ejecutándose
2. **MySQL** activo (puerto 3306)
3. **Node.js 16+** instalado
4. Base de datos `ronda_marroqui` creada
5. Tablas creadas (importar `database/sprint2.sql`)

### Instalación
```powershell
# 1. Instalar dependencias
npm install

# 2. Importar base de datos
# Abrir phpMyAdmin → Crear BD "ronda_marroqui" → Importar sprint2.sql
```

### Ejecución
```powershell
# Opción 1: Script automático
.\INICIAR.bat

# Opción 2: Manual
node src/backend/server.js
```

### Acceso
```
http://localhost:3000
```

---

## 📝 Resumen de Cambios Clave

### ✅ Lo que se mantiene de Sprint 1
- RondaGame.js (lógica del juego)
- Interfaz del juego (index.html)
- Sistema de cartas (40 cartas españolas)
- Validación de jugadas
- Detección de ganador
- Animaciones y estilos base

### 🆕 Lo que se añade en Sprint 2
- Sistema completo de autenticación
- Backend Node.js + Express
- Base de datos MySQL (6 tablas)
- Arquitectura OOP (5 clases)
- API REST (5 endpoints)
- Seguridad (bcrypt + sesiones)
- 3 páginas nuevas (welcome, login, register)
- Sistema de roles (jugador/admin)
- Persistencia de datos
- Escalabilidad multi-usuario

### 🔄 Lo que se modifica de Sprint 1
- index.html (+ detección de sesión)
- app.js (+ integración con backend)
- styles.css (+ estilos para autenticación)

---

## 🎓 Conclusión

**Sprint 2** representa una **evolución completa** del proyecto, transformándolo de una **aplicación frontend simple** a un **sistema web completo** con arquitectura cliente-servidor, persistencia de datos, autenticación real y seguridad robusta.

### Logros Principales:
1. ✅ **Backend funcional** con Node.js y Express
2. ✅ **Base de datos relacional** con 6 tablas
3. ✅ **Autenticación completa** (registro + login + sesiones)
4. ✅ **Arquitectura OOP** con herencia (Usuario → Jugador/Admin)
5. ✅ **API REST** con 5 endpoints
6. ✅ **Seguridad robusta** (bcrypt + sesiones + validaciones)
7. ✅ **Interfaz profesional** con 3 páginas nuevas
8. ✅ **Código limpio** sin comentarios (entregable)

### Estado del Proyecto:
- **Sprint 1**: ✅ Completado
- **Sprint 2**: ✅ Completado y listo para entregar
- **Sprint 3** (futuro): Implementación de juego multijugador en tiempo real

---

**Fecha de documento**: 04/11/2025  
**Autores**: Yahya Aboulafiya, Adrián Hoyos Sánchez, Souhail Batah, Carlos Robledo Badía  
**Curso**: Ingeniería Informática 2024-2025  
**Universidad**: UPV ALCOY
