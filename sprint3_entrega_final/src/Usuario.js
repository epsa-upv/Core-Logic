class Usuario {
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
    getId() {
        return this.id_usuario;
    }
    getNombre() {
        return this.nombre_usuario;
    }
    getEmail() {
        return this.email;
    }
    getRol() {
        return this.rol;
    }
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
    obtenerPermisos() {
        throw new Error('El método obtenerPermisos() debe ser implementado por las clases hijas');
    }
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
    toString() {
        return `Usuario: ${this.nombre_usuario} (${this.rol}) - ${this.email}`;
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Usuario;
}
