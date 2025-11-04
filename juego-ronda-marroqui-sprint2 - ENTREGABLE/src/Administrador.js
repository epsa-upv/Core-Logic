if (typeof require !== 'undefined') {
    var Usuario = require('./Usuario.js');
}
class Administrador extends Usuario {
    constructor(id_usuario, nombre_usuario, email) {
        super(id_usuario, nombre_usuario, email, 'admin');
        this.torneos_creados = [];
        this.fecha_nombramiento = new Date();
        this.acciones_realizadas = [];
    }
    obtenerPermisos() {
        return [
            'jugar_partida',
            'ver_ranking',
            'unirse_a_torneo',
            'ver_perfil',
            'agregar_amigos',
            'ver_historial',
            'crear_torneo',
            'editar_torneo',
            'eliminar_torneo',
            'gestionar_usuarios',
            'banear_usuarios',
            'ver_estadisticas_globales',
            'moderar_contenido',
            'configurar_sistema',
            'ver_logs',
            'gestionar_clasificaciones'
        ];
    }
    async crearTorneo(torneoData) {
        try {
            console.log(`🏆 Admin ${this.nombre_usuario} está creando un torneo: ${torneoData.nombre}`);
            const nuevoTorneo = {
                id_torneo: Date.now(),
                nombre: torneoData.nombre,
                fecha_inicio: torneoData.fecha_inicio || new Date(),
                fecha_fin: torneoData.fecha_fin || null,
                descripcion: torneoData.descripcion || '',
                creador_id: this.id_usuario,
                estado: 'pendiente'
            };
            this.torneos_creados.push(nuevoTorneo.id_torneo);
            this.registrarAccion('crear_torneo', nuevoTorneo.id_torneo);
            console.log(`✅ Torneo "${torneoData.nombre}" creado exitosamente`);
            return nuevoTorneo;
        } catch (error) {
            console.error('❌ Error al crear torneo:', error);
            throw error;
        }
    }
    async editarTorneo(id_torneo, datosActualizados) {
        try {
            console.log(`✏️ Admin ${this.nombre_usuario} está editando el torneo ${id_torneo}`);
            this.registrarAccion('editar_torneo', id_torneo);
            console.log(`✅ Torneo ${id_torneo} editado exitosamente`);
            return true;
        } catch (error) {
            console.error('❌ Error al editar torneo:', error);
            throw error;
        }
    }
    async eliminarTorneo(id_torneo) {
        try {
            console.log(`🗑️ Admin ${this.nombre_usuario} está eliminando el torneo ${id_torneo}`);
            const index = this.torneos_creados.indexOf(id_torneo);
            if (index > -1) {
                this.torneos_creados.splice(index, 1);
            }
            this.registrarAccion('eliminar_torneo', id_torneo);
            console.log(`✅ Torneo ${id_torneo} eliminado exitosamente`);
            return true;
        } catch (error) {
            console.error('❌ Error al eliminar torneo:', error);
            throw error;
        }
    }
    async banearUsuario(id_usuario, razon, duracion = 0) {
        try {
            console.log(`🚫 Admin ${this.nombre_usuario} está baneando al usuario ${id_usuario}`);
            console.log(`   Razón: ${razon}`);
            console.log(`   Duración: ${duracion === 0 ? 'Permanente' : duracion + ' días'}`);
            this.registrarAccion('banear_usuario', { id_usuario, razon, duracion });
            console.log(`✅ Usuario ${id_usuario} baneado exitosamente`);
            return true;
        } catch (error) {
            console.error('❌ Error al banear usuario:', error);
            throw error;
        }
    }
    async desbanearUsuario(id_usuario) {
        try {
            console.log(`✅ Admin ${this.nombre_usuario} está desbaneando al usuario ${id_usuario}`);
            this.registrarAccion('desbanear_usuario', id_usuario);
            console.log(`✅ Usuario ${id_usuario} desbaneado exitosamente`);
            return true;
        } catch (error) {
            console.error('❌ Error al desbanear usuario:', error);
            throw error;
        }
    }
    async obtenerEstadisticasGlobales() {
        try {
            console.log(`📊 Admin ${this.nombre_usuario} está consultando estadísticas globales`);
            const estadisticas = {
                total_usuarios: 0,
                usuarios_activos_hoy: 0,
                total_partidas: 0,
                partidas_en_curso: 0,
                total_torneos: 0,
                torneos_activos: 0
            };
            this.registrarAccion('ver_estadisticas_globales');
            return estadisticas;
        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            throw error;
        }
    }
    async gestionarClasificacion(id_torneo, clasificacion) {
        try {
            console.log(`📊 Admin ${this.nombre_usuario} está gestionando la clasificación del torneo ${id_torneo}`);
            this.registrarAccion('gestionar_clasificacion', id_torneo);
            console.log(`✅ Clasificación del torneo ${id_torneo} actualizada`);
            return true;
        } catch (error) {
            console.error('❌ Error al gestionar clasificación:', error);
            throw error;
        }
    }
    registrarAccion(tipo, datos = null) {
        const accion = {
            tipo: tipo,
            datos: datos,
            timestamp: new Date(),
            admin_id: this.id_usuario
        };
        this.acciones_realizadas.push(accion);
        console.log(`📝 Acción registrada: ${tipo}`);
    }
    getHistorialAcciones() {
        return this.acciones_realizadas;
    }
    getTorneosCreados() {
        return this.torneos_creados;
    }
    getFechaNombramiento() {
        return this.fecha_nombramiento;
    }
    tienePermiso(permiso) {
        return this.obtenerPermisos().includes(permiso);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            torneos_creados: this.torneos_creados,
            fecha_nombramiento: this.fecha_nombramiento,
            total_acciones: this.acciones_realizadas.length,
            permisos: this.obtenerPermisos()
        };
    }
    toString() {
        return `Administrador: ${this.nombre_usuario} - ${this.email} (${this.torneos_creados.length} torneos)`;
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Administrador;
}
