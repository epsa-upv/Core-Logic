const express = require('express');
const router = express.Router();
const torneoController = require('torneoController');

const authMiddleware = (req, res, next) => {
    // Aquí iría tu lógica para verificar si el usuario está autenticado
    // y obtener su id_usuario si es necesario.
    // Ejemplo:
    // if (!req.userId) return res.status(401).json({ message: "No autorizado" });
    // next();
    req.userId = 5;
    next();
};


router.post('/crear', authMiddleware, torneoController.crearTorneo);


router.post('/:id/inscribir', authMiddleware, torneoController.inscribirParticipante);


router.get('/:id', torneoController.obtenerDetalleTorneo);


router.get('/activos', torneoController.listarTorneosActivos);

module.exports = router;