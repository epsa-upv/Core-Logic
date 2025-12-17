/**
 * Gestor de Partidas vs Bot
 * Maneja la lógica del juego contra la computadora
 */

const RondaGame = require('./RondaGame');
const BotPlayer = require('./BotPlayer');

class GameVsBot {
    constructor(numBots = 1, cartasIniciales = 5, dificultad = 'normal') {
        this.numBots = numBots;
        this.cartasIniciales = cartasIniciales;
        this.dificultad = dificultad;
        this.game = null;
        this.bots = [];
        this.jugadorHumanoIndex = 0;
        this.turnoTimeout = null;
        this.ultimoGanadorIndex = null;

        // Latencia simulada (ms) para que el bot actúe como un jugador real.
        // Se puede configurar desde el servidor ajustando esta propiedad.
        this.botLatencyMs = 0;
    }

    async sleep(ms) {
        if (!ms || ms <= 0) return;
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Inicia una nueva partida contra bots
     */
    iniciarPartida(nombreJugador, idJugador) {
        const numJugadores = this.numBots + 1; // Humano + Bots
        
        // Crear juego
        this.game = new RondaGame(numJugadores, this.cartasIniciales);
        this.game.startGame();

        // Configurar jugador humano (siempre el primero)
        this.jugadorHumanoIndex = 0;
        this.game.players[0].name = nombreJugador;
        this.game.players[0].id_usuario = idJugador;
        this.game.players[0].esBot = false;

        // Configurar bots
        for (let i = 1; i < numJugadores; i++) {
            const bot = new BotPlayer(
                BotPlayer.generarNombreAleatorio(),
                this.dificultad
            );
            this.bots.push(bot);

            this.game.players[i].name = bot.nombre;
            this.game.players[i].id_usuario = -i; // IDs negativos para bots
            this.game.players[i].esBot = true;
            this.game.players[i].botInstance = bot;
        }

        this.ultimoGanadorIndex = null;
        return this.obtenerEstado();
    }

    /**
     * Procesa el turno del jugador humano
     */
    async jugarCartaHumano(value, suit, paloElegido = null, options = {}) {
        const { procesarBots = true } = options;
        if (this.game.currentPlayerIndex !== this.jugadorHumanoIndex) {
            throw new Error('No es tu turno');
        }

        const resultado = this.game.playCard(
            this.jugadorHumanoIndex,
            value,
            suit,
            paloElegido
        );

        if (resultado.gameOver) {
            this.ultimoGanadorIndex = resultado.winnerId;
            return resultado;
        }

        // Procesar turnos de bots (opcional)
        if (procesarBots && this.esTurnoDeBot()) {
            await this.procesarTurnosBot();
        }

        if (this.game.isGameOver) {
            return { gameOver: true, winnerId: this.ultimoGanadorIndex };
        }

        return { gameOver: false, winnerId: null };
    }

    /**
     * Jugador humano roba carta
     */
    async robarCartaHumano(options = {}) {
        const { procesarBots = true } = options;
        if (this.game.currentPlayerIndex !== this.jugadorHumanoIndex) {
            throw new Error('No es tu turno');
        }

        const resultado = this.game.playerDrawCard(this.jugadorHumanoIndex);

        // Procesar turnos de bots (opcional)
        if (procesarBots && this.esTurnoDeBot()) {
            await this.procesarTurnosBot();
        }

        return {
            cards: resultado,
            gameOver: this.game.isGameOver,
            winnerId: this.ultimoGanadorIndex
        };
    }

    /**
     * Verifica si es turno de un bot
     */
    esTurnoDeBot() {
        return this.game.players[this.game.currentPlayerIndex].esBot;
    }

    /**
     * Procesa los turnos de todos los bots hasta que sea turno del humano
     */
    async procesarTurnosBot(onAfterBotTurn = null) {
        // En esta versión procesamos de forma síncrona para asegurar:
        // - estado consistente para el frontend
        // - persistencia correcta en BD desde el endpoint
        while (!this.game.isGameOver && this.esTurnoDeBot()) {
            const botIndex = this.game.currentPlayerIndex;
            const bot = this.game.players[botIndex].botInstance;
            await this.sleep(this.botLatencyMs);
            await this.ejecutarTurnoBot(botIndex, bot);

            if (typeof onAfterBotTurn === 'function') {
                await onAfterBotTurn({ botIndex });
            }
        }
    }

    /**
     * Ejecuta el turno de un bot específico
     */
    async ejecutarTurnoBot(botIndex, bot) {
        const mano = this.game.players[botIndex].hand;
        const cartaActual = this.game.discardPile[this.game.discardPile.length - 1];
        const paloActual = cartaActual ? cartaActual.suit : null;

        // Bot decide jugada
        const decision = bot.decidirJugada(mano, cartaActual, paloActual);

        if (decision) {
            // Bot juega carta
            try {
                const resultado = this.game.playCard(
                    botIndex,
                    decision.carta.value,
                    decision.carta.suit,
                    decision.paloElegido
                );

                if (resultado && resultado.gameOver) {
                    this.ultimoGanadorIndex = resultado.winnerId;
                }
            } catch (error) {
                // Si hay error, robar como fallback
                this.game.playerDrawCard(botIndex);
            }
        } else {
            // Bot no puede jugar, debe robar
            this.game.playerDrawCard(botIndex);
        }
    }

    /**
     * Detiene el procesamiento automático de turnos de bots
     */
    detenerBots() {
        if (this.turnoTimeout) {
            clearTimeout(this.turnoTimeout);
            this.turnoTimeout = null;
        }
    }

    /**
     * Obtiene el estado actual del juego
     */
    obtenerEstado() {
        const estado = this.game.getGameState();
        
        // Añadir información de si es turno del humano
        estado.esTurnoHumano = this.game.currentPlayerIndex === this.jugadorHumanoIndex;
        estado.nombreJugadorActual = this.game.players[this.game.currentPlayerIndex].name;
        estado.esBot = this.game.players[this.game.currentPlayerIndex].esBot;

        return estado;
    }

    /**
     * Obtiene el estado serializable para guardar en BD
     */
    toJSON() {
        return {
            numBots: this.numBots,
            cartasIniciales: this.cartasIniciales,
            dificultad: this.dificultad,
            jugadorHumanoIndex: this.jugadorHumanoIndex,
            gameState: this.game.toJSON(),
            bots: this.bots.map(bot => ({
                nombre: bot.nombre,
                dificultad: bot.dificultad
            }))
        };
    }

    /**
     * Restaura el estado desde JSON
     */
    static fromJSON(data) {
        const gameVsBot = new GameVsBot(
            data.numBots,
            data.cartasIniciales,
            data.dificultad
        );

        gameVsBot.game = RondaGame.fromJSON(data.gameState);
        gameVsBot.jugadorHumanoIndex = data.jugadorHumanoIndex;

        // Recrear bots
        gameVsBot.bots = data.bots.map((botData, index) => {
            const bot = new BotPlayer(botData.nombre, botData.dificultad);
            
            // Re-asignar bot instance al jugador
            const jugadorIndex = index + 1;
            gameVsBot.game.players[jugadorIndex].botInstance = bot;
            
            return bot;
        });

        return gameVsBot;
    }
}

module.exports = GameVsBot;
