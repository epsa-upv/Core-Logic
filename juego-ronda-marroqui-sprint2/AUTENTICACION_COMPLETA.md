# 🔐 GUÍA COMPLETA: Autenticación con Base de Datos

## ✅ PROBLEMA SOLUCIONADO

Las páginas `login.html` y `register.html` ahora están **completamente conectadas** a la base de datos MySQL a través de un servidor backend Express.

---

## 📋 FLUJO COMPLETO DE AUTENTICACIÓN

### 1. REGISTRO (register.html → MySQL)
```
Usuario llena formulario
    ↓
Frontend valida datos
    ↓
Envía POST a /api/register
    ↓
Backend verifica email/usuario no existan
    ↓
Backend hashea contraseña (bcrypt)
    ↓
Backend inserta en tabla Usuario
    ↓
Frontend recibe confirmación
    ↓
Redirige a login.html
```

### 2. LOGIN (login.html → MySQL)
```
Usuario ingresa credenciales
    ↓
Envía POST a /api/login
    ↓
Backend busca usuario por email
    ↓
Backend compara contraseña hasheada
    ↓
Backend crea sesión
    ↓
Frontend guarda datos en sessionStorage
    ↓
Redirige a index.html
```

---

## 🚀 INSTALACIÓN PASO A PASO

### PASO 1: Instalar XAMPP (Si no lo tienes)
1. Descargar: https://www.apachefriends.org/es/index.html
2. Instalar en `C:\xampp`
3. Abrir XAMPP Control Panel
4. Iniciar **Apache** y **MySQL**

### PASO 2: Crear Base de Datos
1. Abrir navegador: http://localhost/phpmyadmin
2. Click en "Nueva"
3. Nombre: `ronda_marroqui`
4. Click en "Crear"
5. Click en pestaña "SQL"
6. Copiar y pegar contenido de `database/sprint2.sql`
7. Click en "Continuar"
8. ✅ Verifica que aparezcan 6 tablas

### PASO 3: Instalar Node.js (Si no lo tienes)
1. Descargar: https://nodejs.org/es/
2. Instalar versión LTS (recomendada)
3. Verificar instalación:
```powershell
node --version
npm --version
```

### PASO 4: Instalar Dependencias del Backend
Abrir PowerShell en la carpeta del proyecto:
```powershell
cd "c:\Users\aboul\Desktop\Ingeneria de informatica 25-26\Proyecto de ISO\mi_Proyecto\juego-ronda-marroqui-sprint2"
npm install
```

Esto instalará:
- ✅ `express` - Framework web
- ✅ `mysql2` - Conector MySQL
- ✅ `bcrypt` - Hash de contraseñas
- ✅ `express-session` - Manejo de sesiones
- ✅ `cors` - CORS para peticiones

### PASO 5: Iniciar el Servidor Backend
```powershell
npm start
```

Deberías ver:
```
✅ Conexión exitosa a MySQL
   Database: ronda_marroqui
   Host: localhost:3306

╔════════════════════════════════════════╗
║   🎮 SERVIDOR RONDA MARROQUÍ ACTIVO   ║
╚════════════════════════════════════════╝

🌐 Servidor corriendo en: http://localhost:3000
📊 Base de datos: ronda_marroqui

📍 Rutas disponibles:
   - POST /api/register  → Registrar usuario
   - POST /api/login     → Iniciar sesión
   - POST /api/logout    → Cerrar sesión
   - GET  /api/session   → Obtener sesión actual
```

### PASO 6: Probar la Aplicación
1. Abrir navegador: http://localhost:3000/src/register.html
2. Crear una cuenta nueva
3. Verificar en phpMyAdmin que el usuario se guardó
4. Probar login: http://localhost:3000/src/login.html
5. Entrar al juego: http://localhost:3000/src/index.html

---

## 🔍 VERIFICACIÓN EN phpMyAdmin

### Ver usuarios registrados:
1. Abrir: http://localhost/phpmyadmin
2. Click en base de datos `ronda_marroqui`
3. Click en tabla `Usuario`
4. Click en "Examinar"

Deberías ver columnas:
- `id_usuario` - ID autoincremental
- `nombre_usuario` - Nombre del usuario
- `email` - Email del usuario
- `contraseña` - Hash bcrypt (NO se guarda en texto plano)
- `rol` - jugador o administrador
- `fecha_registro` - Fecha de creación
- `partidas_ganadas`, `partidas_perdidas`, `partidas_jugadas` - Estadísticas

---

## 🧪 PRUEBAS MANUALES

### Probar Registro:
```javascript
// Abrir consola del navegador (F12) en register.html
// El formulario debería funcionar normalmente
```

**Casos de prueba:**
- ✅ Registrar usuario nuevo → debe funcionar
- ❌ Registrar mismo email → debe mostrar error "El email ya está registrado"
- ❌ Registrar mismo username → debe mostrar error "El nombre de usuario ya está en uso"
- ❌ Contraseña < 6 caracteres → debe mostrar error

### Probar Login:
```javascript
// Abrir consola del navegador (F12) en login.html
```

**Casos de prueba:**
- ✅ Login con credenciales correctas → debe redirigir a index.html
- ❌ Login con email incorrecto → debe mostrar "Email o contraseña incorrectos"
- ❌ Login con contraseña incorrecta → debe mostrar "Email o contraseña incorrectos"

