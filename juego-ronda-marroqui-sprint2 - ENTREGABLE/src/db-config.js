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
const securityConfig = {
    bcryptSaltRounds: 10,
    jwtSecret: 'ronda_marroqui_secret_key_2025', // Cambiar en producción
    jwtExpiresIn: '24h',
    sessionSecret: 'ronda_session_secret_2025', // Cambiar en producción
    sessionMaxAge: 24 * 60 * 60 * 1000 // 24 horas
};

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
