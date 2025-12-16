const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const RondaGame = require('../models/RondaGame.js');
const torneoController = require('./torneoController');
const torneoRoutes = require('./torneoRoutes');

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

torneoController.initPool(pool);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '../views/welcome.html'));
});
app.use(express.static(path.join(__dirname, '..')));
app.use('/lib', express.static(path.join(__dirname, '..', '..', 'lib')));

app.use('/api/torneos', torneoRoutes);

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
        res.status(500).json({
            message: 'Error al obtener el ranking'
        });
    }
});

app.post('/api/partida/crear', requireAuth, async (req, res) => {
    const { max_jugadores, cartas_iniciales, id_torneo } = req.body;
    
    try {
        if (!max_jugadores || max_jugadores < 3 || max_jugadores > 6) {
            return res.status(400).json({
                success: false,
                message: 'El numero de jugadores debe estar entre 3 y 6'
            });
        }

        if (!cartas_iniciales || cartas_iniciales < 3 || cartas_iniciales > 6) {
            return res.status(400).json({
                success: false,
                message: 'Las cartas iniciales deben estar entre 3 y 6'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO Partida (fecha_inicio, estado, cartas_iniciales, max_jugadores, id_torneo)
             VALUES (NOW(), 'esperando_jugadores', ?, ?, ?)`,
            [cartas_iniciales, max_jugadores, id_torneo]
        );

        const id_partida = result.insertId;

        await pool.query(
            'INSERT INTO Partida_Jugador (id_partida, id_usuario) VALUES (?, ?)',
            [id_partida, req.session.userId]
        );

        const [users] = await pool.query(
            'SELECT nombre_usuario FROM Usuario WHERE id_usuario = ?',
            [req.session.userId]
        );

        res.json({
            success: true,
            partida: {
                id_partida,
                fecha_inicio: new Date(),
                estado: 'esperando_jugadores',
                max_jugadores: max_jugadores,
                jugadores_actuales: 1,
                creador: users[0].nombre_usuario
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

app.post('/api/partida/:id/unirse', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const [partidas] = await pool.query(
            'SELECT * FROM Partida WHERE id_partida = ?',
            [id]
        );

        if (partidas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Partida no encontrada'
            });
        }

        const partida = partidas[0];

        if (partida.estado !== 'esperando_jugadores') {
            return res.status(400).json({
                success: false,
                message: 'La partida ya inicio o ha finalizado'
            });
        }

        const [jugadoresActuales] = await pool.query(
            'SELECT COUNT(*) as total FROM Partida_Jugador WHERE id_partida = ?',
            [id]
        );

        if (jugadoresActuales[0].total >= partida.max_jugadores) {
            return res.status(400).json({
                success: false,
                message: 'La partida esta completa'
            });
        }

        const [yaUnido] = await pool.query(
            'SELECT * FROM Partida_Jugador WHERE id_partida = ? AND id_usuario = ?',
            [id, req.session.userId]
        );

        if (yaUnido.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya estas en esta partida'
            });
        }

        await pool.query(
            'INSERT INTO Partida_Jugador (id_partida, id_usuario) VALUES (?, ?)',
            [id, req.session.userId]
        );

        const [jugadoresTotal] = await pool.query(
            'SELECT COUNT(*) as total FROM Partida_Jugador WHERE id_partida = ?',
            [id]
        );

        if (jugadoresTotal[0].total === partida.max_jugadores) {
            await iniciarPartida(id, partida.max_jugadores, partida.cartas_iniciales);
        }

        res.json({
            success: true,
            message: 'Te has unido a la partida',
            jugadores_actuales: jugadoresTotal[0].total,
            max_jugadores: partida.max_jugadores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

async function iniciarPartida(id_partida, numJugadores, cartasIniciales) {
    try {
        const [jugadores] = await pool.query(`
            SELECT u.id_usuario, u.nombre_usuario
            FROM Usuario u
            JOIN Partida_Jugador pj ON u.id_usuario = pj.id_usuario
            WHERE pj.id_partida = ?
        `, [id_partida]);

        const game = new RondaGame(numJugadores, cartasIniciales);
        game.startGame();

        for (let i = 0; i < jugadores.length; i++) {
            game.players[i].name = jugadores[i].nombre_usuario;
            game.players[i].id_usuario = jugadores[i].id_usuario;
        }

        await pool.query(
            `UPDATE Partida SET estado = 'en_curso', estado_juego_json = ? WHERE id_partida = ?`,
            [JSON.stringify(game.toJSON()), id_partida]
        );
    } catch (error) {
        console.error('Error al iniciar partida:', error);
    }
}

app.get('/api/partida/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        // Obtener partida
        const [partidas] = await pool.query(
            'SELECT * FROM Partida WHERE id_partida = ?',
            [id]
        );

        if (partidas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Partida no encontrada'
            });
        }

        const partida = partidas[0];

        // Obtener jugadores
        const [jugadores] = await pool.query(`
            SELECT u.id_usuario, u.nombre_usuario
            FROM Usuario u
            JOIN Partida_Jugador pj ON u.id_usuario = pj.id_usuario
            WHERE pj.id_partida = ?
        `, [id]);

        // Parsear estado del juego
        let estadoJuego = null;
        if (partida.estado_juego_json) {
            const gameData = JSON.parse(partida.estado_juego_json);
            const game = RondaGame.fromJSON(gameData);
            estadoJuego = game.getGameState();
        }

        // Obtener últimos movimientos
        const [movimientos] = await pool.query(`
            SELECT m.*, u.nombre_usuario as jugador
            FROM Movimiento m
            JOIN Usuario u ON m.id_usuario = u.id_usuario
            WHERE m.id_partida = ?
            ORDER BY m.timestamp DESC
            LIMIT 10
        `, [id]);

        res.json({
            success: true,
            partida: {
                id_partida: partida.id_partida,
                fecha_inicio: partida.fecha_inicio,
                fecha_fin: partida.fecha_fin,
                estado: partida.estado,
                cartas_iniciales: partida.cartas_iniciales,
                max_jugadores: partida.max_jugadores,
                id_ganador: partida.id_ganador,
                id_perdedor: partida.id_perdedor,
                jugadores: jugadores.map(j => j.nombre_usuario),
                jugadores_detalle: jugadores,
                estado_juego: estadoJuego,
                ultimos_movimientos: movimientos
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/partida/:id/movimiento', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { id_usuario, tipo_movimiento, carta_jugada, palo_elegido } = req.body;
    
    try {
        // Obtener partida
        const [partidas] = await pool.query(
            'SELECT * FROM Partida WHERE id_partida = ? AND estado = "en_curso"',
            [id]
        );

        if (partidas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Partida no encontrada o ya finalizada'
            });
        }

        const partida = partidas[0];
        const gameData = JSON.parse(partida.estado_juego_json);
        const game = RondaGame.fromJSON(gameData);

        // Encontrar el índice del jugador
        const playerIndex = game.players.findIndex(p => p.id_usuario === id_usuario);
        if (playerIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'Jugador no encontrado en esta partida'
            });
        }

        let resultado = null;

        // Ejecutar movimiento
        if (tipo_movimiento === 'jugar') {
            if (!carta_jugada) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes especificar la carta a jugar'
                });
            }

            const [value, suit] = carta_jugada.split('_');
            resultado = game.playCard(playerIndex, parseInt(value), suit, palo_elegido);
        } else if (tipo_movimiento === 'robar') {
            resultado = game.playerDrawCard(playerIndex);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Tipo de movimiento inválido'
            });
        }

        // Guardar estado actualizado
        await pool.query(
            'UPDATE Partida SET estado_juego_json = ? WHERE id_partida = ?',
            [JSON.stringify(game.toJSON()), id]
        );

        // Registrar movimiento
        const [movResult] = await pool.query(
            `INSERT INTO Movimiento (id_partida, id_usuario, tipo_movimiento, carta_jugada, palo_elegido, timestamp)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [id, id_usuario, tipo_movimiento, carta_jugada, palo_elegido]
        );

        // Si hay ganador, finalizar partida
        if (resultado.gameOver) {
            await finalizarPartida(id, resultado.winnerId, game.players);
        }

        res.json({
            success: true,
            movimiento: {
                id_movimiento: movResult.insertId,
                tipo: tipo_movimiento,
                carta: carta_jugada,
                palo_elegido: palo_elegido
            },
            nuevo_estado: game.getGameState(),
            ganador: resultado.gameOver ? resultado.winnerId : null
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/partida/:id/movimientos', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const [movimientos] = await pool.query(`
            SELECT 
                m.id_movimiento,
                m.timestamp,
                u.nombre_usuario as jugador,
                u.id_usuario,
                m.tipo_movimiento,
                m.carta_jugada,
                m.palo_elegido
            FROM Movimiento m
            JOIN Usuario u ON m.id_usuario = u.id_usuario
            WHERE m.id_partida = ?
            ORDER BY m.timestamp ASC
        `, [id]);

        res.json({
            success: true,
            movimientos: movimientos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/partida/:id/guardar', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        await pool.query(
            'UPDATE Partida SET estado = "guardada" WHERE id_partida = ? AND estado = "en_curso"',
            [id]
        );

        res.json({
            success: true,
            message: 'Partida guardada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/partida/:id/reanudar', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        await pool.query(
            'UPDATE Partida SET estado = "en_curso" WHERE id_partida = ? AND estado = "guardada"',
            [id]
        );

        res.json({
            success: true,
            message: 'Partida reanudada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/partidas/mis-partidas', requireAuth, async (req, res) => {
    const { estado } = req.query;
    
    try {
        let query = `
            SELECT 
                p.id_partida,
                p.fecha_inicio,
                p.fecha_fin,
                p.estado,
                p.cartas_iniciales,
                p.max_jugadores,
                ganador.nombre_usuario as ganador,
                GROUP_CONCAT(u.nombre_usuario SEPARATOR ', ') as jugadores,
                COUNT(pj2.id_usuario) as jugadores_actuales
            FROM Partida p
            JOIN Partida_Jugador pj ON p.id_partida = pj.id_partida
            LEFT JOIN Usuario ganador ON p.id_ganador = ganador.id_usuario
            LEFT JOIN Partida_Jugador pj2 ON p.id_partida = pj2.id_partida
            LEFT JOIN Usuario u ON pj2.id_usuario = u.id_usuario
            WHERE pj.id_usuario = ?
        `;

        const params = [req.session.userId];

        if (estado) {
            query += ' AND p.estado = ?';
            params.push(estado);
        }

        query += ' GROUP BY p.id_partida ORDER BY p.fecha_inicio DESC LIMIT 50';

        const [partidas] = await pool.query(query, params);

        res.json({
            success: true,
            partidas: partidas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/partidas/disponibles', requireAuth, async (req, res) => {
    try {
        const [partidas] = await pool.query(`
            SELECT 
                p.id_partida,
                p.fecha_inicio,
                p.cartas_iniciales,
                p.max_jugadores,
                COUNT(pj.id_usuario) as jugadores_actuales,
                GROUP_CONCAT(u.nombre_usuario SEPARATOR ', ') as jugadores
            FROM Partida p
            LEFT JOIN Partida_Jugador pj ON p.id_partida = pj.id_partida
            LEFT JOIN Usuario u ON pj.id_usuario = u.id_usuario
            WHERE p.estado = 'esperando_jugadores'
            GROUP BY p.id_partida
            HAVING jugadores_actuales < p.max_jugadores
            ORDER BY p.fecha_inicio DESC
            LIMIT 20
        `);

        res.json({
            success: true,
            partidas: partidas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

async function finalizarPartida(id_partida, id_ganador, players) {
    try {
        const perdedor = players.reduce((prev, current) => {
            return (current.cardsCount > prev.cardsCount) ? current : prev;
        });

        await pool.query(
            `UPDATE Partida 
             SET estado = 'terminada', fecha_fin = NOW(), id_ganador = ?, id_perdedor = ?
             WHERE id_partida = ?`,
            [id_ganador, perdedor.id_usuario, id_partida]
        );

        await pool.query(
            `UPDATE Usuario 
             SET partidas_ganadas = partidas_ganadas + 1, partidas_jugadas = partidas_jugadas + 1
             WHERE id_usuario = ?`,
            [id_ganador]
        );

        await pool.query(
            `UPDATE Usuario 
             SET partidas_perdidas = partidas_perdidas + 1, partidas_jugadas = partidas_jugadas + 1
             WHERE id_usuario = ?`,
            [perdedor.id_usuario]
        );

        for (const player of players) {
            if (player.id_usuario !== id_ganador && player.id_usuario !== perdedor.id_usuario) {
                await pool.query(
                    `UPDATE Usuario 
                     SET partidas_jugadas = partidas_jugadas + 1
                     WHERE id_usuario = ?`,
                    [player.id_usuario]
                );
            }
        }
    } catch (error) {
    }
}

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
            console.log('   === USUARIOS ===');
            console.log('   - POST /api/register       → Registrar usuario');
            console.log('   - POST /api/login          → Iniciar sesión');
            console.log('   - POST /api/logout         → Cerrar sesión');
            console.log('   - GET  /api/session        → Obtener sesión actual');
            console.log('   - GET  /api/ranking        → Ranking global');
            console.log('   - PUT  /api/profile/update → Actualizar perfil');
            console.log('');
            console.log('   === PARTIDAS (SPRINT 3) ===');
            console.log('   - POST /api/partida/crear              → Crear partida');
            console.log('   - GET  /api/partida/:id                → Estado de partida');
            console.log('   - POST /api/partida/:id/movimiento     → Realizar movimiento');
            console.log('   - GET  /api/partida/:id/movimientos    → Historial de movimientos');
            console.log('   - POST /api/partida/:id/guardar        → Guardar partida');
            console.log('   - POST /api/partida/:id/reanudar       → Reanudar partida');
            console.log('   - GET  /api/partidas/mis-partidas      → Listar mis partidas');
            console.log('');
            console.log('   === TORNEOS (SPRINT 3) ===');
            console.log('   - GET  /api/torneos/activos                      → Listar torneos activos');
            console.log('   - GET  /api/torneos/:id                          → Info de torneo');
            console.log('   - GET  /api/torneos/:id/clasificacion            → Clasificación');
            console.log('   - POST /api/torneos/crear                        → Crear torneo (admin)');
            console.log('   - POST /api/torneos/:id/inscribir                → Inscribirse');
            console.log('   - PUT  /api/torneos/:id/estado                   → Cambiar estado (admin)');
            console.log('   - GET  /api/torneos/usuario/:id_usuario/clasificaciones → Mis torneos');
            console.log('');
            console.log('   === FRONTEND ===');
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