---

## 📁 ARCHIVOS MODIFICADOS/CREADOS

### ✅ Archivos Nuevos:
1. **`src/backend/server.js`** (9.5 KB)
   - Servidor Express con autenticación
   - Rutas POST /api/register, /api/login
   - Conexión con MySQL
   - Hash de contraseñas con bcrypt

2. **`package.json`**
   - Dependencias del proyecto
   - Scripts para iniciar servidor

### ✅ Archivos Modificados:
1. **`src/login.html`**
   - JavaScript actualizado
   - Ahora hace fetch a `http://localhost:3000/api/login`
   - Muestra errores reales de la base de datos

2. **`src/register.html`**
   - JavaScript actualizado
   - Ahora hace fetch a `http://localhost:3000/api/register`
   - Valida unicidad de email/username

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

### ❌ Error: "ECONNREFUSED localhost:3000"
**Causa:** El servidor backend no está ejecutándose
**Solución:**
```powershell
npm start
```

### ❌ Error: "Access denied for user 'root'"
**Causa:** Configuración incorrecta de MySQL
**Solución:** Verificar `src/backend/server.js` línea 23:
```javascript
password: '', // XAMPP por defecto no tiene contraseña
```

### ❌ Error: "Unknown database 'ronda_marroqui'"
**Causa:** La base de datos no existe
**Solución:**
1. Abrir phpMyAdmin
2. Crear base de datos `ronda_marroqui`
3. Importar `database/sprint2.sql`

### ❌ Error: "Cannot find module 'express'"
**Causa:** Dependencias no instaladas
**Solución:**
```powershell
npm install
```

### ❌ Error: "Port 3000 is already in use"
**Causa:** El puerto ya está ocupado
**Solución:** Cambiar puerto en `server.js` línea 12:
```javascript
const PORT = 3001; // Cambiar a otro puerto
```

---

## 🔐 SEGURIDAD IMPLEMENTADA (RNF-04)

### ✅ Contraseñas:
- Hasheadas con bcrypt (salt rounds: 10)
- NUNCA se almacenan en texto plano
- Comparación segura con bcrypt.compare()

### ✅ Sesiones:
- express-session con cookie httpOnly
- Duración: 24 horas
- Secret key única (cambiar en producción)

### ✅ Validaciones:
- Email único en base de datos
- Username único en base de datos
- Longitud mínima de contraseña: 6 caracteres
- Validación en frontend Y backend (doble capa)

### ✅ Base de Datos:
- Foreign keys para integridad referencial
- Índices únicos en email y nombre_usuario
- Constraints NOT NULL en campos obligatorios

---

## 📊 TABLA DE USUARIOS EN MySQL

```sql
CREATE TABLE Usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    rol ENUM('jugador', 'administrador') DEFAULT 'jugador',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    partidas_ganadas INT DEFAULT 0,
    partidas_perdidas INT DEFAULT 0,
    partidas_jugadas INT DEFAULT 0
);
```

**Ejemplo de registro:**
```
id_usuario: 1
nombre_usuario: juan_perez
email: juan@ejemplo.com
contraseña: $2b$10$8KjQ3... (hash bcrypt)
rol: jugador
fecha_registro: 2025-11-04 15:30:00
partidas_ganadas: 0
partidas_perdidas: 0
partidas_jugadas: 0
```

---

## 🎯 PRÓXIMOS PASOS

### 1. Cerrar Sesión (Logout)
Agregar botón en `index.html`:
```javascript
async function logout() {
    await fetch('http://localhost:3000/api/logout', {
        method: 'POST',
        credentials: 'include'
    });
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}
```

### 2. Proteger index.html
Agregar al inicio de `index.html`:
```javascript
<script>
window.addEventListener('load', () => {
    const user = sessionStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'login.html';
    }
});
</script>
```

### 3. Actualizar Estadísticas
Cuando termine una partida, llamar a:
```javascript
await fetch('http://localhost:3000/api/profile/update-stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ 
        partidas_ganadas: 1,
        partidas_jugadas: 1
    })
});
```

---

## 📞 CONTACTO Y SOPORTE

Si tienes problemas:
1. Verificar que XAMPP esté ejecutándose (MySQL en verde)
2. Verificar que `npm start` esté activo
3. Revisar consola del navegador (F12) para errores
4. Revisar terminal del servidor para logs

**Archivos clave para debug:**
- `src/backend/server.js` - Servidor backend
- `src/login.html` - Página de login
- `src/register.html` - Página de registro
- `database/sprint2.sql` - Esquema de base de datos

---

## ✅ CHECKLIST FINAL

- [x] XAMPP instalado y ejecutándose
- [x] Base de datos `ronda_marroqui` creada
- [x] Tablas importadas desde `sprint2.sql`
- [x] Node.js instalado
- [x] Dependencias instaladas (`npm install`)
- [x] Servidor backend ejecutándose (`npm start`)
- [x] Páginas HTML actualizadas con fetch real
- [x] Contraseñas hasheadas con bcrypt
- [x] Sesiones configuradas
- [x] Validaciones en frontend y backend

**🎉 ¡Sistema de autenticación completamente funcional con base de datos real!**
