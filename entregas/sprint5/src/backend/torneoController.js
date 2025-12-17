const mysql = require('mysql2/promise');

let pool = null;

function initPool(dbPool) {
    pool = dbPool;
    console.log('✅ Pool de conexiones inicializado en torneoController');
}

function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}

async function checkAdminRole(id_usuario) {
    try {
        const [users] = await pool.query(
            'SELECT rol FROM Usuario WHERE id_usuario = ?',
            [id_usuario]
        );
        
        if (users.length === 0) return false;
        return users[0].rol === 'admin';
    } catch (error) {
        console.error('Error al verificar rol de admin:', error);
        return false;
    }
}

async function crearTorneo(req, res) {
    const { nombre, max_participantes, tipo, cartas_iniciales, fecha_inicio } = req.body;
    const id_creador = req.session.userId;
    
    if (!id_creador) {
        return res.status(401).json({ 
            success: false, 
            message: "Debes iniciar sesión para crear un torneo." 
        });
    }

    if (!await checkAdminRole(id_creador)) {
        return res.status(403).json({ 
            success: false, 
            message: "Acceso denegado. Solo los administradores pueden crear torneos." 
        });
    }

    if (!nombre || !max_participantes || !tipo || !fecha_inicio) {
        return res.status(400).json({ 
            success: false, 
            message: "Faltan campos obligatorios (nombre, max_participantes, tipo, fecha_inicio)." 
        });
    }
    
    const numParticipantes = parseInt(max_participantes);

    if (numParticipantes < 4 || numParticipantes > 32) {
        return res.status(400).json({ 
            success: false, 
            message: "El número máximo de participantes debe ser entre 4 y 32." 
        });
    }

    if (tipo === 'eliminatorio' && !isPowerOfTwo(numParticipantes)) {
        return res.status(400).json({ 
            success: false, 
            message: "Para torneos de eliminación directa, el número de participantes debe ser potencia de 2 (4, 8, 16, 32)." 
        });
    }

    const cartasIniciales = cartas_iniciales || 5;
    if (cartasIniciales < 3 || cartasIniciales > 6) {
        return res.status(400).json({ 
            success: false, 
            message: "Las cartas iniciales deben estar entre 3 y 6." 
        });
    }

    try {
        const [existingTorneos] = await pool.query(
            'SELECT id_torneo FROM Torneo WHERE nombre = ?', 
            [nombre]
        );
        
        if (existingTorneos.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Ya existe un torneo con ese nombre." 
            });
        }
        
        const sql = `
            INSERT INTO Torneo (nombre, max_participantes, tipo, cartas_iniciales, fecha_inicio, estado, descripcion)
            VALUES (?, ?, ?, ?, ?, 'pendiente', ?)
        `;
        
        const [result] = await pool.query(sql, [
            nombre, 
            numParticipantes, 
            tipo, 
            cartasIniciales,
            fecha_inicio,
            `Torneo ${tipo} creado por administrador`
        ]);
        
        const id_torneo = result.insertId;

        console.log(`✅ Torneo creado: ${nombre} (ID: ${id_torneo}) por admin ID: ${id_creador}`);

        return res.status(201).json({
            success: true,
            message: "Torneo creado exitosamente.",
            torneo: {
                id_torneo: id_torneo,
                nombre,
                estado: "pendiente",
                tipo,
                max_participantes: numParticipantes,
                cartas_iniciales: cartasIniciales,
                participantes_actuales: 0,
                fecha_inicio
            }
        });
    } catch (error) {
        console.error('❌ Error al crear torneo:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error interno del servidor al crear el torneo.",
            error: error.message 
        });
    }
}

