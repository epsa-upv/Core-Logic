/**
 * Bot (Computadora) para Ronda Marroquí
 * Simula un jugador automático con estrategia básica
 */

class BotPlayer {
    constructor(nombre = 'Bot', dificultad = 'normal') {
        this.nombre = nombre;
        this.dificultad = dificultad; // 'facil', 'normal', 'dificil'
        this.tiempoPensamiento = this.calcularTiempoPensamiento();
    }

    /**
     * Calcula tiempo de "pensamiento" para simular jugador real
     */
    calcularTiempoPensamiento() {
        switch (this.dificultad) {
            case 'facil':
                return { min: 1000, max: 3000 }; // 1-3 segundos
            case 'normal':
                return { min: 800, max: 2000 };  // 0.8-2 segundos
            case 'dificil':
                return { min: 500, max: 1500 };  // 0.5-1.5 segundos
            default:
                return { min: 1000, max: 2000 };
        }
    }

    /**
     * Obtiene tiempo aleatorio de pensamiento
     */
    getTiempoPensamiento() {
        const { min, max } = this.tiempoPensamiento;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Decide qué carta jugar
     * @param {Array} mano - Cartas disponibles [{value, suit}, ...]
     * @param {Object} cartaActual - Carta en la pila {value, suit}
     * @param {String} paloActual - Palo actual en juego
     * @returns {Object} {carta, paloElegido} o null si no puede jugar
     */
    decidirJugada(mano, cartaActual, paloActual) {
        const cartasJugables = this.obtenerCartasJugables(mano, cartaActual, paloActual);

        if (cartasJugables.length === 0) {
            return null; // No puede jugar, debe robar
        }

        // Estrategia según dificultad
        let cartaElegida;
        switch (this.dificultad) {
            case 'facil':
                cartaElegida = this.estrategiaFacil(cartasJugables);
                break;
            case 'normal':
                cartaElegida = this.estrategiaNormal(cartasJugables, mano);
                break;
            case 'dificil':
                cartaElegida = this.estrategiaDificil(cartasJugables, mano, cartaActual);
                break;
            default:
                cartaElegida = this.estrategiaNormal(cartasJugables, mano);
        }

        // Si es un 7 (comodín), elegir palo
        let paloElegido = null;
        if (cartaElegida.value === 7) {
            paloElegido = this.elegirPaloParaSiete(mano);
        }

        return {
            carta: cartaElegida,
            paloElegido: paloElegido
        };
    }

    /**
     * Obtiene cartas que se pueden jugar
     */
    obtenerCartasJugables(mano, cartaActual, paloActual) {
        if (!cartaActual) {
            return mano; // Primera jugada, cualquier carta
        }

        return mano.filter(carta => {
            // Siete es comodín, siempre se puede jugar
            if (carta.value === 7) return true;

            // Mismo palo o mismo valor
            return carta.suit === paloActual || carta.value === cartaActual.value;
        });
    }

    /**
     * Estrategia Fácil: Juega carta aleatoria
     */
    estrategiaFacil(cartasJugables) {
        return cartasJugables[Math.floor(Math.random() * cartasJugables.length)];
    }

    /**
     * Estrategia Normal: Evita desperdiciar cartas especiales
     */
    estrategiaNormal(cartasJugables, mano) {
        // Prioridad: cartas normales > especiales
        const cartasNormales = cartasJugables.filter(c => 
            ![1, 2, 4, 7].includes(c.value)
        );

        if (cartasNormales.length > 0) {
            return cartasNormales[Math.floor(Math.random() * cartasNormales.length)];
        }

        // Si solo tiene especiales, jugar la menos valiosa
        const cartasEspeciales = cartasJugables.filter(c => 
            [1, 2, 4, 7].includes(c.value)
        );

        // Orden de menor a mayor valor: 4 < 2 < 1 < 7
        const prioridad = { 4: 1, 2: 2, 1: 3, 7: 4 };
        cartasEspeciales.sort((a, b) => prioridad[a.value] - prioridad[b.value]);

        return cartasEspeciales[0];
    }

    /**
     * Estrategia Difícil: Juega estratégicamente
     */
    estrategiaDificil(cartasJugables, mano, cartaActual) {
        // Si tiene pocas cartas (< 3), jugar agresivo con especiales
        if (mano.length <= 3) {
            const especialesAgresivos = cartasJugables.filter(c => 
                [1, 2].includes(c.value) // As y Dos hacen robar
            );
            if (especialesAgresivos.length > 0) {
                return especialesAgresivos[0];
            }
        }

        // Si tiene muchas cartas (> 5), deshacerse de cartas altas
        if (mano.length > 5) {
            const cartasAltas = cartasJugables.filter(c => c.value >= 10);
            if (cartasAltas.length > 0) {
                return cartasAltas[Math.floor(Math.random() * cartasAltas.length)];
            }
        }

        // En otros casos, estrategia normal
        return this.estrategiaNormal(cartasJugables, mano);
    }

    /**
     * Elige el palo más conveniente cuando juega un 7
     */
    elegirPaloParaSiete(mano) {
        // Contar cartas de cada palo
        const conteo = {
            'oros': 0,
            'copas': 0,
            'espadas': 0,
            'bastos': 0
        };

        mano.forEach(carta => {
            if (carta.value !== 7) { // No contar otros 7s
                conteo[carta.suit]++;
            }
        });

        // Elegir el palo con más cartas
        let maxPalo = 'oros';
        let maxCantidad = 0;

        for (const [palo, cantidad] of Object.entries(conteo)) {
            if (cantidad > maxCantidad) {
                maxCantidad = cantidad;
                maxPalo = palo;
            }
        }

        return maxPalo;
    }

    /**
     * Genera un nombre aleatorio para el bot
     */
    static generarNombreAleatorio() {
        const nombres = [
            'BotMarroquí', 'RondaBot', 'CartasIA',
            'JugadorBot', 'ComputadoraRonda', 'BotEstrategico',
            'IAMarroqui', 'RobotCartas', 'BotProfesional',
            'MaquinaRonda', 'BotExperto', 'AutoJugador'
        ];
        return nombres[Math.floor(Math.random() * nombres.length)];
    }
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BotPlayer;
}
