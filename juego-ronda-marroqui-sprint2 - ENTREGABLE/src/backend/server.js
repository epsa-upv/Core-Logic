const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const express = require('express');
const torneoRoutes = require('./routes/torneoRoutes'); // Importa el nuevo archivo de rutas
app.use('/api/torneo', torneoRoutes);
const app = express();
const PORT = 3002;
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'ronda_marroqui',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
const pool = mysql.createPool(dbConfig);
app.use(cors({
    origin: 'http://localhost:3002',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'ronda_marroqui_secret_2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'welcome.html'));
});
app.use(express.static(path.join(__dirname, '..')));
app.use('/lib', express.static(path.join(__dirname, '..', '..', 'lib')));
app.post('/api/register', async (req, res) => {
    const { username, email, password, rol } = req.body;
    try {
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
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `INSERT INTO Usuario 
            (nombre_usuario, email, contraseña_hash, rol, fecha_registro) 
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
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email y contraseña son obligatorios' 
            });
        }
        const [users] = await pool.query(
            `SELECT id_usuario, nombre_usuario, email, contraseña_hash, rol,
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
        const passwordMatch = await bcrypt.compare(password, user.contraseña_hash);
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email o contraseña incorrectos' 
            });
        }
        req.session.userId = user.id_usuario;
        req.session.username = user.nombre_usuario;
        req.session.rol = user.rol;
        console.log(`✅ Usuario autenticado: ${user.nombre_usuario} (${user.rol})`);
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
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            message: 'Autenticación requerida' 
        });
    }
    next();
}
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
app.put('/api/profile/update', requireAuth, async (req, res) => {
    const { nombre_usuario, email, password } = req.body;
    try {
        if (!nombre_usuario || !email) {
            return res.status(400).json({
                success: false,
                message: 'Nombre de usuario y email son obligatorios'
            });
        }
        const [existingEmail] = await pool.query(
            'SELECT id_usuario FROM Usuario WHERE email = ? AND id_usuario != ?',
            [email, req.session.userId]
        );
        if (existingEmail.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está en uso por otro usuario'
            });
        }
        const [existingUsername] = await pool.query(
            'SELECT id_usuario FROM Usuario WHERE nombre_usuario = ? AND id_usuario != ?',
            [nombre_usuario, req.session.userId]
        );
        if (existingUsername.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya está en uso'
            });
        }
        let updateQuery = 'UPDATE Usuario SET nombre_usuario = ?, email = ?';
        let queryParams = [nombre_usuario, email];
        if (password && password.length >= 6) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', contraseña_hash = ?';
            queryParams.push(hashedPassword);
        }
        updateQuery += ' WHERE id_usuario = ?';
        queryParams.push(req.session.userId);
        await pool.query(updateQuery, queryParams);
        req.session.username = nombre_usuario;
        console.log(`✅ Perfil actualizado: ${nombre_usuario}`);
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
app.get('/api/ranking', requireAuth, async (req, res) => {
    try {
        const [ranking] = await pool.query(`
            SELECT 
                id_usuario,
                nombre_usuario,
                partidas_ganadas,
                partidas_perdidas,
                partidas_jugadas,
                CASE 
                    WHEN partidas_jugadas > 0 
                    THEN (partidas_ganadas / partidas_jugadas * 100)
                    ELSE 0 
                END as win_rate
            FROM Usuario
            WHERE rol = 'jugador'
            ORDER BY partidas_ganadas DESC, win_rate DESC, partidas_jugadas DESC
            LIMIT 100
        `);
        res.json({
            success: true,
            ranking: ranking
        });
    } catch (error) {
        console.error('❌ Error al obtener ranking:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el ranking'
        });
    }
});
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a MySQL');
        console.log(`   Database: ${dbConfig.database}`);
        console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
        connection.release();
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
            console.log('   - POST /api/register       → Registrar usuario');
            console.log('   - POST /api/login          → Iniciar sesión');
            console.log('   - POST /api/logout         → Cerrar sesión');
            console.log('   - GET  /api/session        → Obtener sesión actual');
            console.log('   - GET  /api/ranking        → Ranking global');
            console.log('   - PUT  /api/profile/update → Actualizar perfil');
            console.log('   - GET  /                   → Página principal');
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
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
});
process.on('unhandledRejection', (error) => {
    console.error('❌ Promesa rechazada:', error);
});