async function inscribirUsuario(req, res) {
    const id_torneo = parseInt(req.params.id);
    const id_usuario = req.session.userId;

    if (!id_usuario) {
        return res.status(401).json({ 
            success: false, 
            message: "Debes iniciar sesión para inscribirte en un torneo." 
        });
    }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const [torneo] = await connection.query(
            'SELECT estado, max_participantes, nombre, tipo FROM Torneo WHERE id_torneo = ? FOR UPDATE', 
            [id_torneo]
        );
        
        if (torneo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false, 
                message: "Torneo no encontrado." 
            });
        }
        
        const { estado, max_participantes, nombre, tipo } = torneo[0];
        
        if (estado !== 'pendiente') {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Inscripciones cerradas. El torneo ya está en curso o ha finalizado." 
            });
        }

        const [isRegistered] = await connection.query(
            'SELECT COUNT(*) as count FROM Clasificacion_Torneo WHERE id_torneo = ? AND id_usuario = ?', 
            [id_torneo, id_usuario]
        );
        
        if (isRegistered[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Ya estás inscrito en este torneo." 
            });
        }

        const [currentParticipants] = await connection.query(
            'SELECT COUNT(*) as count FROM Clasificacion_Torneo WHERE id_torneo = ?', 
            [id_torneo]
        );
        
        if (currentParticipants[0].count >= max_participantes) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Cupo completo. El torneo ha alcanzado el número máximo de participantes." 
            });
        }

        const [activeTorneos] = await connection.query(`
            SELECT t.nombre, t.id_torneo 
            FROM Clasificacion_Torneo ct
            JOIN Torneo t ON ct.id_torneo = t.id_torneo
            WHERE ct.id_usuario = ? AND t.estado IN ('pendiente', 'en_curso')
        `, [id_usuario]);
        
        if (activeTorneos.length > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: `Ya estás inscrito en el torneo activo: "${activeTorneos[0].nombre}" (ID: ${activeTorneos[0].id_torneo})` 
            });
        }
        
        const insertSql = 'INSERT INTO Clasificacion_Torneo (id_torneo, id_usuario, puntos) VALUES (?, ?, 0)';
        await connection.query(insertSql, [id_torneo, id_usuario]);

        await connection.commit();
        
        const [nuevoConteo] = await pool.query(
            'SELECT COUNT(*) as count FROM Clasificacion_Torneo WHERE id_torneo = ?',
            [id_torneo]
        );

        console.log(`✅ Usuario ${id_usuario} inscrito en torneo "${nombre}" (${nuevoConteo[0].count}/${max_participantes})`);

        return res.status(200).json({ 
            success: true, 
            message: `Te has inscrito exitosamente en el torneo "${nombre}"`,
            torneo: {
                id_torneo,
                nombre,
                tipo,
                participantes_actuales: nuevoConteo[0].count,
                max_participantes
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al inscribir usuario:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error interno del servidor al inscribir al usuario.",
            error: error.message 
        });
    } finally {
        connection.release();
    }
}

async function obtenerTorneo(req, res) {
    const id_torneo = parseInt(req.params.id);

    try {
        const [datos_torneo] = await pool.query(
            'SELECT * FROM Torneo WHERE id_torneo = ?', 
            [id_torneo]
        );
        
        if (datos_torneo.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Torneo no encontrado." 
            });
        }
        
        const [clasificacion] = await pool.query(`
            SELECT 
                ct.id_usuario,
                u.nombre_usuario,
                ct.puntos,
                COUNT(DISTINCT p.id_partida) AS partidas_jugadas,
                SUM(CASE WHEN p.id_ganador = ct.id_usuario THEN 1 ELSE 0 END) AS partidas_ganadas,
                SUM(CASE WHEN p.id_perdedor = ct.id_usuario THEN 1 ELSE 0 END) AS partidas_perdidas
            FROM Clasificacion_Torneo ct
            JOIN Usuario u ON ct.id_usuario = u.id_usuario
            LEFT JOIN Partida p ON p.id_torneo = ct.id_torneo 
                AND (p.id_ganador = ct.id_usuario OR p.id_perdedor = ct.id_usuario)
            WHERE ct.id_torneo = ?
            GROUP BY ct.id_usuario, u.nombre_usuario, ct.puntos
            ORDER BY ct.puntos DESC, partidas_ganadas DESC
        `, [id_torneo]);
        
        const [partidas] = await pool.query(`
            SELECT 
                p.id_partida, 
                p.estado, 
                p.fecha_inicio, 
                p.fecha_fin,
                p.id_ganador,
                ganador.nombre_usuario as nombre_ganador
            FROM Partida p
            LEFT JOIN Usuario ganador ON p.id_ganador = ganador.id_usuario
            WHERE p.id_torneo = ?
            ORDER BY p.fecha_inicio DESC
        `, [id_torneo]);

        return res.status(200).json({
            success: true,
            torneo: datos_torneo[0],
            participantes: clasificacion,
            partidas: partidas,
            estadisticas: {
                total_participantes: clasificacion.length,
                max_participantes: datos_torneo[0].max_participantes,
                total_partidas: partidas.length,
                partidas_completadas: partidas.filter(p => p.estado === 'terminada').length
            }
        });
    } catch (error) {
        console.error('❌ Error al obtener torneo:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error interno del servidor al obtener el torneo.",
            error: error.message 
        });
    }
}

async function listarTorneosActivos(req, res) {
    try {
        const [torneos] = await pool.query(`
            SELECT 
                id_torneo, 
                nombre, 
                estado, 
                tipo,
                fecha_inicio, 
                max_participantes,
                cartas_iniciales,
                descripcion
            FROM Torneo 
            WHERE estado IN ('pendiente', 'en_curso')
            ORDER BY fecha_inicio ASC
        `);

        const torneosConConteo = await Promise.all(torneos.map(async (torneo) => {
            const [countResult] = await pool.query(
                'SELECT COUNT(*) AS participantes FROM Clasificacion_Torneo WHERE id_torneo = ?', 
                [torneo.id_torneo]
            );
            
            return {
                id_torneo: torneo.id_torneo,
                nombre: torneo.nombre,
                estado: torneo.estado,
                tipo: torneo.tipo,
                fecha_inicio: torneo.fecha_inicio,
                cartas_iniciales: torneo.cartas_iniciales,
                descripcion: torneo.descripcion,
                participantes_actuales: countResult[0].participantes,
                max_participantes: torneo.max_participantes,
                cupo_disponible: torneo.max_participantes - countResult[0].participantes
            };
        }));
        
        return res.status(200).json({
            success: true,
            torneos: torneosConConteo,
            total: torneosConConteo.length
        });
    } catch (error) {
        console.error('❌ Error al listar torneos:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error interno del servidor al listar los torneos.",
            error: error.message 
        });
    }
}

