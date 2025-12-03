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
    this.deck = [];
    this.discardPile = [];
    this.players = [];
    this.currentPlayerIndex = 0;
    this.gameDirection = 1;
    this.isGameOver = false;
  }
  _createDeck() {
    const suits = ['oros', 'copas', 'espadas', 'bastos'];
    const values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    const specialCards = [1, 2, 4, 7];
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
  }
  getGameState() {
    return {
      currentPlayer: this.currentPlayerIndex,
      players: this.players.map(player => ({
        id: player.id,
        id_usuario: player.id_usuario,
        name: player.name,
        cardsCount: player.cardsCount,
        hand: player.hand
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

  isValidMove(playerId, cardValue, cardSuit) {
    const player = this.players[playerId];
    const topCard = this.discardPile[this.discardPile.length - 1];
    
    const hasCard = player.hand.some(card => 
      card.value === cardValue && card.suit === cardSuit
    );
    if (!hasCard) return { valid: false, reason: 'No tienes esa carta' };

    if (this.currentPlayerIndex !== playerId) {
      return { valid: false, reason: 'No es tu turno' };
    }

    if (cardValue === 7) {
      return { valid: true };
    }

    if (cardValue === topCard.value || cardSuit === topCard.suit) {
      return { valid: true };
    }

    return { valid: false, reason: 'La carta no coincide con la pila' };
  }

  playCard(playerId, cardValue, cardSuit, newSuit = null) {
    const validation = this.isValidMove(playerId, cardValue, cardSuit);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const player = this.players[playerId];
    
    const cardIndex = player.hand.findIndex(card => 
      card.value === cardValue && card.suit === cardSuit
    );
    const card = player.hand.splice(cardIndex, 1)[0];
    player.cardsCount--;

    this.discardPile.push(card);

    const result = this.applyCardEffect(card, playerId, newSuit);

    if (player.cardsCount === 0) {
      this.isGameOver = true;
      return { gameOver: true, winnerId: playerId };
    }

    return { gameOver: false, winnerId: null, ...result };
  }

  applyCardEffect(card, playerId, newSuit) {
    const result = { effect: null, affectedPlayer: null };

    switch (card.value) {
      case 1:
        const nextForAs = this.getNextPlayerIndex();
        this.drawCards(nextForAs, 3);
        result.effect = 'draw_3';
        result.affectedPlayer = nextForAs;
        this.advancePlayer();
        break;
      
      case 2:
        const nextForTwo = this.getNextPlayerIndex();
        this.drawCards(nextForTwo, 2);
        result.effect = 'draw_2';
        result.affectedPlayer = nextForTwo;
        this.advancePlayer();
        break;
      
      case 4:
        this.advancePlayer();
        const skippedPlayer = this.currentPlayerIndex;
        result.effect = 'skip';
        result.affectedPlayer = skippedPlayer;
        this.advancePlayer();
        break;
      
      case 7:
        if (newSuit) {
          this.discardPile[this.discardPile.length - 1].suit = newSuit;
          result.effect = 'change_suit';
          result.newSuit = newSuit;
        }
        this.advancePlayer();
        break;
      
      default:
        this.advancePlayer();
    }

    return result;
  }

  drawCards(playerId, count = 1) {
    const player = this.players[playerId];
    const drawnCards = [];
    
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        this.recycleDeck();
      }
      
      if (this.deck.length > 0) {
        const card = this.deck.pop();
        player.hand.push(card);
        player.cardsCount++;
        drawnCards.push(card);
      }
    }

    return drawnCards;
  }

  playerDrawCard(playerId) {
    if (this.currentPlayerIndex !== playerId) {
      throw new Error('No es tu turno');
    }

    const player = this.players[playerId];
    const cards = this.drawCards(playerId, 1);

    this.advancePlayer();

    return cards;
  }

  recycleDeck() {
    if (this.discardPile.length <= 1) {
      return;
    }

    const topCard = this.discardPile.pop();
    this.deck = [...this.discardPile];
    this.discardPile = [topCard];
    this._shuffleDeck();
  }

  advancePlayer() {
    this.currentPlayerIndex = this.getNextPlayerIndex();
  }

  getNextPlayerIndex() {
    let nextIndex = this.currentPlayerIndex + this.gameDirection;
    
    if (nextIndex >= this.numPlayers) {
      nextIndex = 0;
    } else if (nextIndex < 0) {
      nextIndex = this.numPlayers - 1;
    }
    
    return nextIndex;
  }

  getNextPlayer() {
    return this.getNextPlayerIndex();
  }

  getPlayerHand(playerId) {
    if (playerId < 0 || playerId >= this.numPlayers) {
      throw new Error('ID de jugador inválido');
    }
    return this.players[playerId].hand;
  }

  canPlayerPlay(playerId) {
    if (this.currentPlayerIndex !== playerId) {
      return false;
    }

    const player = this.players[playerId];
    const topCard = this.discardPile[this.discardPile.length - 1];

    return player.hand.some(card => {
      if (card.value === 7) return true;
      return card.value === topCard.value || card.suit === topCard.suit;
    });
  }

  toJSON() {
    return {
      numPlayers: this.numPlayers,
      cardsPerPlayer: this.cardsPerPlayer,
      deck: this.deck,
      discardPile: this.discardPile,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      gameDirection: this.gameDirection,
      isGameOver: this.isGameOver
    };
  }

  static fromJSON(json) {
    const game = new RondaGame(json.numPlayers, json.cardsPerPlayer);
    game.deck = json.deck;
    game.discardPile = json.discardPile;
    game.players = json.players;
    game.currentPlayerIndex = json.currentPlayerIndex;
    game.gameDirection = json.gameDirection;
    game.isGameOver = json.isGameOver;
    return game;
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RondaGame;
}
