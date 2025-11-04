/**
 * Usuario - Clase abstracta base para usuarios del sistema
 * 
 * @class Usuario
 * @abstract
 * @description Clase base abstracta que define las propiedades y métodos
 * comunes para todos los tipos de usuarios (Jugador y Administrador).
 * Implementa el patrón de herencia según el diseño UML del Sprint 2.
 * 
 * @author Yahya Aboulafiya, Adrián Hoyos Sánchez, Souhail Batah, Carlos Robledo Badía
 * @version 2.0
 * @date 01/11/2025
 */

class Usuario {
    /**
     * Constructor de la clase Usuario
     * @param {number} id_usuario - ID único del usuario
     * @param {string} nombre_usuario - Nombre de usuario
     * @param {string} email - Correo electrónico
     * @param {string} rol - Rol del usuario ('jugador' o 'admin')
     */
    constructor(id_usuario, nombre_usuario, email, rol) {
        if (new.target === Usuario) {
            throw new TypeError('No se puede instanciar la clase abstracta Usuario directamente');
        }
        
        this.id_usuario = id_usuario;
        this.nombre_usuario = nombre_usuario;
        this.email = email;
        this.rol = rol;
        this.partidas_ganadas = 0;
        this.partidas_perdidas = 0;
        this.partidas_jugadas = 0;
        this.fecha_registro = new Date();
    }

    /**
     * Obtiene el ID del usuario
     * @returns {number} ID del usuario
     */
    getId() {
        return this.id_usuario;
    }

    /**
     * Obtiene el nombre del usuario
     * @returns {string} Nombre del usuario
     */
    getNombre() {
        return this.nombre_usuario;
    }

    /**
     * Obtiene el email del usuario
     * @returns {string} Email del usuario
     */
    getEmail() {
        return this.email;
    }

    /**
     * Obtiene el rol del usuario
     * @returns {string} Rol del usuario
     */
    getRol() {
        return this.rol;
    }

    /**
     * Obtiene las estadísticas del usuario
     * @returns {Object} Objeto con las estadísticas
     */
    getEstadisticas() {
        return {
            partidas_ganadas: this.partidas_ganadas,
            partidas_perdidas: this.partidas_perdidas,
            partidas_jugadas: this.partidas_jugadas,
            ratio_victorias: this.partidas_jugadas > 0 
                ? (this.partidas_ganadas / this.partidas_jugadas * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Actualiza las estadísticas después de una partida
     * @param {boolean} gano - true si ganó la partida
     */
    actualizarEstadisticas(gano) {
        this.partidas_jugadas++;
        if (gano) {
            this.partidas_ganadas++;
        } else {
            this.partidas_perdidas++;
        }
        
        console.log(`📊 Estadísticas actualizadas para ${this.nombre_usuario}:`);
        console.log(`   Ganadas: ${this.partidas_ganadas}`);
        console.log(`   Perdidas: ${this.partidas_perdidas}`);
        console.log(`   Jugadas: ${this.partidas_jugadas}`);
    }

    /**
     * Método abstracto que debe ser implementado por las clases hijas
     * @abstract
     * @throws {Error} Si no es implementado
     */
    obtenerPermisos() {
        throw new Error('El método obtenerPermisos() debe ser implementado por las clases hijas');
    }

    /**
     * Convierte el usuario a un objeto JSON
     * @returns {Object} Representación JSON del usuario
     */
    toJSON() {
        return {
            id_usuario: this.id_usuario,
            nombre_usuario: this.nombre_usuario,
            email: this.email,
            rol: this.rol,
            partidas_ganadas: this.partidas_ganadas,
            partidas_perdidas: this.partidas_perdidas,
            partidas_jugadas: this.partidas_jugadas,
            fecha_registro: this.fecha_registro
        };
    }

    /**
     * Representación en string del usuario
     * @returns {string} String descriptivo del usuario
     */
    toString() {
        return `Usuario: ${this.nombre_usuario} (${this.rol}) - ${this.email}`;
    }
}

// Exportar la clase para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Usuario;
}
