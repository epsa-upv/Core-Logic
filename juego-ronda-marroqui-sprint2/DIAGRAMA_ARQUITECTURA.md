# 📊 DIAGRAMA DE ARQUITECTURA - AUTENTICACIÓN

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE AUTENTICACIÓN                     │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│   REGISTRO   │   →→→   │    LOGIN     │   →→→   │     JUEGO    │
│ register.html│         │  login.html  │         │  index.html  │
│              │         │              │         │              │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ POST /api/register     │ POST /api/login        │ Requiere
       ↓                        ↓                        ↓ sesión
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVIDOR EXPRESS (Node.js)                       │
│                      http://localhost:3000                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ /api/register│  │  /api/login  │  │ /api/session │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                  │                     │
│         ↓                 ↓                  ↓                     │
│  ┌────────────────────────────────────────────────────┐           │
│  │         BCRYPT (Hash de Contraseñas)               │           │
│  │         EXPRESS-SESSION (Gestión de Sesiones)      │           │
│  └────────────────────────────────────────────────────┘           │
│                         │                                          │
│                         ↓                                          │
│  ┌────────────────────────────────────────────────────┐           │
│  │            MySQL2 (Conector MySQL)                 │           │
│  └────────────────────────────────────────────────────┘           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    XAMPP - MySQL Database                           │
│                      localhost:3306                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Base de datos: ronda_marroqui                  │  │
│  │                                                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │   Usuario    │  │   Partida    │  │    Torneo    │    │  │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤    │  │
│  │  │ id_usuario   │  │ id_partida   │  │ id_torneo    │    │  │
│  │  │ nombre_usuario│ │ estado       │  │ nombre       │    │  │
│  │  │ email ✓     │  │ ganador_id   │  │ fecha_inicio │    │  │
│  │  │ contraseña   │  │ perdedor_id  │  │ fecha_fin    │    │  │
│  │  │ rol          │  │ fecha        │  │ num_jugadores│    │  │
│  │  │ partidas_*   │  └──────────────┘  └──────────────┘    │  │
│  │  └──────────────┘                                        │  │
│  │                                                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │ Movimiento   │  │Partida_Jugador│ │Clasificacion_│    │  │
│  │  │              │  │              │  │    Torneo    │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 FLUJO DETALLADO DE REGISTRO

```
1. Usuario abre register.html
   │
   ├─→ Llena formulario (username, email, password, rol)
   │
   └─→ Click en "Registrarse"
       │
       ├─→ Frontend valida:
       │   • password === confirmPassword
       │   • password.length >= 6
       │   • username.length >= 3
       │
       └─→ fetch('http://localhost:3000/api/register', {
               method: 'POST',
               body: JSON.stringify({username, email, password, rol})
           })
           │
           ├─→ Backend (server.js):
           │   │
           │   ├─→ Verifica email no exista en DB
           │   ├─→ Verifica username no exista en DB
           │   ├─→ Hashea password con bcrypt
           │   └─→ INSERT INTO Usuario VALUES (...)
           │
           └─→ Respuesta:
               • SUCCESS: {success: true, user: {...}}
               • ERROR: {success: false, message: "..."}
               │
               ├─→ SUCCESS: 
               │   └─→ Redirige a login.html
               │
               └─→ ERROR:
                   └─→ Muestra mensaje de error
```

## 🔐 FLUJO DETALLADO DE LOGIN

```
1. Usuario abre login.html
   │
   ├─→ Ingresa email y password
   │
   └─→ Click en "Iniciar Sesión"
       │
       └─→ fetch('http://localhost:3000/api/login', {
               method: 'POST',
               credentials: 'include', // ¡Importante para cookies!
               body: JSON.stringify({email, password})
           })
           │
           ├─→ Backend (server.js):
           │   │
           │   ├─→ SELECT * FROM Usuario WHERE email = ?
           │   ├─→ bcrypt.compare(password, user.contraseña)
           │   ├─→ Crea sesión:
           │   │   req.session.userId = user.id_usuario
           │   │   req.session.username = user.nombre_usuario
           │   │   req.session.rol = user.rol
           │   │
           │   └─→ Devuelve datos del usuario (sin contraseña)
           │
           └─→ Respuesta:
               • SUCCESS: {success: true, user: {...}}
               • ERROR: {success: false, message: "..."}
               │
               ├─→ SUCCESS:
               │   ├─→ sessionStorage.setItem('currentUser', JSON.stringify(user))
               │   └─→ Redirige a index.html
               │
               └─→ ERROR:
                   └─→ Muestra "Email o contraseña incorrectos"
```

## 🎮 FLUJO EN EL JUEGO

```
1. Usuario abre index.html
   │
   ├─→ JavaScript verifica sessionStorage.getItem('currentUser')
   │
   ├─→ SI NO HAY USUARIO:
   │   └─→ Redirige a login.html
   │
   └─→ SI HAY USUARIO:
       │
       ├─→ Muestra nombre de usuario en UI
       ├─→ Muestra estadísticas (partidas ganadas/perdidas)
       └─→ Permite jugar
```

