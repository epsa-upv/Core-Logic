
const db = require('../db-config');
const { body, validationResult } = require('express-validator'); 
exports.crearTorneo = async (req, res) => {
    const { nombre, max_participantes, tipo, cartas_iniciales, fecha_inicio } = req.body;

    if (!nombre || !max_participantes || !tipo || !fecha_inicio) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
    }

    if (tipo === 'eliminacion directa' && !Number.isInteger(Math.log2(max_participantes))) {
        return res.status(400).json({ success: false, message: 'Para eliminación directa, max_participantes debe ser potencia de 2 (4, 8, 16, 32).' });
    }
    if (max_participantes < 4 || max_participantes > 32) {
        return res.status(400).json({ success: false, message: 'Número de participantes debe estar entre 4 y 32.' });
    }
    
    try {
        const sql = `
            INSERT INTO Torneo (nombre, fecha_inicio, estado, max_participantes, tipo, cartas_iniciales)
            VALUES (?, ?, 'pendiente', ?, ?, ?);
        `;
        const result = await db.query(sql, [nombre, fecha_inicio, max_participantes, tipo, cartas_iniciales]);
        const id_torneo = result.insertId;

        res.status(201).json({
            success: true,
            torneo: {
                id_torneo: id_torneo,
                nombre: nombre,
                estado: 'pendiente',
                max_participantes: max_participantes,
                participantes_actuales: 0
            }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'El nombre del torneo ya está en uso.' });
        }
        console.error('Error al crear torneo:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
exports.inscribirParticipante = async (req, res) => {
    const id_torneo = req.params.id;
    const id_usuario = req.userId; 

    try {
        const [torneo] = await db.query('SELECT estado, max_participantes FROM Torneo WHERE id_torneo = ?', [id_torneo]);
        
        if (!torneo || torneo.length === 0) {
            return res.status(404).json({ success: false, message: 'Torneo no encontrado.' });
        }
        
        const currentTorneo = torneo[0];
        
        if (currentTorneo.estado !== 'pendiente') {
            return res.status(400).json({ success: false, message: 'Inscripciones cerradas: el torneo ya está en curso o ha finalizado.' });
        }
        const [inscripcionExistente] = await db.query('SELECT * FROM Clasificacion_Torneo WHERE id_torneo = ? AND id_usuario = ?', [id_torneo, id_usuario]);
        
        if (inscripcionExistente.length > 0) {
            // Caso alternativo: Si ya inscrito
            return res.status(409).json({ success: false, message: 'Ya estás inscrito en este torneo.' });
        }
        const [participantesActuales] = await db.query('SELECT COUNT(*) as count FROM Clasificacion_Torneo WHERE id_torneo = ?', [id_torneo]);
        
        if (participantesActuales[0].count >= currentTorneo.max_participantes) {
            return res.status(400).json({ success: false, message: 'Cupo completo: el torneo ha alcanzado el máximo de participantes.' });
        }
        const sql = `
            INSERT INTO Clasificacion_Torneo (id_torneo, id_usuario, puntuacion, posicion)
            VALUES (?, ?, 0, NULL);
        `;
        await db.query(sql, [id_torneo, id_usuario]);
        res.status(200).json({ success: true, message: 'Inscripción exitosa' });

    } catch (error) {
        console.error('Error al inscribir participante:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al procesar la inscripción.' });
    }
};