# 🚀 Guía Rápida de Inicio - Ronda Marroquí Sprint 2

## Instalación Rápida con XAMPP (5 minutos)

### 1. Instalar XAMPP
1. Descargar desde: **https://www.apachefriends.org/es/index.html**
2. Ejecutar el instalador
3. Instalar en `C:\xampp` (ruta por defecto)
4. Seleccionar: Apache, MySQL, PHP, phpMyAdmin

### 2. Iniciar XAMPP
1. Abrir "XAMPP Control Panel"
2. Hacer clic en **Start** junto a Apache
3. Hacer clic en **Start** junto a MySQL
4. Verificar que ambos estén en **verde** (Running)

### 3. Crear la Base de Datos
1. Abrir navegador: **http://localhost/phpmyadmin**
2. Hacer clic en **"Nueva"** (menú izquierdo)
3. Nombre: `ronda_marroqui`
4. Hacer clic en **"Crear"**
5. Ir a la pestaña **"SQL"**
6. Copiar y pegar todo el contenido de: `database/sprint2.sql`
7. Hacer clic en **"Continuar"**
8. ✅ ¡Listo! Verifica que aparezcan 6 tablas

### 4. Configuración
**✅ No necesitas cambiar nada** - XAMPP usa configuración por defecto:
- Usuario: `root`
- Contraseña: (vacía)
- Host: `localhost`
- Puerto: `3306`

### 4. Abrir en Navegador
- **Login:** Abrir `src/login.html`
- **Registro:** Abrir `src/register.html`
- **Juego:** Abrir `src/index.html`

## Credenciales de Prueba
- **Email:** test@ejemplo.com
- **Contraseña:** test123

## Estructura de Archivos
```
juego-ronda-marroqui-sprint2/
├── database/sprint2.sql          # Script de BD
├── doc/ERS_v2.0.md               # Documentación
├── src/
│   ├── login.html                # Inicio de sesión
│   ├── register.html             # Registro
│   ├── index.html                # Juego
│   ├── DBControlador.js          # CRUD
│   ├── Usuario.js                # Clase base
│   ├── Jugador.js                # Clase jugador
│   └── Administrador.js          # Clase admin
└── README.md                     # Documentación completa
```

## Características Principales

### ✅ Sistema de Usuarios
- Registro de nuevos usuarios
- Login con autenticación
- Roles: Jugador y Administrador
- Sistema de experiencia y niveles

### ✅ Base de Datos
- 6 tablas relacionadas
- Seguridad con hashing de contraseñas
- Integridad referencial
- Historial de partidas y movimientos

### ✅ Gestión
- CRUD completo de usuarios
- Gestión de partidas
- Sistema de torneos
- Clasificaciones y rankings

## Próximos Pasos
1. Revisar la documentación completa en `README.md`
2. Explorar el código fuente en `src/`
3. Consultar el ERS v2.0 en `doc/`
4. Probar las funcionalidades de login y registro

## Soporte
Consultar el archivo `README.md` para instrucciones detalladas.

---
**Equipo:** Yahya Aboulafiya, Adrián Hoyos Sánchez, Souhail Batah, Carlos Robledo Badía  
**Versión:** 2.0 (Sprint 2)  
**Fecha:** 01/11/2025
