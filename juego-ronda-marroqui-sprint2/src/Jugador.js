/**
 * Jugador - Clase que representa un jugador en el sistema
 * 
 * @class Jugador
 * @extends Usuario
 * @description Clase que hereda de Usuario y representa un jugador regular
 * del sistema. Los jugadores pueden unirse a partidas, jugar y ver rankings.
 * 
 * @author Yahya Aboulafiya, Adrián Hoyos Sánchez, Souhail Batah, Carlos Robledo Badía
 * @version 2.0
 * @date 01/11/2025
 */

// Importar clase Usuario (si está disponible)
if (typeof require !== 'undefined') {
    var Usuario = require('./Usuario.js');
}

class Jugador extends Usuario {
    /**
     * Constructor de la clase Jugador
     * @param {number} id_usuario - ID único del jugador
     * @param {string} nombre_usuario - Nombre de usuario
     * @param {string} email - Correo electrónico
     */
    constructor(id_usuario, nombre_usuario, email) {
        super(id_usuario, nombre_usuario, email, 'jugador');
        
        this.partidas_activas = [];
        this.amigos = [];
        this.nivel = 1;
        this.experiencia = 0;
    }

    /**
     * Obtiene los permisos de un jugador
     * @override
     * @returns {Array<string>} Lista de permisos
     */
    obtenerPermisos() {
        return [
            'jugar_partida',
            'ver_ranking',
            'unirse_a_torneo',
            'ver_perfil',
            'agregar_amigos',
            'ver_historial'
        ];
    }

    /**
     * Une al jugador a una partida
     * @param {number} id_partida - ID de la partida
     * @returns {boolean} true si se unió exitosamente
     */
    unirseAPartida(id_partida) {
        if (this.partidas_activas.includes(id_partida)) {
            console.log(`⚠️ ${this.nombre_usuario} ya está en la partida ${id_partida}`);
            return false;
        }
        
        this.partidas_activas.push(id_partida);
        console.log(`✅ ${this.nombre_usuario} se unió a la partida ${id_partida}`);
        return true;
    }

    /**
     * Abandona una partida
     * @param {number} id_partida - ID de la partida
     * @returns {boolean} true si abandonó exitosamente
     */
    abandonarPartida(id_partida) {
        const index = this.partidas_activas.indexOf(id_partida);
        
        if (index === -1) {
            console.log(`⚠️ ${this.nombre_usuario} no está en la partida ${id_partida}`);
            return false;
        }
        
        this.partidas_activas.splice(index, 1);
        console.log(`✅ ${this.nombre_usuario} abandonó la partida ${id_partida}`);
        return true;
    }

    /**
     * Obtiene las partidas activas del jugador
     * @returns {Array<number>} Lista de IDs de partidas activas
     */
    getPartidasActivas() {
        return this.partidas_activas;
    }

    /**
     * Agrega un amigo
     * @param {number} id_amigo - ID del amigo
     * @returns {boolean} true si se agregó exitosamente
     */
    agregarAmigo(id_amigo) {
        if (this.amigos.includes(id_amigo)) {
            console.log(`⚠️ El usuario ${id_amigo} ya es tu amigo`);
            return false;
        }
        
        this.amigos.push(id_amigo);
        console.log(`✅ Amigo agregado: ${id_amigo}`);
        return true;
    }

    /**
     * Obtiene la lista de amigos
     * @returns {Array<number>} Lista de IDs de amigos
     */
    getAmigos() {
        return this.amigos;
    }

    /**
     * Gana experiencia después de una partida
     * @param {number} puntos - Puntos de experiencia ganados
     */
    ganarExperiencia(puntos) {
        this.experiencia += puntos;
        console.log(`⭐ ${this.nombre_usuario} ganó ${puntos} puntos de experiencia`);
        
        // Verificar si sube de nivel (cada 100 puntos)
        const nuevoNivel = Math.floor(this.experiencia / 100) + 1;
        if (nuevoNivel > this.nivel) {
            this.nivel = nuevoNivel;
            console.log(`🎉 ¡${this.nombre_usuario} subió al nivel ${this.nivel}!`);
        }
    }

    /**
     * Obtiene el nivel actual del jugador
     * @returns {number} Nivel actual
     */
    getNivel() {
        return this.nivel;
    }

    /**
     * Obtiene la experiencia actual del jugador
     * @returns {number} Experiencia actual
     */
    getExperiencia() {
        return this.experiencia;
    }

    /**
     * Calcula la experiencia necesaria para el próximo nivel
     * @returns {number} Experiencia necesaria
     */
    getExperienciaParaSiguienteNivel() {
        return (this.nivel * 100) - this.experiencia;
    }

    /**
     * Verifica si el jugador puede jugar una partida
     * @returns {boolean} true si puede jugar
     */
    puedeJugar() {
        // Un jugador puede jugar hasta 3 partidas simultáneas
        return this.partidas_activas.length < 3;
    }

    /**
     * Convierte el jugador a un objeto JSON
     * @override
     * @returns {Object} Representación JSON del jugador
     */
    toJSON() {
        return {
            ...super.toJSON(),
            partidas_activas: this.partidas_activas,
            amigos: this.amigos,
            nivel: this.nivel,
            experiencia: this.experiencia,
            puede_jugar: this.puedeJugar()
        };
    }

    /**
     * Representación en string del jugador
     * @override
     * @returns {string} String descriptivo del jugador
     */
    toString() {
        return `Jugador: ${this.nombre_usuario} (Nivel ${this.nivel}) - ${this.email}`;
    }
}

// Exportar la clase para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Jugador;
}
