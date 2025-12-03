const express = require('express');
const router = express.Router();
const torneoController = require('./torneoController');

const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            message: 'Debes iniciar sesión para acceder a esta funcionalidad.' 
        });
    }
    next();
};

router.get('/activos', torneoController.listarTorneosActivos);
router.get('/:id', torneoController.obtenerTorneo);
router.get('/:id/clasificacion', torneoController.obtenerClasificacionTorneo);
router.post('/crear', requireAuth, torneoController.crearTorneo);
router.post('/:id/inscribir', requireAuth, torneoController.inscribirUsuario);
router.put('/:id/estado', requireAuth, torneoController.actualizarEstadoTorneo);
router.get('/usuario/:id_usuario/clasificaciones', requireAuth, torneoController.obtenerClasificacionesPorUsuario);

module.exports = router;
