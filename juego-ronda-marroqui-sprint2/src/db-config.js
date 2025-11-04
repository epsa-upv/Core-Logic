/**
 * Configuración de conexión a la base de datos MySQL
 * 
 * @description Este archivo contiene la configuración necesaria para conectarse
 * a la base de datos MySQL de Ronda Marroquí.
 * 
 * @author Yahya Aboulafiya, Adrián Hoyos Sánchez, Souhail Batah, Carlos Robledo Badía
 * @version 2.0
 * @date 01/11/2025
 */

/**
 * Configuración de la base de datos
 * @constant
 * @type {Object}
 */
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '', // Cambiar en producción
    database: 'ronda_marroqui',
    connectionLimit: 10, // Número máximo de conexiones en el pool
    waitForConnections: true,
    queueLimit: 0
};

/**
 * Configuración de seguridad (RNF-04)
 * @constant
 * @type {Object}
 */
const securityConfig = {
    // Configuración para bcrypt (hashing de contraseñas)
    bcryptSaltRounds: 10,
    
    // Configuración para JWT (tokens de sesión)
    jwtSecret: 'ronda_marroqui_secret_key_2025', // Cambiar en producción
    jwtExpiresIn: '24h',
    
    // Configuración de sesiones
    sessionSecret: 'ronda_session_secret_2025', // Cambiar en producción
    sessionMaxAge: 24 * 60 * 60 * 1000 // 24 horas
};

/**
 * Instrucciones de instalación de MySQL con XAMPP
 * @constant
 * @type {string}
 */
const installationInstructions = `
==============================================
INSTRUCCIONES DE INSTALACIÓN CON XAMPP
==============================================

📦 PASO 1: INSTALAR XAMPP
   1. Descargar XAMPP desde: https://www.apachefriends.org/es/index.html
   2. Ejecutar el instalador (xampp-windows-x64-xxx-installer.exe)
   3. Instalar en la ruta por defecto: C:\\xampp
   4. Durante la instalación, asegúrate de seleccionar:
      ✓ Apache
      ✓ MySQL
      ✓ PHP
      ✓ phpMyAdmin

🚀 PASO 2: INICIAR XAMPP
   1. Abrir "XAMPP Control Panel"
   2. Hacer clic en "Start" junto a Apache
   3. Hacer clic en "Start" junto a MySQL
   4. Verificar que ambos estén en verde (Running)

🗄️ PASO 3: CREAR LA BASE DE DATOS
   
   Opción A - Usando phpMyAdmin (Recomendado):
   ────────────────────────────────────────────
   1. Abrir navegador y ir a: http://localhost/phpmyadmin
   2. Hacer clic en "Nueva" en el menú izquierdo
   3. Nombre de la base de datos: ronda_marroqui
   4. Cotejamiento: utf8mb4_general_ci
   5. Hacer clic en "Crear"
   6. Hacer clic en la base de datos "ronda_marroqui" en el menú izquierdo
   7. Hacer clic en la pestaña "SQL"
   8. Copiar y pegar todo el contenido del archivo: database/sprint2.sql
   9. Hacer clic en "Continuar"
   10. ✅ ¡Base de datos creada!

   Opción B - Usando línea de comandos:
   ────────────────────────────────────
   1. Abrir terminal (PowerShell o CMD)
   2. Ir a la carpeta de XAMPP:
      cd C:\\xampp\\mysql\\bin
   3. Ejecutar MySQL:
      .\\mysql.exe -u root -p
   4. Crear la base de datos:
      CREATE DATABASE ronda_marroqui;
      USE ronda_marroqui;
   5. Importar el script:
      source C:\\Users\\[TU_USUARIO]\\Desktop\\...\\database\\sprint2.sql
   6. Salir:
      exit;

⚙️ PASO 4: CONFIGURAR EL PROYECTO
   1. La configuración por defecto de XAMPP es:
      - Usuario: root
      - Contraseña: (vacía, sin contraseña)
      - Host: localhost
      - Puerto: 3306
   
   2. No necesitas cambiar nada en db-config.js si usas XAMPP por defecto

📦 PASO 5: INSTALAR DEPENDENCIAS DE NODE.JS (Opcional para backend)
   Si vas a usar el backend con Node.js:
   1. Abrir terminal en la carpeta del proyecto
   2. Ejecutar:
      npm install mysql2
      npm install bcrypt
      npm install express
      npm install express-session

🧪 PASO 6: VERIFICAR LA INSTALACIÓN
   1. Abrir phpMyAdmin: http://localhost/phpmyadmin
   2. Hacer clic en "ronda_marroqui" en el menú izquierdo
   3. Verificar que existan las tablas:
      ✓ Usuario
      ✓ Partida
      ✓ Torneo
      ✓ Movimiento
      ✓ Partida_Jugador
      ✓ Clasificacion_Torneo

🎮 PASO 7: ABRIR EL JUEGO
   1. Abrir en navegador: src/login.html
   2. O abrir: src/register.html para crear cuenta
   3. O abrir: src/index.html para el tablero

💡 NOTAS IMPORTANTES:
   - XAMPP debe estar ejecutándose cada vez que uses el juego
   - Los servicios Apache y MySQL deben estar en verde (Running)
   - Si cambias el puerto de MySQL, actualiza db-config.js
   - La contraseña por defecto de XAMPP está vacía

🔧 SOLUCIÓN DE PROBLEMAS:
   
   ❌ Error: "MySQL no inicia"
   ✅ Solución: 
      - Verificar que el puerto 3306 no esté en uso
      - Abrir XAMPP como Administrador
      - Revisar el log en XAMPP Control Panel > MySQL > Logs

   ❌ Error: "Access denied for user 'root'"
   ✅ Solución:
      - Verificar que password esté vacío: password: ''
      - O configurar contraseña en phpMyAdmin

   ❌ Error: "phpMyAdmin no abre"
   ✅ Solución:
      - Verificar que Apache esté ejecutándose
      - Probar: http://localhost

==============================================
`;

