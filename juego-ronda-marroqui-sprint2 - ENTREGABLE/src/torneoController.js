
const db = require('./db'); 

function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}


async function checkAdminRole(id_usuario) {
    if (id_usuario === 1 || id_usuario === 2) return true;
    
  
    
    return false;
}


exports.crearTorneo = async (req, res) => {
    const { nombre, max_participantes, tipo, cartas_iniciales, fecha_inicio, id_creador } = req.body;
    
  
    if (!await checkAdminRole(id_creador)) {
        return res.status(403).json({ success: false, message: "Acceso denegado. Se requiere rol de administrador." });
    }

    if (!nombre || !max_participantes || !tipo || !fecha_inicio) {
        return res.status(400).json({ success: false, message: "Faltan campos obligatorios." });
    }
    
    const numParticipantes = parseInt(max_participantes);

    if (numParticipantes < 4 || numParticipantes > 32) {
        return res.status(400).json({ success: false, message: "El número máximo de participantes debe ser entre 4 y 32." });
    }

    if (tipo === 'eliminatorio' && !isPowerOfTwo(numParticipantes)) {
        return res.status(400).json({ success: false, message: "Para torneos de eliminación directa, el número de participantes debe ser potencia de 2 (4, 8, 16, 32)." });
    }

    try {

        const existingTorneos = await db.query('SELECT id_torneo FROM Torneo WHERE nombre = ?', [nombre]);
        if (existingTorneos.length > 0) {
            return res.status(400).json({ success: false, message: "El nombre del torneo ya está en uso." });
        }
        
       
        const sql = `
            INSERT INTO Torneo (nombre, fecha_inicio, max_participantes, tipo, cartas_iniciales)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await db.query(sql, [nombre, fecha_inicio, numParticipantes, tipo, cartas_iniciales || 5]);
        const id_torneo = result.insertId;

        return res.status(201).json({
            success: true,
            message: "Torneo creado exitosamente.",
            torneo: {
                id_torneo: id_torneo,
                nombre,
                estado: "pendiente",
                max_participantes: numParticipantes,
                participantes_actuales: 0
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error interno del servidor al crear el torneo." });
    }
};


exports.inscribirUsuario = async (req, res) => {
    const id_torneo = req.params.id;
   
    const { id_usuario } = req.body; 

    if (!id_usuario) {
        return res.status(401).json({ success: false, message: "Usuario no autenticado." });
    }
    
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();
        const [torneo] = await connection.query('SELECT estado, max_participantes FROM Torneo WHERE id_torneo = ? FOR UPDATE', [id_torneo]);
        
        if (torneo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Torneo no encontrado." });
        }
        const { estado, max_participantes } = torneo[0];
        
        if (estado !== 'pendiente') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Inscripciones cerradas. El torneo ya está en curso o finalizado." });
        }

        const [isRegistered] = await connection.query('SELECT COUNT(*) as count FROM Clasificacion_Torneo WHERE id_torneo = ? AND id_usuario = ?', [id_torneo, id_usuario]);
        if (isRegistered[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Ya estás inscrito en este torneo." });
        }

        const [currentParticipants] = await connection.query('SELECT COUNT(*) as count FROM Clasificacion_Torneo WHERE id_torneo = ?', [id_torneo]);
        if (currentParticipants[0].count >= max_participantes) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Cupo completo. El torneo ha alcanzado el número máximo de participantes." });
        }

        const [activeTorneos] = await connection.query(`
            SELECT t.nombre FROM Clasificacion_Torneo ct
            JOIN Torneo t ON ct.id_torneo = t.id_torneo
            WHERE ct.id_usuario = ? AND t.estado IN ('pendiente', 'en_curso')
        `, [id_usuario]);
        
        if (activeTorneos.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: `Ya estás inscrito en el torneo activo: ${activeTorneos[0].nombre}` });
        }
        
        const insertSql = 'INSERT INTO Clasificacion_Torneo (id_torneo, id_usuario, puntos) VALUES (?, ?, 0)';
        await connection.query(insertSql, [id_torneo, id_usuario]);

        await connection.commit();
        return res.status(200).json({ success: true, message: "Inscripción exitosa" });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        return res.status(500).json({ success: false, message: "Error interno del servidor al inscribir al usuario." });
    } finally {
        connection.release();
    }
};

exports.obtenerTorneo = async (req, res) => {
    const id_torneo = req.params.id;

    try {
        const torneo = await db.query('SELECT * FROM Torneo WHERE id_torneo = ?', [id_torneo]);
        if (torneo.length === 0) {
            return res.status(404).json({ success: false, message: "Torneo no encontrado." });
        }
        
        const torneoData = torneo[0];
        
        const clasificacion = await db.query(`
            SELECT 
                ct.id_usuario,
                u.nombre_usuario,
                ct.puntos,
                COUNT(p.id_partida) AS partidas_jugadas,
                SUM(CASE WHEN p.id_ganador = ct.id_usuario THEN 1 ELSE 0 END) AS partidas_ganadas
            FROM Clasificacion_Torneo ct
            JOIN Usuario u ON ct.id_usuario = u.id_usuario
            LEFT JOIN Partida p ON p.id_torneo = ct.id_torneo 
                AND (p.id_ganador = ct.id_usuario OR p.id_perdedor = ct.id_usuario)
            WHERE ct.id_torneo = ?
            GROUP BY ct.id_usuario
            ORDER BY ct.puntos DESC, partidas_ganadas DESC;
        `, [id_torneo]);
        
        const partidas = await db.query('SELECT id_partida, estado, fecha_inicio, id_ganador FROM Partida WHERE id_torneo = ?', [id_torneo]);

        console.log('torneoData:', torneoData);
        return res.status(200).json({
            success: true,
            torneo: {
                ...torneoData,
                participantes: clasificacion,
                partidas: partidas
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error interno del servidor al obtener el torneo." });
    }
};

exports.listarTorneosActivos = async (req, res) => {
    try {
       
        const torneos = await db.query('SELECT id_torneo, nombre, estado, fecha_inicio, max_participantes FROM Torneo WHERE estado IN ("pendiente", "en_curso")');

        const torneosConteo = await Promise.all(torneos.map(async (torneo) => {
            const [countResult] = await db.query('SELECT COUNT(*) AS participantes FROM Clasificacion_Torneo WHERE id_torneo = ?', [torneo.id_torneo]);
            return {
                id_torneo: torneo.id_torneo,
                nombre: torneo.nombre,
                estado: torneo.estado,
                participantes: countResult[0].participantes,
                max_participantes: torneo.max_participantes
            };
        }));
        
        return res.status(200).json({
            success: true,
            torneos: torneosConteo
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error interno del servidor al listar los torneos." });
    }
};

// Obtener la clasificación de un torneo
exports.obtenerClasificacionTorneo = async (req, res) => {
    const id_torneo = req.params.id;
    try {
        const clasificacion = await db.query(`
            SELECT 
                ct.id_usuario,
                u.nombre_usuario,
                ct.puntos AS puntos
            FROM Clasificacion_Torneo ct
            JOIN Usuario u ON ct.id_usuario = u.id_usuario
            WHERE ct.id_torneo = ?
            ORDER BY ct.puntos DESC
        `, [id_torneo]);
        return res.status(200).json({
            success: true,
            clasificacion
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error al obtener la clasificación del torneo." });
    }
};

// Obtener todas las clasificaciones de un usuario en diferentes torneos
exports.obtenerClasificacionesPorUsuario = async (req, res) => {
    const id_usuario = req.params.id_usuario;
    try {
        const clasificaciones = await db.query(`
            SELECT 
                ct.id_torneo,
                t.nombre AS nombre_torneo,
                ct.puntos AS puntos
            FROM Clasificacion_Torneo ct
            JOIN Torneo t ON ct.id_torneo = t.id_torneo
            WHERE ct.id_usuario = ?
            ORDER BY ct.puntos DESC
        `, [id_usuario]);
        return res.status(200).json({
            success: true,
            clasificaciones
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error al obtener las clasificaciones del usuario." });
    }
};