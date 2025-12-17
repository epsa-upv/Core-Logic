const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');
const RondaGame = require('../models/RondaGame.js');
const GameVsBot = require('../models/GameVsBot.js');
const torneoController = require('./torneoController');
const torneoRoutes = require('./torneoRoutes');
const { config } = require('../config/runtime-config');

const app = express();
const server = http.createServer(app);

if (config.isProduction) {
    app.set('trust proxy', 1);
}

function logServerError(prefix, error) {
    if (!config.logErrors) return;
    console.error(prefix, error);
}

function getSafeErrorDetails(error) {
    if (!config.exposeErrorDetails) return undefined;
    if (!error) return undefined;
    const message = String(error.message || '').trim();
    return message.length ? message : undefined;
}

function normalizeText(value) {
    return String(value || '').trim();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidRole(role) {
    return role === 'jugador' || role === 'admin' || role === 'administrador';
}

async function getCreadorIdPartida(id_partida) {
    try {
        const [creador] = await pool.query(
            'SELECT id_usuario FROM Partida_Jugador WHERE id_partida = ? AND id_usuario > 0 ORDER BY id_partida_jugador ASC LIMIT 1',
            [id_partida]
        );
        return creador.length > 0 ? creador[0].id_usuario : null;
    } catch (error) {
        if (error && error.code === 'ER_BAD_FIELD_ERROR') {
            const [creador] = await pool.query(
                'SELECT id_usuario FROM Partida_Jugador WHERE id_partida = ? AND id_usuario > 0 ORDER BY id_usuario ASC LIMIT 1',
                [id_partida]
            );
            return creador.length > 0 ? creador[0].id_usuario : null;
        }
        throw error;
    }
}

async function getJugadoresPartidaOrdenados(id_partida) {
    try {
        const [jugadores] = await pool.query(
            `SELECT pj.id_usuario, u.nombre_usuario
             FROM Partida_Jugador pj
             LEFT JOIN Usuario u ON pj.id_usuario = u.id_usuario
             WHERE pj.id_partida = ?
             ORDER BY pj.id_partida_jugador ASC`,
            [id_partida]
        );
        return jugadores;
    } catch (error) {
        if (error && error.code === 'ER_BAD_FIELD_ERROR') {
            const [jugadores] = await pool.query(
                `SELECT pj.id_usuario, u.nombre_usuario
                 FROM Partida_Jugador pj
                 LEFT JOIN Usuario u ON pj.id_usuario = u.id_usuario
                 WHERE pj.id_partida = ?
                 ORDER BY (pj.id_usuario < 0) ASC, pj.id_usuario ASC`,
                [id_partida]
            );
            return jugadores;
        }
        throw error;
    }
}

async function getBotsInfoSafe(id_partida) {
    try {
        const [partidaInfo] = await pool.query(
            'SELECT bots_info FROM Partida WHERE id_partida = ?',
            [id_partida]
        );

        if (!partidaInfo || partidaInfo.length === 0 || !partidaInfo[0].bots_info) {
            return [];
        }

        try {
            const parsed = JSON.parse(partidaInfo[0].bots_info);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    } catch (error) {
        // Compatibilidad con esquemas antiguos (sin bots_info)
        if (error && error.code === 'ER_BAD_FIELD_ERROR') {
            return [];
        }
        throw error;
    }
}

async function setBotsInfoSafe(id_partida, botsInfo) {
    try {
        await pool.query(
            'UPDATE Partida SET bots_info = ? WHERE id_partida = ?',
            [JSON.stringify(botsInfo || []), id_partida]
        );
        return true;
    } catch (error) {
        // Compatibilidad con esquemas antiguos (sin bots_info)
        if (error && error.code === 'ER_BAD_FIELD_ERROR') {
            return false;
        }
        throw error;
    }
}

async function getTotalJugadoresIncluyendoBots(id_partida) {
    const [jugadoresTabla] = await pool.query(
        'SELECT id_usuario FROM Partida_Jugador WHERE id_partida = ?',
        [id_partida]
    );

    const idsTabla = new Set((jugadoresTabla || []).map(r => r.id_usuario));
    let total = idsTabla.size;

    const botsInfo = await getBotsInfoSafe(id_partida);
    if (Array.isArray(botsInfo)) {
        for (const bot of botsInfo) {
            const botId = bot?.id_usuario;
            if (!botId) continue;
            if (!idsTabla.has(botId)) total += 1;
        }
    }

    return { total, idsTabla, botsInfo: Array.isArray(botsInfo) ? botsInfo : [] };
}

function getAllowedOrigins() {
    const env = (process.env.APP_ORIGIN || '').trim();
    const extra = env
        ? env.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    return new Set([
        'http://localhost:3002',
        'http://127.0.0.1:3002',
        ...extra
    ]);
}

function isOriginAllowed(origin) {
    if (!origin) return true; // curl/postman/same-origin
    const allowed = getAllowedOrigins();
    if (allowed.has(origin)) return true;

    // Cloudflare Tunnel quick share: https://xxxx.trycloudflare.com
    if (/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin)) return true;

    return false;
}

const corsOptions = {
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) return callback(null, true);
        return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true
};

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (isOriginAllowed(origin)) return callback(null, true);
            return callback(new Error(`Origen no permitido por Socket.IO CORS: ${origin}`));
        },
        credentials: true
    }
});

const PORT = config.port;
const pool = mysql.createPool(config.db);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: config.session.secret,
    resave: config.session.resave,
    saveUninitialized: config.session.saveUninitialized,
    cookie: config.session.cookie
}));

torneoController.initPool(pool);

// Rutas explícitas para archivos HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'welcome.html'));
});

app.get('/welcome.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'welcome.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'register.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'profile.html'));
});

app.get('/sala-espera.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'sala-espera.html'));
});

app.get('/torneos.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'torneos.html'));
});

app.get('/vs-bot.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'vs-bot.html'));
});

app.get('/juego-vs-bot.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'juego-vs-bot.html'));
});

app.get('/lobby-partida.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'lobby-partida.html'));
});

