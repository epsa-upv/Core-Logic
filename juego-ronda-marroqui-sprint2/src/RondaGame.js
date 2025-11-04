/**
 * RondaGame - Clase principal para la lógica del juego "Ronda Marroquí"
 * 
 * @class RondaGame
 * @description Gestiona la lógica completa del juego de cartas Ronda Marroquí,
 * incluyendo creación del mazo, barajado, reparto y estado del juego.
 * 
 * @author Yahya Aboulafiya, Adrián Hoyos Sánchez, Souhail Batah, Carlos Robledo Badía
 * @version 1.0
 * @date 14/10/2025
 */

class RondaGame {
  /**
   * Constructor de la clase RondaGame
   * 
   * @param {number} numPlayers - Número de jugadores (entre 3 y 6)
   * @param {number} cardsPerPlayer - Número de cartas iniciales por jugador (entre 3 y 6, por defecto 5)
   * @throws {Error} Si el número de jugadores no está entre 3 y 6
   * @throws {Error} Si el número de cartas por jugador no está entre 3 y 6
   */
  constructor(numPlayers, cardsPerPlayer = 5) {
    // Validación del número de jugadores
    if (numPlayers < 3 || numPlayers > 6) {
      throw new Error('El número de jugadores debe estar entre 3 y 6');
    }

    // Validación del número de cartas por jugador
    if (cardsPerPlayer < 3 || cardsPerPlayer > 6) {
      throw new Error('El número de cartas por jugador debe estar entre 3 y 6');
    }

    this.numPlayers = numPlayers;
    this.cardsPerPlayer = cardsPerPlayer;
    this.deck = [];                    // Mazo de robo
    this.discardPile = [];             // Pila de descarte
    this.players = [];                 // Array de jugadores
    this.currentPlayerIndex = 0;       // Índice del jugador actual (0-based)
    this.gameDirection = 1;            // 1 = horario, -1 = antihorario
    this.isGameOver = false;           // Estado del juego
  }

  /**
   * Crea la baraja española completa de 40 cartas
   * 
   * @private
   * @returns {Array} Array de 40 objetos carta
   * @description Genera las 40 cartas de la baraja española con 4 palos
   * (oros, copas, espadas, bastos) y valores del 1 al 7 y del 10 al 12.
   * Cada carta incluye su ruta de imagen correspondiente.
   */
  _createDeck() {
    const suits = ['oros', 'copas', 'espadas', 'bastos'];
    const values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    const specialCards = [1, 2, 4, 7]; // Cartas con efectos especiales
    const deck = [];

    for (const suit of suits) {
      for (const value of values) {
        const card = {
          value: value,
          suit: suit,
          isSpecial: specialCards.includes(value),
          image: `../lib/img/${String(value).padStart(2, '0')}-${suit}.png`
        };
        deck.push(card);
      }
    }

    return deck;
  }

  /**
   * Baraja el mazo usando el algoritmo Fisher-Yates
   * 
   * @private
   * @description Implementa el algoritmo Fisher-Yates (también conocido como
   * Knuth shuffle) para garantizar una distribución uniforme y aleatoria.
   * Modifica el array this.deck in-place.
   */
  _shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  /**
   * Reparte las cartas a los jugadores
   * 
   * @private
   * @description Crea los objetos de jugador y reparte el número configurado
   * de cartas del mazo a cada jugador. Las cartas repartidas se eliminan
   * del mazo principal.
   */
  _dealCards() {
    // Inicializar jugadores
    this.players = [];
    for (let i = 0; i < this.numPlayers; i++) {
      this.players.push({
        id: i,
        name: `Jugador ${i + 1}`,
        hand: [],
        cardsCount: 0
      });
    }

    // Repartir cartas
    for (let i = 0; i < this.cardsPerPlayer; i++) {
      for (let playerIndex = 0; playerIndex < this.numPlayers; playerIndex++) {
        const card = this.deck.pop();
        this.players[playerIndex].hand.push(card);
        this.players[playerIndex].cardsCount++;
      }
    }
  }

