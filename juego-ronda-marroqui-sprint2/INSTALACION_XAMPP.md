# 🎯 Guía de Instalación con XAMPP - Ronda Marroquí

Esta guía te ayudará a configurar el proyecto usando **XAMPP** (mucho más fácil que MySQL standalone).

---

## 📦 PASO 1: Descargar e Instalar XAMPP

### 1.1 Descargar XAMPP
1. Ve a: **https://www.apachefriends.org/es/index.html**
2. Descarga la versión para Windows (aproximadamente 150 MB)
3. Ejecuta el instalador `xampp-windows-x64-xxx-installer.exe`

### 1.2 Instalar XAMPP
1. Aceptar permisos de administrador
2. Ruta de instalación recomendada: `C:\xampp`
3. Seleccionar componentes (marcar):
   - ✅ Apache
   - ✅ MySQL
   - ✅ PHP
   - ✅ phpMyAdmin
4. Hacer clic en "Next" y esperar la instalación
5. Al finalizar, marcar "Do you want to start the Control Panel now?"

---

## 🚀 PASO 2: Iniciar los Servicios

### 2.1 Abrir XAMPP Control Panel
- Buscar en Windows: "XAMPP Control Panel"
- O ejecutar: `C:\xampp\xampp-control.exe`

### 2.2 Iniciar Apache y MySQL
1. Hacer clic en el botón **"Start"** junto a **Apache**
   - Esperar a que se ponga verde y diga "Running"
2. Hacer clic en el botón **"Start"** junto a **MySQL**
   - Esperar a que se ponga verde y diga "Running"