/**
 * Función para crear el pool de conexiones (para Node.js)
 * @returns {Object|null} Pool de conexiones o null si no está disponible mysql2
 */
function createConnectionPool() {
    try {
        // Esta función solo funciona en Node.js con mysql2 instalado
        if (typeof require !== 'undefined') {
            const mysql = require('mysql2/promise');
            const pool = mysql.createPool(dbConfig);
            
            console.log('✅ Pool de conexiones MySQL creado exitosamente');
            console.log(`   Host: ${dbConfig.host}`);
            console.log(`   Database: ${dbConfig.database}`);
            
            return pool;
        }
        
        console.log('ℹ️ mysql2 no está disponible (entorno de navegador)');
        return null;
        
    } catch (error) {
        console.error('❌ Error al crear pool de conexiones:', error.message);
        console.log('\n💡 Asegúrate de haber instalado mysql2:');
        console.log('   npm install mysql2');
        return null;
    }
}

/**
 * Función para probar la conexión a la base de datos
 * @async
 * @param {Object} pool - Pool de conexiones
 * @returns {Promise<boolean>} true si la conexión es exitosa
 */
async function testConnection(pool) {
    if (!pool) {
        console.log('⚠️ No hay pool de conexiones disponible');
        return false;
    }
    
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión exitosa a la base de datos MySQL');
        console.log(`   Thread ID: ${connection.threadId}`);
        connection.release();
        return true;
        
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        console.log('\n💡 Verifica que:');
        console.log('   1. MySQL Server esté ejecutándose');
        console.log('   2. Las credenciales sean correctas');
        console.log('   3. La base de datos "ronda_marroqui" exista');
        console.log('   4. El usuario tenga permisos de acceso');
        return false;
    }
}

/**
 * Muestra las instrucciones de instalación
 */
function showInstallationInstructions() {
    console.log(installationInstructions);
}

// Exportar configuración y funciones
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        dbConfig,
        securityConfig,
        createConnectionPool,
        testConnection,
        showInstallationInstructions
    };
}

// Si se ejecuta directamente, mostrar instrucciones
if (typeof require !== 'undefined' && require.main === module) {
    showInstallationInstructions();
}