  /**
   * Inicia una nueva partida
   * 
   * @public
   * @description Ejecuta toda la secuencia de inicialización:
   * 1. Crea el mazo de 40 cartas
   * 2. Baraja las cartas
   * 3. Reparte las cartas a los jugadores
   * 4. Coloca automáticamente 1 carta en la pila de descarte
   * 5. El resto de cartas forman el mazo de robo
   * 
   * @example
   * const game = new RondaGame(4, 5);
   * game.startGame();
   */
  startGame() {
    // Paso 1: Crear el mazo
    this.deck = this._createDeck();
    
    // Paso 2: Barajar el mazo
    this._shuffleDeck();
    
    // Paso 3: Repartir cartas a los jugadores
    this._dealCards();
    
    // Paso 4: Colocar 1 carta en la pila de descarte automáticamente
    const initialCard = this.deck.pop();
    this.discardPile.push(initialCard);
    
    // Paso 5: El resto de cartas están en this.deck (mazo de robo)
    // El jugador 0 comienza
    this.currentPlayerIndex = 0;
    this.gameDirection = 1;
    this.isGameOver = false;

    console.log('Partida iniciada correctamente');
    console.log(`Jugadores: ${this.numPlayers}`);
    console.log(`Cartas por jugador: ${this.cardsPerPlayer}`);
    console.log(`Cartas repartidas: ${this.numPlayers * this.cardsPerPlayer}`);
    console.log(`Cartas en pila de descarte: ${this.discardPile.length}`);
    console.log(`Cartas en mazo de robo: ${this.deck.length}`);
  }

  /**
   * Obtiene el estado actual del juego
   * 
   * @public
   * @returns {Object} Objeto con el estado completo de la partida
   * @description Devuelve toda la información necesaria para renderizar
   * la interfaz del juego, incluyendo información de jugadores, cartas
   * visibles y estado general.
   * 
   * @example
   * const state = game.getGameState();
   * console.log(state.currentPlayer); // Índice del jugador actual
   * console.log(state.topCard);       // Última carta de la pila de descarte
   */
  getGameState() {
    return {
      currentPlayer: this.currentPlayerIndex,
      players: this.players.map(player => ({
        id: player.id,
        name: player.name,
        cardsCount: player.cardsCount,
  hand: player.hand // En versiones conectadas se filtrará según el jugador
      })),
      topCard: this.discardPile.length > 0 
        ? this.discardPile[this.discardPile.length - 1] 
        : null,
      deckCount: this.deck.length,
      discardCount: this.discardPile.length,
      gameDirection: this.gameDirection,
      isGameOver: this.isGameOver
    };
  }

  /**
   * Obtiene información resumida del juego para debug
   * 
   * @public
   * @returns {string} Resumen del estado del juego
   */
  getGameInfo() {
    const state = this.getGameState();
    let info = '\n=== ESTADO DEL JUEGO ===\n';
    info += `Jugadores: ${this.numPlayers}\n`;
    info += `Turno actual: ${state.players[state.currentPlayer].name}\n`;
    info += `Dirección: ${state.gameDirection === 1 ? 'Horario' : 'Antihorario'}\n`;
    info += `Carta en mesa: ${state.topCard ? `${state.topCard.value} de ${state.topCard.suit}` : 'Ninguna'}\n`;
    info += `Cartas en mazo de robo: ${state.deckCount}\n`;
    info += `Cartas en pila de descarte: ${state.discardCount}\n`;
    info += '\n--- JUGADORES ---\n';
    state.players.forEach(player => {
      info += `${player.name}: ${player.cardsCount} cartas\n`;
    });
    info += '=====================\n';
    return info;
  }
}

// Exportar la clase para Node.js (para las pruebas)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RondaGame;
}