// Archivos estáticos
app.use(express.static(path.join(__dirname, '..')));
app.use('/lib', express.static(path.join(__dirname, '..', '..', 'lib')));

app.use('/api/torneos', torneoRoutes);

app.post('/api/register', async (req, res) => {
    const username = normalizeText(req.body && req.body.username);
    const email = normalizeText(req.body && req.body.email).toLowerCase();
    const password = normalizeText(req.body && req.body.password);
    let rol = normalizeText(req.body && req.body.rol);
    if (rol === 'administrador') rol = 'admin';
    try {
        if (!username || !email || !password || !rol) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son obligatorios' 
            });
        }
        if (username.length < 3 || username.length > 32) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario debe tener entre 3 y 32 caracteres'
            });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'El email no tiene un formato válido'
            });
        }
        if (!isValidRole(rol)) {
            return res.status(400).json({
                success: false,
                message: 'El rol no es válido'
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
        const hashedPassword = await bcrypt.hash(password, config.bcryptSaltRounds);
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
        logServerError('❌ Error en /api/register:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor',
            error: getSafeErrorDetails(error)
        });
    }
});
app.post('/api/login', async (req, res) => {
    const email = normalizeText(req.body && req.body.email).toLowerCase();
    const password = normalizeText(req.body && req.body.password);
    try {
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email y contraseña son obligatorios' 
            });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'El email no tiene un formato válido'
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
        logServerError('❌ Error en /api/login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor',
            error: getSafeErrorDetails(error)
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
    const nombre_usuario = normalizeText(req.body && req.body.nombre_usuario);
    const email = normalizeText(req.body && req.body.email).toLowerCase();
    const password = normalizeText(req.body && req.body.password);
    try {
        if (!nombre_usuario || !email) {
            return res.status(400).json({
                success: false,
                message: 'Nombre de usuario y email son obligatorios'
            });
        }
        if (nombre_usuario.length < 3 || nombre_usuario.length > 32) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario debe tener entre 3 y 32 caracteres'
            });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'El email no tiene un formato válido'
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
            const hashedPassword = await bcrypt.hash(password, config.bcryptSaltRounds);
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
        logServerError('❌ Error en /api/profile/update:', error);
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
            success: false,
            message: 'Error al obtener el ranking',
            error: getSafeErrorDetails(error)
        });
    }
});

// ============================================
// RUTAS PARA PARTIDAS VS BOT (SPRINT 4)
// ============================================

// Almacén en memoria de partidas vs bot activas
const partidasVsBot = new Map(); // id_partida -> GameVsBot instance

// Latencia simulada del bot (ms) para que parezca un jugador real
const BOT_LATENCY_MS = 2000;

// Evita procesamientos concurrentes de bots por partida
const partidasVsBotProcesando = new Set();

async function persistirEstadoVsBot(id_partida, gameVsBot) {
    await pool.query(
        'UPDATE Partida SET estado_juego_json = ? WHERE id_partida = ?',
        [JSON.stringify(gameVsBot.toJSON()), id_partida]
    );
}

async function finalizarSiTerminoVsBot(id_partida, gameVsBot) {
    if (!gameVsBot || !gameVsBot.game || !gameVsBot.game.isGameOver) return false;

    const ganadorIndex = gameVsBot.ultimoGanadorIndex;
    const ganadorIdUsuario = (typeof ganadorIndex === 'number' && gameVsBot.game.players && gameVsBot.game.players[ganadorIndex])
        ? gameVsBot.game.players[ganadorIndex].id_usuario
        : ganadorIndex;

    await finalizarPartidaVsBot(id_partida, ganadorIdUsuario, gameVsBot);
    partidasVsBot.delete(id_partida);
    return true;
}

function iniciarProcesamientoBotsEnBackground(id_partida, gameVsBot) {
    if (!gameVsBot) return;
    if (partidasVsBotProcesando.has(id_partida)) return;
    if (!gameVsBot.game || gameVsBot.game.isGameOver) return;
    if (!gameVsBot.esTurnoDeBot()) return;

    partidasVsBotProcesando.add(id_partida);

    (async () => {
        try {
            gameVsBot.botLatencyMs = BOT_LATENCY_MS;

            await gameVsBot.procesarTurnosBot(async () => {
                await persistirEstadoVsBot(id_partida, gameVsBot);
            });

            // Persistir estado final tras procesar bots
            await persistirEstadoVsBot(id_partida, gameVsBot);
            await finalizarSiTerminoVsBot(id_partida, gameVsBot);
        } catch (error) {
            console.error('Error procesando bots en background:', error);
        } finally {
            partidasVsBotProcesando.delete(id_partida);
        }
    })();
}