async function obtenerClasificacionTorneo(req, res) {
    const id_torneo = parseInt(req.params.id);
    
    try {
        const [clasificacion] = await pool.query(`
            SELECT 
                ct.id_usuario,
                u.nombre_usuario,
                ct.puntos,
                COUNT(DISTINCT p.id_partida) AS partidas_jugadas,
                SUM(CASE WHEN p.id_ganador = ct.id_usuario THEN 1 ELSE 0 END) AS partidas_ganadas
            FROM Clasificacion_Torneo ct
            JOIN Usuario u ON ct.id_usuario = u.id_usuario
            LEFT JOIN Partida p ON p.id_torneo = ct.id_torneo 
                AND (p.id_ganador = ct.id_usuario OR p.id_perdedor = ct.id_usuario)
            WHERE ct.id_torneo = ?
            GROUP BY ct.id_usuario, u.nombre_usuario, ct.puntos
            ORDER BY ct.puntos DESC, partidas_ganadas DESC
        `, [id_torneo]);
        
        return res.status(200).json({
            success: true,
            id_torneo,
            clasificacion
        });
    } catch (error) {
        console.error('❌ Error al obtener clasificación:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error al obtener la clasificación del torneo.",
            error: error.message 
        });
    }
}

async function obtenerClasificacionesPorUsuario(req, res) {
    const id_usuario = parseInt(req.params.id_usuario);
    
    try {
        const [clasificaciones] = await pool.query(`
            SELECT 
                ct.id_torneo,
                t.nombre AS nombre_torneo,
                t.estado AS estado_torneo,
                t.tipo,
                ct.puntos,
                COUNT(DISTINCT p.id_partida) AS partidas_jugadas,
                SUM(CASE WHEN p.id_ganador = ct.id_usuario THEN 1 ELSE 0 END) AS partidas_ganadas
            FROM Clasificacion_Torneo ct
            JOIN Torneo t ON ct.id_torneo = t.id_torneo
            LEFT JOIN Partida p ON p.id_torneo = ct.id_torneo 
                AND (p.id_ganador = ct.id_usuario OR p.id_perdedor = ct.id_usuario)
            WHERE ct.id_usuario = ?
            GROUP BY ct.id_torneo, t.nombre, t.estado, t.tipo, ct.puntos
            ORDER BY ct.puntos DESC, t.fecha_inicio DESC
        `, [id_usuario]);
        
        return res.status(200).json({
            success: true,
            id_usuario,
            clasificaciones,
            total_torneos: clasificaciones.length
        });
    } catch (error) {
        console.error('❌ Error al obtener clasificaciones del usuario:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error al obtener las clasificaciones del usuario.",
            error: error.message 
        });
    }
}

async function actualizarEstadoTorneo(req, res) {
    const id_torneo = parseInt(req.params.id);
    const { estado } = req.body;
    const id_usuario = req.session.userId;

    if (!id_usuario || !await checkAdminRole(id_usuario)) {
        return res.status(403).json({ 
            success: false, 
            message: "Acceso denegado. Solo los administradores pueden modificar torneos." 
        });
    }

    const estadosValidos = ['pendiente', 'en_curso', 'finalizado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ 
            success: false, 
            message: "Estado inválido. Debe ser: pendiente, en_curso o finalizado." 
        });
    }

    try {
        const [result] = await pool.query(
            'UPDATE Torneo SET estado = ? WHERE id_torneo = ?',
            [estado, id_torneo]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Torneo no encontrado." 
            });
        }

        console.log(`✅ Estado del torneo ${id_torneo} actualizado a: ${estado}`);

        return res.status(200).json({
            success: true,
            message: `Estado del torneo actualizado a: ${estado}`,
            id_torneo,
            nuevo_estado: estado
        });
    } catch (error) {
        console.error('❌ Error al actualizar estado:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error al actualizar el estado del torneo.",
            error: error.message 
        });
    }
}

module.exports = {
    initPool,
    crearTorneo,
    inscribirUsuario,
    obtenerTorneo,
    listarTorneosActivos,
    obtenerClasificacionTorneo,
    obtenerClasificacionesPorUsuario,
    actualizarEstadoTorneo
};
