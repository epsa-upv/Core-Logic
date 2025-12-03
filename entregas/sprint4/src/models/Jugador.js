if (typeof require !== 'undefined') {
    var Usuario = require('./Usuario.js');
}
class Jugador extends Usuario {
    constructor(id_usuario, nombre_usuario, email) {
        super(id_usuario, nombre_usuario, email, 'jugador');
        this.partidas_activas = [];
        this.amigos = [];
        this.nivel = 1;
        this.experiencia = 0;
    }
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
    unirseAPartida(id_partida) {
        if (this.partidas_activas.includes(id_partida)) {
            console.log(`⚠️ ${this.nombre_usuario} ya está en la partida ${id_partida}`);
            return false;
        }
        this.partidas_activas.push(id_partida);
        console.log(`✅ ${this.nombre_usuario} se unió a la partida ${id_partida}`);
        return true;
    }
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
    getPartidasActivas() {
        return this.partidas_activas;
    }
    agregarAmigo(id_amigo) {
        if (this.amigos.includes(id_amigo)) {
            console.log(`⚠️ El usuario ${id_amigo} ya es tu amigo`);
            return false;
        }
        this.amigos.push(id_amigo);
        console.log(`✅ Amigo agregado: ${id_amigo}`);
        return true;
    }
    getAmigos() {
        return this.amigos;
    }
    ganarExperiencia(puntos) {
        this.experiencia += puntos;
        console.log(`⭐ ${this.nombre_usuario} ganó ${puntos} puntos de experiencia`);
        const nuevoNivel = Math.floor(this.experiencia / 100) + 1;
        if (nuevoNivel > this.nivel) {
            this.nivel = nuevoNivel;
            console.log(`🎉 ¡${this.nombre_usuario} subió al nivel ${this.nivel}!`);
        }
    }
    getNivel() {
        return this.nivel;
    }
    getExperiencia() {
        return this.experiencia;
    }
    getExperienciaParaSiguienteNivel() {
        return (this.nivel * 100) - this.experiencia;
    }
    puedeJugar() {
        return this.partidas_activas.length < 3;
    }
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
    toString() {
        return `Jugador: ${this.nombre_usuario} (Nivel ${this.nivel}) - ${this.email}`;
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Jugador;
}