app.post('/api/partida/vs-bot/crear', requireAuth, async (req, res) => {
    const { num_bots, cartas_iniciales, dificultad } = req.body;
    
    try {
        // Validaciones
        if (!num_bots || num_bots < 1 || num_bots > 5) {
            return res.status(400).json({
                success: false,
                message: 'Número de bots debe estar entre 1 y 5'
            });
        }

        if (!cartas_iniciales || cartas_iniciales < 3 || cartas_iniciales > 6) {
            return res.status(400).json({
                success: false,
                message: 'Las cartas iniciales deben estar entre 3 y 6'
            });
        }

        const dificultadValida = ['facil', 'normal', 'dificil'].includes(dificultad) ? dificultad : 'normal';

        // Crear partida en BD
        const [result] = await pool.query(
            `INSERT INTO Partida (fecha_inicio, estado, cartas_iniciales, max_jugadores, tipo_partida)
             VALUES (NOW(), 'en_curso', ?, ?, 'vs_bot')`,
            [cartas_iniciales, num_bots + 1]
        );

        const id_partida = result.insertId;

        // Registrar jugador humano en BD
        await pool.query(
            'INSERT INTO Partida_Jugador (id_partida, id_usuario) VALUES (?, ?)',
            [id_partida, req.session.userId]
        );

        // Obtener nombre del jugador
        const [users] = await pool.query(
            'SELECT nombre_usuario FROM Usuario WHERE id_usuario = ?',
            [req.session.userId]
        );

        // Crear instancia de GameVsBot
        const gameVsBot = new GameVsBot(num_bots, cartas_iniciales, dificultadValida);
        gameVsBot.botLatencyMs = BOT_LATENCY_MS;
        const estadoInicial = gameVsBot.iniciarPartida(users[0].nombre_usuario, req.session.userId);

        // Guardar en memoria
        partidasVsBot.set(id_partida, gameVsBot);

        // Guardar estado en BD
        await pool.query(
            'UPDATE Partida SET estado_juego_json = ? WHERE id_partida = ?',
            [JSON.stringify(gameVsBot.toJSON()), id_partida]
        );

        res.json({
            success: true,
            partida: {
                id_partida,
                tipo: 'vs_bot',
                num_bots,
                dificultad: dificultadValida,
                estado: estadoInicial
            }
        });
    } catch (error) {
        console.error('Error al crear partida vs bot:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

app.post('/api/partida/vs-bot/:id/movimiento', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { carta_jugada, palo_elegido } = req.body;
    
    try {
        const id_partida = parseInt(id);
        
        // Obtener partida de memoria
        let gameVsBot = partidasVsBot.get(id_partida);
        
        // Si no está en memoria, cargar desde BD
        if (!gameVsBot) {
            const [partidas] = await pool.query(
                'SELECT estado_juego_json FROM Partida WHERE id_partida = ? AND tipo_partida = "vs_bot"',
                [id_partida]
            );
            
            if (partidas.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Partida no encontrada'
                });
            }
            
            gameVsBot = GameVsBot.fromJSON(JSON.parse(partidas[0].estado_juego_json));
            partidasVsBot.set(id_partida, gameVsBot);
        }

        // Procesar jugada del humano
        const [value, suit] = carta_jugada.split('_');
        gameVsBot.botLatencyMs = BOT_LATENCY_MS;
        const resultado = await gameVsBot.jugarCartaHumano(
            parseInt(value),
            suit,
            palo_elegido,
            { procesarBots: false }
        );

        // Guardar estado inmediato (solo humano)
        await persistirEstadoVsBot(id_partida, gameVsBot);

        // Registrar movimiento
        await pool.query(
            `INSERT INTO Movimiento (id_partida, id_usuario, tipo_movimiento, carta_jugada, palo_elegido, timestamp)
             VALUES (?, ?, 'jugar', ?, ?, NOW())`,
            [id_partida, req.session.userId, carta_jugada, palo_elegido]
        );

        // Si terminó, actualizar BD (winnerId viene como índice -> mapear a id_usuario)
        if (resultado.gameOver) {
            const ganadorIndex = resultado.winnerId;
            const ganadorIdUsuario = (typeof ganadorIndex === 'number' && gameVsBot.game && gameVsBot.game.players && gameVsBot.game.players[ganadorIndex])
                ? gameVsBot.game.players[ganadorIndex].id_usuario
                : ganadorIndex;

            await finalizarPartidaVsBot(id_partida, ganadorIdUsuario, gameVsBot);
            partidasVsBot.delete(id_partida);
        }

        res.json({
            success: true,
            nuevo_estado: gameVsBot.obtenerEstado(),
            ganador: resultado.gameOver ? (gameVsBot.game.players[resultado.winnerId]?.id_usuario ?? resultado.winnerId) : null
        });

        // Procesar bots en background para que el humano vea su jugada al instante
        if (!resultado.gameOver) {
            iniciarProcesamientoBotsEnBackground(id_partida, gameVsBot);
        }
    } catch (error) {
        console.error('Error en movimiento vs bot:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/partida/vs-bot/:id/robar', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const id_partida = parseInt(id);
        let gameVsBot = partidasVsBot.get(id_partida);
        
        if (!gameVsBot) {
            const [partidas] = await pool.query(
                'SELECT estado_juego_json FROM Partida WHERE id_partida = ? AND tipo_partida = "vs_bot"',
                [id_partida]
            );
            
            if (partidas.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Partida no encontrada'
                });
            }
            
            gameVsBot = GameVsBot.fromJSON(JSON.parse(partidas[0].estado_juego_json));
            partidasVsBot.set(id_partida, gameVsBot);
        }

        gameVsBot.botLatencyMs = BOT_LATENCY_MS;
        const resultado = await gameVsBot.robarCartaHumano({ procesarBots: false });

        // Guardar estado inmediato (solo humano)
        await persistirEstadoVsBot(id_partida, gameVsBot);

        // Registrar movimiento
        await pool.query(
            `INSERT INTO Movimiento (id_partida, id_usuario, tipo_movimiento, timestamp)
             VALUES (?, ?, 'robar', NOW())`,
            [id_partida, req.session.userId]
        );

        // Si terminó, actualizar BD
        if (resultado && resultado.gameOver) {
            const ganadorIndex = resultado.winnerId;
            const ganadorIdUsuario = (typeof ganadorIndex === 'number' && gameVsBot.game && gameVsBot.game.players && gameVsBot.game.players[ganadorIndex])
                ? gameVsBot.game.players[ganadorIndex].id_usuario
                : ganadorIndex;

            await finalizarPartidaVsBot(id_partida, ganadorIdUsuario, gameVsBot);
            partidasVsBot.delete(id_partida);
        }

        res.json({
            success: true,
            nuevo_estado: gameVsBot.obtenerEstado(),
            ganador: resultado && resultado.gameOver ? (gameVsBot.game.players[resultado.winnerId]?.id_usuario ?? resultado.winnerId) : null
        });

        // Procesar bots en background
        if (resultado && !resultado.gameOver) {
            iniciarProcesamientoBotsEnBackground(id_partida, gameVsBot);
        }
    } catch (error) {
        console.error('Error al robar vs bot:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/partida/vs-bot/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const id_partida = parseInt(id);
        
        // Buscar en memoria primero
        let gameVsBot = partidasVsBot.get(id_partida);
        
        // Si no está, cargar desde BD
        if (!gameVsBot) {
            const [partidas] = await pool.query(
                'SELECT * FROM Partida WHERE id_partida = ? AND tipo_partida = "vs_bot"',
                [id_partida]
            );
            
            if (partidas.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Partida no encontrada'
                });
            }
            
            const partida = partidas[0];
            gameVsBot = GameVsBot.fromJSON(JSON.parse(partida.estado_juego_json));
            partidasVsBot.set(id_partida, gameVsBot);
        }

        res.json({
            success: true,
            partida: {
                id_partida: id_partida,
                tipo: 'vs_bot',
                estado: gameVsBot.obtenerEstado()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

async function finalizarPartidaVsBot(id_partida, id_ganador, gameVsBot) {
    try {
        // Solo actualizar estadísticas si el ganador es humano (id positivo)
        if (id_ganador > 0) {
            await pool.query(
                `UPDATE Usuario 
                 SET partidas_ganadas = partidas_ganadas + 1, partidas_jugadas = partidas_jugadas + 1
                 WHERE id_usuario = ?`,
                [id_ganador]
            );
        } else {
            // Si ganó un bot, el humano perdió
            const jugadorHumano = gameVsBot.game.players[gameVsBot.jugadorHumanoIndex];
            await pool.query(
                `UPDATE Usuario 
                 SET partidas_perdidas = partidas_perdidas + 1, partidas_jugadas = partidas_jugadas + 1
                 WHERE id_usuario = ?`,
                [jugadorHumano.id_usuario]
            );
        }

        await pool.query(
            `UPDATE Partida 
             SET estado = 'terminada', fecha_fin = NOW(), id_ganador = ?
             WHERE id_partida = ?`,
            [id_ganador, id_partida]
        );
    } catch (error) {
        console.error('Error al finalizar partida vs bot:', error);
    }
}

// ============================================
// FIN RUTAS VS BOT
// ============================================


async function generarCodigoAccesoUnico() {
    // 8 caracteres hex (fácil de dictar/teclear): p.ej. "A3F91C2B"
    for (let i = 0; i < 10; i++) {
        const codigo = crypto.randomBytes(4).toString('hex').toUpperCase();
        const [existe] = await pool.query(
            'SELECT id_partida FROM Partida WHERE codigo_acceso = ? LIMIT 1',
            [codigo]
        );
        if (!existe || existe.length === 0) {
            return codigo;
        }
    }
    throw new Error('No se pudo generar un código de acceso único. Inténtalo de nuevo.');
}


app.post('/api/partida/crear', requireAuth, async (req, res) => {
    const { max_jugadores, cartas_iniciales, id_torneo, es_privada } = req.body;
    
    try {
        if (!max_jugadores || max_jugadores < 2 || max_jugadores > 6) {
            return res.status(400).json({
                success: false,
                message: 'El numero de jugadores debe estar entre 2 y 6'
            });
        }

        if (!cartas_iniciales || cartas_iniciales < 3 || cartas_iniciales > 6) {
            return res.status(400).json({
                success: false,
                message: 'Las cartas iniciales deben estar entre 3 y 6'
            });
        }

        const privada = !!es_privada;
        const codigoAcceso = privada ? await generarCodigoAccesoUnico() : null;

        const [result] = await pool.query(
            `INSERT INTO Partida (fecha_inicio, estado, cartas_iniciales, max_jugadores, tipo_partida, es_privada, codigo_acceso, id_torneo)
             VALUES (NOW(), 'esperando_jugadores', ?, ?, 'multijugador', ?, ?, ?)`,
            [cartas_iniciales, max_jugadores, privada ? 1 : 0, codigoAcceso, id_torneo]
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
                creador: users[0].nombre_usuario,
                es_privada: privada,
                codigo_acceso: codigoAcceso
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

app.post('/api/partida/unirse-codigo', requireAuth, async (req, res) => {
    const { codigo_acceso } = req.body;

    try {
        if (!codigo_acceso || typeof codigo_acceso !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Debes proporcionar un código de acceso'
            });
        }

        const codigo = codigo_acceso.trim().toUpperCase();

        const [partidas] = await pool.query(
            `SELECT * FROM Partida
             WHERE codigo_acceso = ?
               AND es_privada = 1
               AND tipo_partida = 'multijugador'
             LIMIT 1`,
            [codigo]
        );

        if (partidas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Código inválido o partida no encontrada'
            });
        }

        const partida = partidas[0];

        if (partida.estado !== 'esperando_jugadores') {
            return res.status(400).json({
                success: false,
                message: 'La partida ya inició o ha finalizado'
            });
        }

        const [jugadoresActuales] = await pool.query(
            'SELECT COUNT(*) as total FROM Partida_Jugador WHERE id_partida = ?',
            [partida.id_partida]
        );

        if (jugadoresActuales[0].total >= partida.max_jugadores) {
            return res.status(400).json({
                success: false,
                message: 'La partida está completa'
            });
        }

        const [yaUnido] = await pool.query(
            'SELECT * FROM Partida_Jugador WHERE id_partida = ? AND id_usuario = ?',
            [partida.id_partida, req.session.userId]
        );

        if (yaUnido.length === 0) {
            await pool.query(
                'INSERT INTO Partida_Jugador (id_partida, id_usuario) VALUES (?, ?)',
                [partida.id_partida, req.session.userId]
            );
        }

        const [jugadoresTotal] = await pool.query(
            'SELECT COUNT(*) as total FROM Partida_Jugador WHERE id_partida = ?',
            [partida.id_partida]
        );

        return res.json({
            success: true,
            message: 'Te has unido a la partida',
            id_partida: partida.id_partida,
            jugadores_actuales: jugadoresTotal[0].total,
            max_jugadores: partida.max_jugadores,
            partida_completa: jugadoresTotal[0].total === partida.max_jugadores
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

        if (partida.es_privada) {
            return res.status(403).json({
                success: false,
                message: 'Esta partida es privada. Únete con el código de acceso.'
            });
        }

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

        res.json({
            success: true,
            message: 'Te has unido a la partida',
            jugadores_actuales: jugadoresTotal[0].total,
            max_jugadores: partida.max_jugadores,
            partida_completa: jugadoresTotal[0].total === partida.max_jugadores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// RUTAS PARA AÑADIR/QUITAR BOTS EN PARTIDAS MULTIJUGADOR
// ============================================

const BotPlayer = require('../models/BotPlayer');

app.post('/api/partida/:id/agregar-bot', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { dificultad } = req.body;
    
    try {
        // Verificar que la partida existe y está en espera
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
                message: 'No se pueden agregar bots a una partida ya iniciada'
            });
        }

        // Verificar que el usuario es el creador de la partida
        const creadorId = await getCreadorIdPartida(id);
        if (!creadorId || creadorId !== req.session.userId) {
            return res.status(403).json({
                success: false,
                message: 'Solo el creador de la partida puede agregar bots'
            });
        }

        const [jugadoresTabla] = await pool.query(
            'SELECT id_usuario FROM Partida_Jugador WHERE id_partida = ?',
            [id]
        );

        const idsTabla = new Set((jugadoresTabla || []).map(r => r.id_usuario));

        const botsInfoActual = await getBotsInfoSafe(id);
        const idsBotsInfo = new Set(
            (Array.isArray(botsInfoActual) ? botsInfoActual : [])
                .map(b => b?.id_usuario)
                .filter(Boolean)
        );

        let totalActual = idsTabla.size;
        for (const botId of idsBotsInfo) {
            if (!idsTabla.has(botId)) totalActual += 1;
        }

        if (totalActual >= partida.max_jugadores) {
            return res.status(400).json({
                success: false,
                message: 'La partida está completa'
            });
        }

        const [ultimoBot] = await pool.query(
            'SELECT MIN(id_usuario) as min_id FROM Partida_Jugador WHERE id_partida = ? AND id_usuario < 0',
            [id]
        );

        const minIdTabla = ultimoBot[0]?.min_id ? Number(ultimoBot[0].min_id) : 0;
        const minIdInfo = Array.isArray(botsInfoActual) && botsInfoActual.length
            ? Math.min(...botsInfoActual.map(b => Number(b?.id_usuario) || 0))
            : 0;

        const minId = Math.min(minIdTabla || 0, minIdInfo || 0);

        const botId = minId ? minId - 1 : -1;
        const dificultadValida = ['facil', 'normal', 'dificil'].includes(dificultad) ? dificultad : 'normal';
        const nombreBot = BotPlayer.generarNombreAleatorio();

        const botInfo = {
            id_usuario: botId,
            nombre: nombreBot,
            dificultad: dificultadValida,
            esBot: true
        };

        let insertOk = false;
        try {
            await pool.query(
                'INSERT INTO Partida_Jugador (id_partida, id_usuario) VALUES (?, ?)',
                [id, botId]
            );
            insertOk = true;
        } catch (error) {
            if (!(error && (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW'))) {
                throw error;
            }
        }

        const botsInfo = Array.isArray(botsInfoActual) ? botsInfoActual : [];
        botsInfo.push(botInfo);
        const persisted = await setBotsInfoSafe(id, botsInfo);
        if (!persisted && !insertOk) {
            return res.status(500).json({
                success: false,
                message: 'Tu base de datos no soporta bots (falta bots_info o restricciones). Ejecuta los scripts de Sprint 4.'
            });
        }

        // Verificar si ahora está completa
        const [jugadoresTablaTras] = await pool.query(
            'SELECT id_usuario FROM Partida_Jugador WHERE id_partida = ?',
            [id]
        );

        const idsTablaTras = new Set((jugadoresTablaTras || []).map(r => r.id_usuario));
        let totalJugadores = idsTablaTras.size;
        for (const bot of botsInfo) {
            const botId = bot?.id_usuario;
            if (!botId) continue;
            if (!idsTablaTras.has(botId)) totalJugadores += 1;
        }

        res.json({
            success: true,
            message: `Bot "${nombreBot}" agregado a la partida`,
            bot: botInfo,
            jugadores_actuales: totalJugadores,
            max_jugadores: partida.max_jugadores,
            partida_completa: totalJugadores === partida.max_jugadores
        });
    } catch (error) {
        console.error('Error al agregar bot:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/partida/:id/iniciar', requireAuth, async (req, res) => {
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
        if (partida.tipo_partida !== 'multijugador') {
            return res.status(400).json({
                success: false,
                message: 'Solo se puede iniciar manualmente una partida multijugador'
            });
        }

        if (partida.estado !== 'esperando_jugadores') {
            return res.status(400).json({
                success: false,
                message: 'La partida ya inició o ha finalizado'
            });
        }

        const creadorId = await getCreadorIdPartida(id);
        if (!creadorId || Number(creadorId) !== Number(req.session.userId)) {
            return res.status(403).json({
                success: false,
                message: 'Solo el creador puede iniciar la partida'
            });
        }

        const { total } = await getTotalJugadoresIncluyendoBots(id);
        if (total !== partida.max_jugadores) {
            return res.status(400).json({
                success: false,
                message: 'La partida aún no está completa'
            });
        }

        await iniciarPartidaConBots(id, partida.max_jugadores, partida.cartas_iniciales);

        return res.json({
            success: true,
            message: 'Partida iniciada'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error && error.message ? error.message : 'Error al iniciar la partida'
        });
    }
});

app.delete('/api/partida/:id/quitar-bot/:botId', requireAuth, async (req, res) => {
    const { id, botId } = req.params;
    
    try {
        const botIdNum = parseInt(botId);
        
        if (botIdNum >= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido, no es un bot'
            });
        }

        // Verificar que es el creador
        const creadorId = await getCreadorIdPartida(id);
        if (!creadorId || creadorId !== req.session.userId) {
            return res.status(403).json({
                success: false,
                message: 'Solo el creador puede quitar bots'
            });
        }

        // Verificar que la partida está en espera
        const [partidas] = await pool.query(
            'SELECT estado FROM Partida WHERE id_partida = ?',
            [id]
        );

        if (partidas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Partida no encontrada'
            });
        }

        if (partidas[0].estado !== 'esperando_jugadores') {
            return res.status(400).json({
                success: false,
                message: 'No se pueden quitar bots de una partida iniciada'
            });
        }

        let borradoTabla = false;
        try {
            const [result] = await pool.query(
                'DELETE FROM Partida_Jugador WHERE id_partida = ? AND id_usuario = ?',
                [id, botIdNum]
            );
            borradoTabla = (result && result.affectedRows > 0);
        } catch (error) {
        }

        const botsInfo = await getBotsInfoSafe(id);
        const botsInfoFiltrado = Array.isArray(botsInfo)
            ? botsInfo.filter(bot => bot && bot.id_usuario !== botIdNum)
            : [];
        const borradoInfo = botsInfoFiltrado.length !== (Array.isArray(botsInfo) ? botsInfo.length : 0);
        await setBotsInfoSafe(id, botsInfoFiltrado);

        if (!borradoTabla && !borradoInfo) {
            return res.status(404).json({
                success: false,
                message: 'Bot no encontrado en esta partida'
            });
        }

        res.json({
            success: true,
            message: 'Bot eliminado de la partida'
        });
    } catch (error) {
        console.error('Error al quitar bot:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/partida/:id/jugadores', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const jugadores = await getJugadoresPartidaOrdenados(id);
        const creadorId = await getCreadorIdPartida(id);

        const botsInfo = await getBotsInfoSafe(id);
        const botsInfoMap = new Map(
            (Array.isArray(botsInfo) ? botsInfo : []).map(b => [b?.id_usuario, b])
        );
        const idsYaEnTabla = new Set(jugadores.map(j => j.id_usuario));

        // Combinar información
        const jugadoresCompletos = jugadores.map(j => {
            if (j.id_usuario < 0) {
                const botInfo = botsInfoMap.get(j.id_usuario);
                return {
                    id_usuario: j.id_usuario,
                    nombre_usuario: botInfo ? botInfo.nombre : 'Bot',
                    esBot: true,
                    dificultad: botInfo ? botInfo.dificultad : 'normal'
                };
            } else {
                return {
                    id_usuario: j.id_usuario,
                    nombre_usuario: j.nombre_usuario,
                    esBot: false
                };
            }
        });

        if (Array.isArray(botsInfo)) {
            for (const bot of botsInfo) {
                const botId = bot?.id_usuario;
                if (!botId || idsYaEnTabla.has(botId)) continue;
                jugadoresCompletos.push({
                    id_usuario: botId,
                    nombre_usuario: bot?.nombre || 'Bot',
                    esBot: true,
                    dificultad: bot?.dificultad || 'normal'
                });
            }
        }

        const { total } = await getTotalJugadoresIncluyendoBots(id);

        res.json({
            success: true,
            jugadores: jugadoresCompletos,
            creador_id: creadorId,
            jugadores_actuales: total
        });
    } catch (error) {
        console.error('Error al obtener jugadores:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// FIN RUTAS BOTS EN MULTIJUGADOR
// ============================================

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

async function iniciarPartidaConBots(id_partida, numJugadores, cartasIniciales) {
    try {
        let jugadores;
        try {
            [jugadores] = await pool.query(
                `SELECT pj.id_usuario
                 FROM Partida_Jugador pj
                 WHERE pj.id_partida = ?
                 ORDER BY pj.id_partida_jugador ASC`,
                [id_partida]
            );
        } catch (error) {
            if (error && error.code === 'ER_BAD_FIELD_ERROR') {
                [jugadores] = await pool.query(
                    `SELECT pj.id_usuario
                     FROM Partida_Jugador pj
                     WHERE pj.id_partida = ?
                     ORDER BY (pj.id_usuario < 0) ASC, pj.id_usuario ASC`,
                    [id_partida]
                );
            } else {
                throw error;
            }
        }

        const botsInfo = await getBotsInfoSafe(id_partida);
        const ordenIdsBase = jugadores.map(j => j.id_usuario);
        const idsEnTabla = new Set(ordenIdsBase);
        const ordenIds = [
            ...ordenIdsBase,
            ...(Array.isArray(botsInfo)
                ? botsInfo.map(b => b?.id_usuario).filter(id => id && !idsEnTabla.has(id))
                : [])
        ];

        const game = new RondaGame(numJugadores, cartasIniciales);
        game.startGame();

        for (let i = 0; i < ordenIds.length; i++) {
            const jugadorId = ordenIds[i];
            
            if (jugadorId < 0) {
                const botInfo = botsInfo.find(b => b.id_usuario === jugadorId);
                const nombre = botInfo?.nombre || BotPlayer.generarNombreAleatorio();
                const dificultad = botInfo?.dificultad || 'normal';
                const bot = new BotPlayer(nombre, dificultad);
                game.players[i].name = nombre;
                game.players[i].id_usuario = jugadorId;
                game.players[i].esBot = true;
                game.players[i].botInstance = bot;
            } else {
                const [usuario] = await pool.query(
                    'SELECT nombre_usuario FROM Usuario WHERE id_usuario = ?',
                    [jugadorId]
                );
                if (usuario.length > 0) {
                    game.players[i].name = usuario[0].nombre_usuario;
                    game.players[i].id_usuario = jugadorId;
                    game.players[i].esBot = false;
                }
            }
        }

        await pool.query(
            `UPDATE Partida SET estado = 'en_curso', estado_juego_json = ? WHERE id_partida = ?`,
            [JSON.stringify(game.toJSON()), id_partida]
        );
    } catch (error) {
        console.error('Error al iniciar partida con bots:', error);
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

        // Obtener jugadores (solo humanos; en vs_bot los bots viven en el JSON)
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

            if (partida.tipo_partida === 'vs_bot') {
                const gameVsBot = GameVsBot.fromJSON(gameData);
                estadoJuego = gameVsBot.obtenerEstado();
            } else {
                const game = RondaGame.fromJSON(gameData);
                estadoJuego = game.getGameState();
            }
        }

        // Para vs_bot, la lista real de jugadores se obtiene del estado del juego (incluye bots)
        const jugadoresNombres = (partida.tipo_partida === 'vs_bot' && estadoJuego && Array.isArray(estadoJuego.players))
            ? estadoJuego.players.map(p => p.name)
            : jugadores.map(j => j.nombre_usuario);

        const jugadoresDetalle = (partida.tipo_partida === 'vs_bot' && estadoJuego && Array.isArray(estadoJuego.players))
            ? estadoJuego.players.map(p => ({ id_usuario: p.id_usuario, nombre_usuario: p.name, esBot: !!p.esBot }))
            : jugadores;

        const jugadoresActuales = (partida.tipo_partida === 'vs_bot' && estadoJuego && Array.isArray(estadoJuego.players))
            ? estadoJuego.players.length
            : jugadores.length;

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
                tipo_partida: partida.tipo_partida,
                cartas_iniciales: partida.cartas_iniciales,
                max_jugadores: partida.max_jugadores,
                jugadores_actuales: jugadoresActuales,
                id_ganador: partida.id_ganador,
                id_perdedor: partida.id_perdedor,
                jugadores: jugadoresNombres,
                jugadores_detalle: jugadoresDetalle,
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
        const playerIndex = game.players.findIndex(p => Number(p.id_usuario) === Number(id_usuario));
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

        // Si hay fin de partida (multi-ganadores), finalizar
        let resumenFinal = null;
        if (resultado && resultado.gameOver) {
            const winnerUserIds = (resultado.winnerIds || [])
                .map(idx => game.players[idx])
                .filter(Boolean)
                .map(p => p.id_usuario);

            const loserUserId = (typeof resultado.loserId === 'number' && game.players[resultado.loserId])
                ? game.players[resultado.loserId].id_usuario
                : null;

            await finalizarPartida(id, winnerUserIds, loserUserId);
            resumenFinal = { winners: winnerUserIds, loser: loserUserId };
        }

        if (partida.tipo_partida === 'multijugador') {
            const timestamp = new Date();
            if (tipo_movimiento === 'jugar') {
                io.to(`partida_${id}`).emit('cartaJugada', {
                    id_usuario,
                    carta_jugada,
                    palo_elegido,
                    jugador_finalizado: (resultado && resultado.playerFinished) ? resultado.finishedPlayerId : null,
                    nuevo_estado: game.getGameState(),
                    timestamp
                });
            } else if (tipo_movimiento === 'robar') {
                io.to(`partida_${id}`).emit('cartaRobada', {
                    id_usuario,
                    nuevo_estado: game.getGameState(),
                    timestamp
                });
            }

            if (resumenFinal) {
                io.to(`partida_${id}`).emit('partidaFinalizada', {
                    winners: resumenFinal.winners,
                    loser: resumenFinal.loser,
                    estado_final: game.getGameState(),
                    timestamp
                });
            }
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
            gameOver: !!(resultado && resultado.gameOver),
            jugador_finalizado: (resultado && resultado.playerFinished) ? resultado.finishedPlayerId : null,
            resumen_final: resumenFinal
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
                p.es_privada,
                p.codigo_acceso,
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
              AND p.tipo_partida = 'multijugador'
              AND p.es_privada = 0
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

async function finalizarPartida(id_partida, winnerUserIds, loserUserId) {
    try {
        const winners = Array.isArray(winnerUserIds) ? [...new Set(winnerUserIds.filter(Boolean))] : [];
        const loser = loserUserId || null;

        // Mantener compatibilidad con esquema actual (1 id_ganador en tabla):
        // guardamos el primer ganador como id_ganador y el perdedor como id_perdedor.
        const idGanadorCompat = winners.length > 0 ? winners[0] : null;

        await pool.query(
            `UPDATE Partida 
             SET estado = 'terminada', fecha_fin = NOW(), id_ganador = ?, id_perdedor = ?
             WHERE id_partida = ?`,
            [idGanadorCompat, loser, id_partida]
        );

        if (winners.length > 0) {
            await pool.query(
                `UPDATE Usuario 
                 SET partidas_ganadas = partidas_ganadas + 1, partidas_jugadas = partidas_jugadas + 1
                 WHERE id_usuario IN (?)`,
                [winners]
            );
        }

        if (loser) {
            await pool.query(
                `UPDATE Usuario 
                 SET partidas_perdidas = partidas_perdidas + 1, partidas_jugadas = partidas_jugadas + 1
                 WHERE id_usuario = ?`,
                [loser]
            );
        }
    } catch (error) {
        logServerError('❌ Error en finalizarPartida:', error);
    }
}

// ============================================
// CONFIGURACIÓN DE SOCKET.IO (SPRINT 4)
// ============================================

const partidasActivas = new Map(); // id_partida -> Set de socketIds

io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    const emitClientError = (message) => {
        const safeMessage = String(message || 'Error');
        socket.emit('serverError', { message: safeMessage });
        socket.emit('error', { message: safeMessage });
    };

    // Usuario se une a una sala de partida
    socket.on('unirsePartida', async (data) => {
        const { id_partida, id_usuario, nombre_usuario } = (data || {});
        
        try {
            // Unir al socket a la sala de la partida
            socket.join(`partida_${id_partida}`);
            
            // Registrar conexión
            if (!partidasActivas.has(id_partida)) {
                partidasActivas.set(id_partida, new Set());
            }
            partidasActivas.get(id_partida).add(socket.id);
            
            console.log(`👤 ${nombre_usuario} se unió a partida ${id_partida}`);
            
            // Notificar a todos en la sala
            io.to(`partida_${id_partida}`).emit('jugadorUnido', {
                id_usuario,
                nombre_usuario,
                timestamp: new Date()
            });

            // Enviar estado actual de la partida
            const [partidas] = await pool.query(
                'SELECT * FROM Partida WHERE id_partida = ?',
                [id_partida]
            );

            if (partidas.length > 0 && partidas[0].estado_juego_json) {
                const gameData = JSON.parse(partidas[0].estado_juego_json);
                const game = RondaGame.fromJSON(gameData);
                
                socket.emit('estadoPartida', {
                    estado: game.getGameState(),
                    timestamp: new Date()
                });
            }
        } catch (error) {
            logServerError('❌ Error al unirse a partida:', error);
            emitClientError('Error al unirse a la partida');
        }
    });

    // Jugador realiza un movimiento
    socket.on('jugarCarta', async (data) => {
        const { id_partida, id_usuario, carta_jugada, palo_elegido } = (data || {});
        
        try {
            // Obtener partida
            const [partidas] = await pool.query(
                'SELECT * FROM Partida WHERE id_partida = ? AND estado = "en_curso"',
                [id_partida]
            );

            if (partidas.length === 0) {
                emitClientError('Partida no encontrada');
                return;
            }

            const partida = partidas[0];
            const gameData = JSON.parse(partida.estado_juego_json);
            const game = RondaGame.fromJSON(gameData);

            // Encontrar índice del jugador
            const playerIndex = game.players.findIndex(p => Number(p.id_usuario) === Number(id_usuario));
            if (playerIndex === -1) {
                emitClientError('Jugador no encontrado');
                return;
            }

            // Ejecutar movimiento
            const [value, suit] = carta_jugada.split('_');
            const resultado = game.playCard(playerIndex, parseInt(value), suit, palo_elegido);

            // Guardar estado actualizado
            await pool.query(
                'UPDATE Partida SET estado_juego_json = ? WHERE id_partida = ?',
                [JSON.stringify(game.toJSON()), id_partida]
            );

            // Registrar movimiento en BD
            await pool.query(
                `INSERT INTO Movimiento (id_partida, id_usuario, tipo_movimiento, carta_jugada, palo_elegido, timestamp)
                 VALUES (?, ?, 'jugar', ?, ?, NOW())`,
                [id_partida, id_usuario, carta_jugada, palo_elegido]
            );

            // Emitir actualización a todos los jugadores de la sala
            io.to(`partida_${id_partida}`).emit('cartaJugada', {
                id_usuario,
                carta_jugada,
                palo_elegido,
                jugador_finalizado: resultado && resultado.playerFinished ? resultado.finishedPlayerId : null,
                nuevo_estado: game.getGameState(),
                timestamp: new Date()
            });

            // Si hay fin de partida (multi-ganadores), finalizar y notificar
            if (resultado && resultado.gameOver) {
                const winnerUserIds = (resultado.winnerIds || [])
                    .map(idx => game.players[idx])
                    .filter(Boolean)
                    .map(p => p.id_usuario);

                const loserUserId = (typeof resultado.loserId === 'number' && game.players[resultado.loserId])
                    ? game.players[resultado.loserId].id_usuario
                    : null;

                await finalizarPartida(id_partida, winnerUserIds, loserUserId);

                io.to(`partida_${id_partida}`).emit('partidaFinalizada', {
                    winners: winnerUserIds,
                    loser: loserUserId,
                    estado_final: game.getGameState(),
                    timestamp: new Date()
                });
            }

        } catch (error) {
            logServerError('❌ Error al jugar carta:', error);
            emitClientError(error && error.message ? error.message : 'Error al jugar carta');
        }
    });

    // Jugador roba carta
    socket.on('robarCarta', async (data) => {
        const { id_partida, id_usuario } = (data || {});
        
        try {
            const [partidas] = await pool.query(
                'SELECT * FROM Partida WHERE id_partida = ? AND estado = "en_curso"',
                [id_partida]
            );

            if (partidas.length === 0) {
                emitClientError('Partida no encontrada');
                return;
            }

            const partida = partidas[0];
            const gameData = JSON.parse(partida.estado_juego_json);
            const game = RondaGame.fromJSON(gameData);

            const playerIndex = game.players.findIndex(p => Number(p.id_usuario) === Number(id_usuario));
            if (playerIndex === -1) {
                emitClientError('Jugador no encontrado');
                return;
            }

            // Robar carta
            game.playerDrawCard(playerIndex);

            // Guardar estado
            await pool.query(
                'UPDATE Partida SET estado_juego_json = ? WHERE id_partida = ?',
                [JSON.stringify(game.toJSON()), id_partida]
            );

            // Registrar movimiento
            await pool.query(
                `INSERT INTO Movimiento (id_partida, id_usuario, tipo_movimiento, timestamp)
                 VALUES (?, ?, 'robar', NOW())`,
                [id_partida, id_usuario]
            );

            // Emitir actualización
            io.to(`partida_${id_partida}`).emit('cartaRobada', {
                id_usuario,
                nuevo_estado: game.getGameState(),
                timestamp: new Date()
            });

        } catch (error) {
            logServerError('❌ Error al robar carta:', error);
            emitClientError(error && error.message ? error.message : 'Error al robar carta');
        }
    });

    // Desconexión
    socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
        
        // Limpiar de las salas activas
        for (const [id_partida, sockets] of partidasActivas.entries()) {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    partidasActivas.delete(id_partida);
                }
            }
        }
    });
});

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a MySQL');
        console.log(`   Database: ${config.db.database}`);
        console.log(`   Host: ${config.db.host}:${config.db.port}`);
        connection.release();
        server.listen(PORT, () => {
            console.log('');
            console.log('╔════════════════════════════════════════╗');
            console.log('║   🎮 SERVIDOR RONDA MARROQUÍ ACTIVO   ║');
            console.log('╚════════════════════════════════════════╝');
            console.log('');
            console.log(`🌐 Servidor HTTP: http://localhost:${PORT}`);
            console.log(`🔌 WebSocket activo en puerto ${PORT}`);
            console.log(`📊 Base de datos: ${config.db.database}`);
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
            console.log('   === PARTIDAS (SPRINT 4 - WebSockets) ===');
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
        const message = error && error.message ? String(error.message) : String(error || '');
        console.error('');
        console.error('❌ ERROR: No se pudo conectar a MySQL');
        console.error('');
        console.error('🔧 Verifica que:');
        console.error('   1. XAMPP esté ejecutándose');
        console.error('   2. MySQL esté activo (verde en XAMPP)');
        console.error('   3. La base de datos "ronda_marroqui" exista');
        console.error('   4. Las tablas estén creadas (sprint4-final.sql)');
        console.error('');
        console.error('Error:', message);
        process.exit(1);
    });
process.on('uncaughtException', (error) => {
    logServerError('❌ Error no capturado:', error);
});
process.on('unhandledRejection', (error) => {
    logServerError('❌ Promesa rechazada:', error);
});