![XAMPP Control Panel](https://i.imgur.com/example.png)

```
Apache  [Running on port 80]   [Start] [Stop] [Admin] [Config] [Logs]
MySQL   [Running on port 3306] [Start] [Stop] [Admin] [Config] [Logs]
```

### 2.3 Verificar que funciona
1. Abrir navegador
2. Ir a: **http://localhost**
3. Deberías ver la página de bienvenida de XAMPP 🎉

---

## 🗄️ PASO 3: Crear la Base de Datos

### Opción A: Usando phpMyAdmin (MÁS FÁCIL) ⭐

#### 3.1 Acceder a phpMyAdmin
1. Abrir navegador
2. Ir a: **http://localhost/phpmyadmin**
3. No necesitas usuario/contraseña (XAMPP por defecto no tiene contraseña)

#### 3.2 Crear la Base de Datos
1. En phpMyAdmin, hacer clic en **"Nueva"** (o "New") en el menú izquierdo
2. Escribir el nombre: `ronda_marroqui`
3. En "Cotejamiento", seleccionar: `utf8mb4_general_ci`
4. Hacer clic en **"Crear"**

![Crear BD](https://i.imgur.com/create-db.png)

#### 3.3 Importar las Tablas
1. Hacer clic en la base de datos **"ronda_marroqui"** en el menú izquierdo
2. Hacer clic en la pestaña **"SQL"** (arriba)
3. Abrir el archivo del proyecto: `database/sprint2.sql` con un editor de texto
4. **Copiar todo el contenido** del archivo
5. **Pegar** en el área de texto de phpMyAdmin
6. Hacer clic en el botón **"Continuar"** (abajo a la derecha)

![Importar SQL](https://i.imgur.com/import-sql.png)

#### 3.4 Verificar que se creó correctamente
1. En phpMyAdmin, hacer clic en **"ronda_marroqui"** en el menú izquierdo
2. Deberías ver 6 tablas:
   - ✅ `Clasificacion_Torneo`
   - ✅ `Movimiento`
   - ✅ `Partida`
   - ✅ `Partida_Jugador`
   - ✅ `Torneo`
   - ✅ `Usuario`

---

### Opción B: Usando Línea de Comandos

Si prefieres usar la terminal:

```powershell
# 1. Ir a la carpeta de MySQL de XAMPP
cd C:\xampp\mysql\bin

# 2. Ejecutar MySQL
.\mysql.exe -u root

# 3. Crear la base de datos
CREATE DATABASE ronda_marroqui;
USE ronda_marroqui;

# 4. Importar el script (reemplaza la ruta con la tuya)
source C:\Users\TU_USUARIO\Desktop\Ingeneria de informatica 25-26\Proyecto de ISO\mi_Proyecto\juego-ronda-marroqui-sprint2\database\sprint2.sql

# 5. Verificar
SHOW TABLES;

# 6. Salir
exit;
```

---

## ⚙️ PASO 4: Configuración del Proyecto

### 4.1 Verificar la Configuración

La configuración por defecto de XAMPP ya está lista en el proyecto:

```javascript
// src/db-config.js
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',  // ⭐ XAMPP no tiene contraseña por defecto
    database: 'ronda_marroqui'
};
```

**✅ No necesitas cambiar nada si usas XAMPP con configuración por defecto**

### 4.2 Si cambiaste algo en XAMPP

Solo modifica `src/db-config.js` si:
- Cambiaste el puerto de MySQL (por defecto es 3306)
- Configuraste una contraseña para el usuario root
- Usas otro nombre de usuario

---

## 🎮 PASO 5: Ejecutar el Proyecto

### 5.1 Verificar que XAMPP esté ejecutándose
- Abrir **XAMPP Control Panel**
- Apache debe estar en verde (Running)
- MySQL debe estar en verde (Running)

### 5.2 Abrir el Juego en el Navegador

Tienes 3 opciones:

**Opción 1: Página de Login**
1. Navegar a la carpeta del proyecto
2. Hacer clic derecho en `src/login.html`
3. Abrir con tu navegador (Chrome, Firefox, Edge, etc.)

**Opción 2: Página de Registro**
1. Navegar a la carpeta del proyecto
2. Hacer clic derecho en `src/register.html`
3. Abrir con tu navegador

**Opción 3: Tablero de Juego**
1. Navegar a la carpeta del proyecto
2. Hacer clic derecho en `src/index.html`
3. Abrir con tu navegador

### 5.3 Probar el Sistema

#### Registrar un Usuario
1. Abrir `src/register.html`
2. Completar el formulario:
   - Nombre de usuario: `test`
   - Email: `test@ejemplo.com`
   - Contraseña: `test123`
   - Confirmar contraseña: `test123`
   - Tipo de usuario: `Jugador`
3. Hacer clic en "Crear Cuenta"

#### Iniciar Sesión
1. Abrir `src/login.html`
2. Ingresar:
   - Email: `test@ejemplo.com`
   - Contraseña: `test123`
3. Hacer clic en "Iniciar Sesión"
4. ¡Deberías ser redirigido al tablero de juego! 🎉

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### ❌ Problema: MySQL no inicia en XAMPP

**Causa:** El puerto 3306 está siendo usado por otro programa

**Solución:**
1. Abrir XAMPP Control Panel
2. Hacer clic en "Config" junto a MySQL
3. Seleccionar "my.ini"
4. Buscar la línea `port=3306`
5. Cambiar a otro puerto (ej: `port=3307`)
6. Guardar y reiniciar MySQL
7. Actualizar `src/db-config.js` con el nuevo puerto

### ❌ Problema: Apache no inicia

**Causa:** El puerto 80 está siendo usado (probablemente por Skype o IIS)

**Solución:**
1. Cerrar Skype o cualquier programa que use el puerto 80
2. O cambiar el puerto de Apache en XAMPP Config
3. Reiniciar Apache

### ❌ Problema: "Access denied for user 'root'"

**Causa:** La contraseña está mal configurada

**Solución:**
1. Verificar en `src/db-config.js` que `password: ''` (vacío)
2. Si configuraste contraseña en phpMyAdmin, úsala en db-config.js

### ❌ Problema: No aparecen las tablas en phpMyAdmin

**Causa:** El script SQL no se ejecutó correctamente

**Solución:**
1. Ir a phpMyAdmin
2. Seleccionar "ronda_marroqui"
3. Ir a la pestaña "SQL"
4. Volver a pegar el contenido de `database/sprint2.sql`
5. Hacer clic en "Continuar"
6. Revisar si hay errores en rojo

### ❌ Problema: "Cannot GET /phpmyadmin"

**Causa:** Apache no está ejecutándose

**Solución:**
1. Abrir XAMPP Control Panel
2. Iniciar Apache (botón Start)
3. Esperar a que se ponga verde
4. Volver a intentar

---

## 📝 Checklist de Instalación

Marca cada paso completado:

- [ ] XAMPP descargado e instalado
- [ ] Apache iniciado (verde en XAMPP Control Panel)
- [ ] MySQL iniciado (verde en XAMPP Control Panel)
- [ ] phpMyAdmin accesible en http://localhost/phpmyadmin
- [ ] Base de datos "ronda_marroqui" creada
- [ ] Script SQL importado exitosamente
- [ ] 6 tablas visibles en phpMyAdmin
- [ ] Archivo `src/db-config.js` verificado
- [ ] Página de login (`src/login.html`) abre correctamente
- [ ] Página de registro (`src/register.html`) abre correctamente
- [ ] Tablero de juego (`src/index.html`) abre correctamente

---

## 💡 Consejos Importantes

### ⚡ Uso Diario
- Siempre inicia XAMPP antes de usar el juego
- Apache y MySQL deben estar en verde (Running)
- Para detener: hacer clic en "Stop" en XAMPP Control Panel

### 🔒 Seguridad
- XAMPP es para desarrollo local, **NO para producción**
- La configuración por defecto no es segura (sin contraseña)
- Para producción, usa MySQL standalone con contraseñas fuertes

### 💾 Respaldos
- Los datos están en: `C:\xampp\mysql\data\ronda_marroqui\`
- Puedes exportar la BD desde phpMyAdmin (Exportar > SQL)

### 🚀 Rendimiento
- XAMPP consume recursos, ciérralo cuando no lo uses
- Puedes configurar que inicie automáticamente con Windows

---

## 🎓 Próximos Pasos

Una vez que tengas XAMPP configurado:

1. ✅ Explorar las páginas del juego
2. ✅ Registrar varios usuarios de prueba
3. ✅ Ver los datos en phpMyAdmin
4. ✅ Revisar la documentación completa en `README.md`
5. ✅ Explorar el código fuente en `src/`

---

## 📚 Recursos Adicionales

- **Documentación XAMPP:** https://www.apachefriends.org/faq.html
- **Tutoriales phpMyAdmin:** https://www.phpmyadmin.net/docs/
- **Documentación MySQL:** https://dev.mysql.com/doc/

---

## 📞 Soporte

Si tienes problemas con la instalación:
1. Revisa la sección "Solución de Problemas" arriba
2. Consulta la documentación oficial de XAMPP
3. Contacta al equipo de desarrollo

---

**✅ ¡Instalación con XAMPP Completada!**

Ahora puedes disfrutar del juego Ronda Marroquí con tu base de datos local funcionando perfectamente. 🎉

---

**Equipo de Desarrollo:**
- Yahya Aboulafiya
- Adrián Hoyos Sánchez
- Souhail Batah
- Carlos Robledo Badía

**Versión:** 2.0 (Sprint 2)  
**Fecha:** 04/11/2025