## 🔒 SEGURIDAD IMPLEMENTADA

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE SEGURIDAD                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CONTRASEÑAS                                            │
│     ┌────────────────────────────────────┐                │
│     │ Texto Plano: "mipassword123"       │                │
│     │        ↓                            │                │
│     │ bcrypt.hash()                       │                │
│     │        ↓                            │                │
│     │ Hash: "$2b$10$8KjQ3..."            │                │
│     └────────────────────────────────────┘                │
│     • NUNCA se guarda el texto plano                       │
│     • Salt rounds: 10                                      │
│     • Verificación con bcrypt.compare()                    │
│                                                             │
│  2. SESIONES                                               │
│     ┌────────────────────────────────────┐                │
│     │ express-session                     │                │
│     │  • Cookie httpOnly: true            │                │
│     │  • Cookie secure: false (dev)       │                │
│     │  • Max age: 24 horas                │                │
│     │  • Secret: "ronda_marroqui..."      │                │
│     └────────────────────────────────────┘                │
│                                                             │
│  3. BASE DE DATOS                                          │
│     ┌────────────────────────────────────┐                │
│     │ • Email UNIQUE                      │                │
│     │ • Username UNIQUE                   │                │
│     │ • Foreign Keys con ON DELETE        │                │
│     │ • NOT NULL en campos críticos       │                │
│     └────────────────────────────────────┘                │
│                                                             │
│  4. VALIDACIONES                                           │
│     Frontend:                Backend:                      │
│     • Longitud password       • Email existe?              │
│     • Passwords coinciden     • Username existe?           │
│     • Campos requeridos       • Password válido?           │
│                               • SQL injection prevention   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📂 ESTRUCTURA DE ARCHIVOS

```
juego-ronda-marroqui-sprint2/
│
├── src/
│   ├── backend/
│   │   └── server.js .................... 🆕 Servidor Express
│   │
│   ├── login.html ....................... ✏️ Conectado a MySQL
│   ├── register.html .................... ✏️ Conectado a MySQL
│   ├── index.html ....................... (Tablero de juego)
│   ├── app.js ........................... (Lógica del juego)
│   ├── RondaGame.js ..................... (Motor del juego)
│   ├── styles.css ....................... (Estilos)
│   │
│   ├── DBControlador.js ................. (CRUD operations)
│   ├── db-config.js ..................... (Configuración MySQL)
│   ├── Usuario.js ....................... (Clase abstracta)
│   ├── Jugador.js ....................... (Hereda de Usuario)
│   └── Administrador.js ................. (Hereda de Usuario)
│
├── database/
│   └── sprint2.sql ...................... (Schema completo)
│
├── doc/
│   ├── ERS_v2.0.md
│   └── ERS_v2.0.html
│
├── package.json ......................... 🆕 Dependencias Node.js
├── .gitignore ........................... 🆕 Archivos ignorados
├── INICIAR.bat .......................... 🆕 Script inicio rápido
├── AUTENTICACION_COMPLETA.md ............ 🆕 Esta guía
├── INSTALACION_XAMPP.md ................. (Guía XAMPP)
├── README.md ............................ (Documentación general)
├── SPRINT2_COMPLETADO.md ................ (Resumen Sprint 2)
└── INICIO_RAPIDO.md ..................... (Quick start)
```

## 🎯 COMANDOS ÚTILES

### Iniciar Todo (Windows):
```powershell
# Método 1: Archivo BAT
.\INICIAR.bat

# Método 2: Manual
npm start
```

### Verificar Estado:
```powershell
# Ver usuarios en la base de datos (MySQL):
mysql -u root -p
USE ronda_marroqui;
SELECT * FROM Usuario;

# Ver tablas:
SHOW TABLES;
```

### Probar API con PowerShell:
```powershell
# Registrar usuario:
Invoke-RestMethod -Uri "http://localhost:3000/api/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"test","email":"test@test.com","password":"123456","rol":"jugador"}'

# Login:
Invoke-RestMethod -Uri "http://localhost:3000/api/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@test.com","password":"123456"}'
```

## ✅ CHECKLIST DE VERIFICACIÓN

### XAMPP:
- [ ] XAMPP instalado
- [ ] Apache iniciado (verde)
- [ ] MySQL iniciado (verde)
- [ ] phpMyAdmin accesible: http://localhost/phpmyadmin

### Base de Datos:
- [ ] Base de datos `ronda_marroqui` creada
- [ ] Tabla `Usuario` existe
- [ ] Tabla `Partida` existe
- [ ] Tabla `Torneo` existe
- [ ] Script `sprint2.sql` importado

### Backend:
- [ ] Node.js instalado (v16+)
- [ ] `npm install` ejecutado
- [ ] Servidor iniciado (`npm start`)
- [ ] Ver mensaje "Servidor corriendo en: http://localhost:3000"
- [ ] Ver mensaje "✅ Conexión exitosa a MySQL"

### Frontend:
- [ ] Página de registro funciona
- [ ] Página de login funciona
- [ ] Usuario se guarda en base de datos
- [ ] Login redirige a index.html
- [ ] Sesión se mantiene

---

**🎉 ¡Sistema completamente funcional con autenticación real!**
