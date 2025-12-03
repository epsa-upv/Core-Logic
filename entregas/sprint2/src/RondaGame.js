class RondaGame {
  constructor(numPlayers, cardsPerPlayer = 5) {
    if (numPlayers < 3 || numPlayers > 6) {
      throw new Error('El número de jugadores debe estar entre 3 y 6');
    }
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
  _shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }
  _dealCards() {
    this.players = [];
    for (let i = 0; i < this.numPlayers; i++) {
      this.players.push({
        id: i,
        name: `Jugador ${i + 1}`,
        hand: [],
        cardsCount: 0
      });
    }
    for (let i = 0; i < this.cardsPerPlayer; i++) {
      for (let playerIndex = 0; playerIndex < this.numPlayers; playerIndex++) {
        const card = this.deck.pop();
        this.players[playerIndex].hand.push(card);
        this.players[playerIndex].cardsCount++;
      }
    }
  }
  startGame() {
    this.deck = this._createDeck();
    this._shuffleDeck();
    this._dealCards();
    const initialCard = this.deck.pop();
    this.discardPile.push(initialCard);
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
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RondaGame;
}
