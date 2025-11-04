/**
 * Servidor Backend para Ronda Marroquí
 * 
 * @description Servidor Express que maneja autenticación y conexión con MySQL
 * @author Sprint 2 Team
 * @version 2.0
 * @date 04/11/2025
 */

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// Crear aplicación Express
const app = express();
const PORT = 3000;

// Configuración de la base de datos (XAMPP)
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '', // XAMPP por defecto no tiene contraseña
    database: 'ronda_marroqui',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Middlewares
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sesiones
app.use(session({
    secret: 'ronda_marroqui_secret_2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Cambiar a true en producción con HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '..')));

// ============================================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================================

/**
 * POST /api/register
 * Registra un nuevo usuario en la base de datos
 */
app.post('/api/register', async (req, res) => {
    const { username, email, password, rol } = req.body;
    
    try {
        // Validaciones
        if (!username || !email || !password || !rol) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son obligatorios' 
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }
        
        // Verificar si el email ya existe
        const [existingUsers] = await pool.query(
            'SELECT id_usuario FROM Usuario WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El email ya está registrado' 
            });
        }
        
        // Verificar si el nombre de usuario ya existe
        const [existingUsernames] = await pool.query(
            'SELECT id_usuario FROM Usuario WHERE nombre_usuario = ?',
            [username]
        );
        
        if (existingUsernames.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El nombre de usuario ya está en uso' 
            });
        }
        
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insertar usuario en la base de datos
        const [result] = await pool.query(
            `INSERT INTO Usuario 
            (nombre_usuario, email, contraseña, rol, fecha_registro) 
            VALUES (?, ?, ?, ?, NOW())`,
            [username, email, hashedPassword, rol]
        );
        
        console.log(`✅ Usuario registrado: ${username} (ID: ${result.insertId})`);
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id_usuario: result.insertId,
                nombre_usuario: username,
                email: email,
                rol: rol
            }
        });
        
    } catch (error) {
        console.error('❌ Error al registrar usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor',
            error: error.message 
        });
    }
});

/**
 * POST /api/login
 * Autentica un usuario y crea una sesión
 */
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Validaciones
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email y contraseña son obligatorios' 
            });
        }
        
        // Buscar usuario por email
        const [users] = await pool.query(
            `SELECT id_usuario, nombre_usuario, email, contraseña, rol,
                    partidas_ganadas, partidas_perdidas, partidas_jugadas
             FROM Usuario 
             WHERE email = ?`,
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email o contraseña incorrectos' 
            });
        }
        
        const user = users[0];
        
        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.contraseña);
        
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email o contraseña incorrectos' 
            });
        }
        
        // Crear sesión
        req.session.userId = user.id_usuario;
        req.session.username = user.nombre_usuario;
        req.session.rol = user.rol;
        
        console.log(`✅ Usuario autenticado: ${user.nombre_usuario} (${user.rol})`);
        
        // Devolver datos del usuario (sin contraseña)
        const userData = {
            id_usuario: user.id_usuario,
            nombre_usuario: user.nombre_usuario,
            email: user.email,
            rol: user.rol,
            partidas_ganadas: user.partidas_ganadas,
            partidas_perdidas: user.partidas_perdidas,
            partidas_jugadas: user.partidas_jugadas
        };
        
        res.json({
            success: true,
            message: 'Autenticación exitosa',
            user: userData
        });
        
    } catch (error) {
        console.error('❌ Error al autenticar usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor',
            error: error.message 
        });
    }
});

/**
 * POST /api/logout
 * Cierra la sesión del usuario
 */
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al cerrar sesión' 
            });
        }
        res.json({ 
            success: true, 
            message: 'Sesión cerrada exitosamente' 
        });
    });
});

/**
 * GET /api/session
 * Obtiene la sesión actual del usuario
 */
app.get('/api/session', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            message: 'No hay sesión activa' 
        });
    }
    
    try {
        const [users] = await pool.query(
            `SELECT id_usuario, nombre_usuario, email, rol,
                    partidas_ganadas, partidas_perdidas, partidas_jugadas
             FROM Usuario 
             WHERE id_usuario = ?`,
            [req.session.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        res.json({
            success: true,
            user: users[0]
        });
        
    } catch (error) {
        console.error('❌ Error al obtener sesión:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================================================

function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            message: 'Autenticación requerida' 
        });
    }
    next();
}

// ============================================================================
// RUTAS PROTEGIDAS (Ejemplo)
// ============================================================================

app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT * FROM Usuario WHERE id_usuario = ?',
            [req.session.userId]
        );
        
        res.json({
            success: true,
            user: users[0]
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener perfil' 
        });
    }
});

// ============================================================================
// RUTA RAÍZ
// ============================================================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

// Probar conexión a la base de datos
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a MySQL');
        console.log(`   Database: ${dbConfig.database}`);
        console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
        connection.release();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('');
            console.log('╔════════════════════════════════════════╗');
            console.log('║   🎮 SERVIDOR RONDA MARROQUÍ ACTIVO   ║');
            console.log('╚════════════════════════════════════════╝');
            console.log('');
            console.log(`🌐 Servidor corriendo en: http://localhost:${PORT}`);
            console.log(`📊 Base de datos: ${dbConfig.database}`);
            console.log('');
            console.log('📍 Rutas disponibles:');
            console.log('   - POST /api/register  → Registrar usuario');
            console.log('   - POST /api/login     → Iniciar sesión');
            console.log('   - POST /api/logout    → Cerrar sesión');
            console.log('   - GET  /api/session   → Obtener sesión actual');
            console.log('   - GET  /              → Página principal');
            console.log('');
            console.log('💡 Presiona Ctrl+C para detener el servidor');
            console.log('');
        });
    })
    .catch(error => {
        console.error('');
        console.error('❌ ERROR: No se pudo conectar a MySQL');
        console.error('');
        console.error('🔧 Verifica que:');
        console.error('   1. XAMPP esté ejecutándose');
        console.error('   2. MySQL esté activo (verde en XAMPP)');
        console.error('   3. La base de datos "ronda_marroqui" exista');
        console.error('   4. Las tablas estén creadas (sprint2.sql)');
        console.error('');
        console.error('Error:', error.message);
        process.exit(1);
    });

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Promesa rechazada:', error);
});
