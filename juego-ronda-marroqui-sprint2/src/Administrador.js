/**
 * Administrador - Clase que representa un administrador del sistema
 * 
 * @class Administrador
 * @extends Usuario
 * @description Clase que hereda de Usuario y representa un administrador
 * del sistema. Los administradores tienen permisos especiales para gestionar
 * torneos, moderar contenido y administrar usuarios.
 * 
 * @author Yahya Aboulafiya, Adrián Hoyos Sánchez, Souhail Batah, Carlos Robledo Badía
 * @version 2.0
 * @date 01/11/2025
 */

// Importar clase Usuario (si está disponible)
if (typeof require !== 'undefined') {
    var Usuario = require('./Usuario.js');
}

class Administrador extends Usuario {
    /**
     * Constructor de la clase Administrador
     * @param {number} id_usuario - ID único del administrador
     * @param {string} nombre_usuario - Nombre de usuario
     * @param {string} email - Correo electrónico
     */
    constructor(id_usuario, nombre_usuario, email) {
        super(id_usuario, nombre_usuario, email, 'admin');
        
        this.torneos_creados = [];
        this.fecha_nombramiento = new Date();
        this.acciones_realizadas = [];
    }

    /**
     * Obtiene los permisos de un administrador
     * @override
     * @returns {Array<string>} Lista de permisos
     */
    obtenerPermisos() {
        return [
            // Permisos de jugador regular
            'jugar_partida',
            'ver_ranking',
            'unirse_a_torneo',
            'ver_perfil',
            'agregar_amigos',
            'ver_historial',
            // Permisos administrativos
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

    /**
     * Crea un nuevo torneo (RF-11)
     * @param {Object} torneoData - Datos del torneo
     * @returns {Object} Torneo creado
     */
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

    /**
     * Edita un torneo existente
     * @param {number} id_torneo - ID del torneo
     * @param {Object} datosActualizados - Datos a actualizar
     * @returns {boolean} true si se editó exitosamente
     */
    async editarTorneo(id_torneo, datosActualizados) {
        try {
            console.log(`✏️ Admin ${this.nombre_usuario} está editando el torneo ${id_torneo}`);
            
            // En producción, aquí se actualizaría en la base de datos
            this.registrarAccion('editar_torneo', id_torneo);
            
            console.log(`✅ Torneo ${id_torneo} editado exitosamente`);
            return true;
            
        } catch (error) {
            console.error('❌ Error al editar torneo:', error);
            throw error;
        }
    }

    /**
     * Elimina un torneo
     * @param {number} id_torneo - ID del torneo
     * @returns {boolean} true si se eliminó exitosamente
     */
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

    /**
     * Banea a un usuario del sistema
     * @param {number} id_usuario - ID del usuario a banear
     * @param {string} razon - Razón del baneo
     * @param {number} duracion - Duración en días (0 = permanente)
     * @returns {boolean} true si se baneó exitosamente
     */
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

    /**
     * Desbanea a un usuario del sistema
     * @param {number} id_usuario - ID del usuario a desbanear
     * @returns {boolean} true si se desbaneó exitosamente
     */
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

    /**
     * Obtiene estadísticas globales del sistema
     * @returns {Object} Estadísticas globales
     */
    async obtenerEstadisticasGlobales() {
        try {
            console.log(`📊 Admin ${this.nombre_usuario} está consultando estadísticas globales`);
            
            // En producción, aquí se consultaría la base de datos
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

    /**
     * Gestiona la clasificación de un torneo (RF-12)
     * @param {number} id_torneo - ID del torneo
     * @param {Array<Object>} clasificacion - Array con la clasificación
     * @returns {boolean} true si se actualizó exitosamente
     */
    async gestionarClasificacion(id_torneo, clasificacion) {
        try {
            console.log(`📊 Admin ${this.nombre_usuario} está gestionando la clasificación del torneo ${id_torneo}`);
            
            // En producción, aquí se actualizaría en la base de datos
            this.registrarAccion('gestionar_clasificacion', id_torneo);
            
            console.log(`✅ Clasificación del torneo ${id_torneo} actualizada`);
            return true;
            
        } catch (error) {
            console.error('❌ Error al gestionar clasificación:', error);
            throw error;
        }
    }

    /**
     * Registra una acción administrativa
     * @private
     * @param {string} tipo - Tipo de acción
     * @param {*} datos - Datos relacionados con la acción
     */
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

    /**
     * Obtiene el historial de acciones del administrador
     * @returns {Array<Object>} Historial de acciones
     */
    getHistorialAcciones() {
        return this.acciones_realizadas;
    }

    /**
     * Obtiene los torneos creados por el administrador
     * @returns {Array<number>} Lista de IDs de torneos
     */
    getTorneosCreados() {
        return this.torneos_creados;
    }

    /**
     * Obtiene la fecha de nombramiento del administrador
     * @returns {Date} Fecha de nombramiento
     */
    getFechaNombramiento() {
        return this.fecha_nombramiento;
    }

    /**
     * Verifica si el administrador tiene un permiso específico
     * @param {string} permiso - Permiso a verificar
     * @returns {boolean} true si tiene el permiso
     */
    tienePermiso(permiso) {
        return this.obtenerPermisos().includes(permiso);
    }

    /**
     * Convierte el administrador a un objeto JSON
     * @override
     * @returns {Object} Representación JSON del administrador
     */
    toJSON() {
        return {
            ...super.toJSON(),
            torneos_creados: this.torneos_creados,
            fecha_nombramiento: this.fecha_nombramiento,
            total_acciones: this.acciones_realizadas.length,
            permisos: this.obtenerPermisos()
        };
    }

    /**
     * Representación en string del administrador
     * @override
     * @returns {string} String descriptivo del administrador
     */
    toString() {
        return `Administrador: ${this.nombre_usuario} - ${this.email} (${this.torneos_creados.length} torneos)`;
    }
}

// Exportar la clase para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Administrador;
}
