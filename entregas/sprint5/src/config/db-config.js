const env = (typeof process !== 'undefined' && process && process.env) ? process.env : {};

const dbConfig = {
    host: (env.DB_HOST || 'localhost'),
    port: env.DB_PORT ? parseInt(env.DB_PORT, 10) : 3306,
    user: (env.DB_USER || 'root'),
    password: (env.DB_PASSWORD || ''),
    database: (env.DB_NAME || 'ronda_marroqui'),
    connectionLimit: env.DB_CONNECTION_LIMIT ? parseInt(env.DB_CONNECTION_LIMIT, 10) : 10,
    waitForConnections: true,
    queueLimit: 0
};

const securityConfig = {
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS ? parseInt(env.BCRYPT_SALT_ROUNDS, 10) : 10,
    jwtSecret: (env.JWT_SECRET || 'ronda_marroqui_secret_key_2025'),
    jwtExpiresIn: (env.JWT_EXPIRES_IN || '24h'),
    sessionSecret: (env.SESSION_SECRET || 'ronda_session_secret_2025'),
    sessionMaxAge: env.SESSION_MAX_AGE_MS ? parseInt(env.SESSION_MAX_AGE_MS, 10) : (24 * 60 * 60 * 1000)
};

const installationInstructions = `Configuración rápida\n\n1) Inicia XAMPP (Apache + MySQL)\n2) Importa database/sprint4-final.sql en phpMyAdmin\n3) Ejecuta el servidor con npm start\n\nVariables de entorno (opcional)\n- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME\n- SESSION_SECRET\n- BCRYPT_SALT_ROUNDS\n`;
function createConnectionPool() {
    try {
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
function showInstallationInstructions() {
    console.log(installationInstructions);
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        dbConfig,
        securityConfig,
        createConnectionPool,
        testConnection,
        showInstallationInstructions
    };
}
if (typeof require !== 'undefined' && require.main === module) {
    showInstallationInstructions();
}
