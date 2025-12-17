class RondaGame {
  constructor(numPlayers, cardsPerPlayer = 5) {
    if (numPlayers < 2 || numPlayers > 6) {
      throw new Error('El número de jugadores debe estar entre 2 y 6');
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

    // Multi-ganadores (Sprint 4):
    // Un jugador puede quedarse sin cartas y seguir como espectador.
    // La partida termina cuando queda 1 jugador activo (perdedor).
    this.winnerIds = [];
    this.loserId = null;

    // Palo activo tras jugar un 7 (cambio de palo)
    this.currentSuit = null; // 'oros'|'copas'|'espadas'|'bastos'|null

    // Efectos acumulables/defensa (Sprint 4):
    // - 1 acumula +3 (defensa solo con 1)
    // - 2 acumula +2 (defensa solo con 2)
    this.pendingDrawCount = 0;
    this.pendingDrawType = null; // 1 | 2 | null
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
          image: `../../lib/img/${String(value).padStart(2, '0')}-${suit}.png`
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
        cardsCount: 0,
        hasFinished: false
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

    this.winnerIds = [];
    this.loserId = null;

    this.currentSuit = null;

    this.pendingDrawCount = 0;
    this.pendingDrawType = null;
  }

  _isPlayerFinished(playerIndex) {
    const player = this.players[playerIndex];
    return !!(player && (player.hasFinished || player.cardsCount === 0));
  }

  _activePlayerCount() {
    return this.players.filter(p => !p.hasFinished).length;
  }

  _markPlayerFinished(playerIndex) {
    const player = this.players[playerIndex];
    if (!player) return false;
    if (player.hasFinished) return false;
    if (player.cardsCount !== 0) return false;

    player.hasFinished = true;
    if (!this.winnerIds.includes(playerIndex)) {
      this.winnerIds.push(playerIndex);
    }
    return true;
  }

  _maybeEndGame() {
    const activeIndices = this.players
      .filter(p => !p.hasFinished)
      .map(p => p.id);

    if (activeIndices.length === 1 && this.winnerIds.length >= 1) {
      this.isGameOver = true;
      this.loserId = activeIndices[0];
      return true;
    }
    return false;
  }
  getGameState() {
    return {
      currentPlayer: this.currentPlayerIndex,
      players: this.players.map(player => ({
        id: player.id,
        id_usuario: player.id_usuario,
        name: player.name,
        cardsCount: player.cardsCount,
        hasFinished: !!player.hasFinished,
        hand: player.hand
      })),
      topCard: this.discardPile.length > 0 
        ? this.discardPile[this.discardPile.length - 1] 
        : null,
      deckCount: this.deck.length,
      discardCount: this.discardPile.length,
      gameDirection: this.gameDirection,
      isGameOver: this.isGameOver,
      winners: this.winnerIds,
      loserId: this.loserId
      ,
      currentSuit: this.currentSuit,
      pendingDraw: {
        count: this.pendingDrawCount,
        type: this.pendingDrawType
      }
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
    if (this.isGameOver) {
      return { valid: false, reason: 'La partida ya ha finalizado' };
    }

    if (this._isPlayerFinished(playerId)) {
      return { valid: false, reason: 'Ya has terminado tus cartas. Estás espectando.' };
    }

    const player = this.players[playerId];
    const topCard = this.discardPile[this.discardPile.length - 1];
    const suitToMatch = this.currentSuit || (topCard ? topCard.suit : null);
    
    const hasCard = player.hand.some(card => 
      card.value === cardValue && card.suit === cardSuit
    );
    if (!hasCard) return { valid: false, reason: 'No tienes esa carta' };

    if (this.currentPlayerIndex !== playerId) {
      return { valid: false, reason: 'No es tu turno' };
    }

    // Si hay penalización acumulada (1 o 2), solo se puede defender con la misma carta.
    // Jugar una defensa NO requiere coincidir con la pila.
    if (this.pendingDrawCount > 0) {
      if (cardValue === this.pendingDrawType) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `Debes defender con un ${this.pendingDrawType} o robar ${this.pendingDrawCount} cartas`
      };
    }

    if (cardValue === 7) {
      return { valid: true };
    }

    if (topCard && (cardValue === topCard.value || cardSuit === suitToMatch)) {
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

    // Si había un palo activo por un 7 anterior, se consume al jugar una carta normal.
    if (card.value !== 7) {
      this.currentSuit = null;
    }

    const result = this.applyCardEffect(card, playerId, newSuit);

    const playerFinishedNow = this._markPlayerFinished(playerId);
    const gameOverNow = this._maybeEndGame();

    return {
      gameOver: gameOverNow,
      winnerId: null,
      winnerIds: this.winnerIds,
      loserId: this.loserId,
      playerFinished: playerFinishedNow,
      finishedPlayerId: playerFinishedNow ? playerId : null,
      ...result
    };
  }

  applyCardEffect(card, playerId, newSuit) {
    const result = { effect: null, affectedPlayer: null };

    switch (card.value) {
      case 1:
        // Acumulable/defensa: +3 al siguiente, pero puede defender con otro 1.
        if (this.pendingDrawCount === 0) {
          this.pendingDrawType = 1;
        }
        this.pendingDrawCount += 3;
        result.effect = 'stack_draw';
        result.affectedPlayer = this.getNextPlayerIndex();
        this.advancePlayer();
        break;
      
      case 2:
        // Acumulable/defensa: +2 al siguiente, pero puede defender con otro 2.
        if (this.pendingDrawCount === 0) {
          this.pendingDrawType = 2;
        }
        this.pendingDrawCount += 2;
        result.effect = 'stack_draw';
        result.affectedPlayer = this.getNextPlayerIndex();
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
          this.currentSuit = newSuit;
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
    if (this.isGameOver) {
      throw new Error('La partida ya ha finalizado');
    }

    if (this._isPlayerFinished(playerId)) {
      throw new Error('Ya has terminado tus cartas. Estás espectando.');
    }

    if (this.currentPlayerIndex !== playerId) {
      throw new Error('No es tu turno');
    }

    // Si hay penalización pendiente (por 1 o 2), robar la cantidad acumulada y limpiarla
    const drawCount = this.pendingDrawCount > 0 ? this.pendingDrawCount : 1;
    const cards = this.drawCards(playerId, drawCount);
    if (this.pendingDrawCount > 0) {
      this.pendingDrawCount = 0;
      this.pendingDrawType = null;
    }

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
    if (this.isGameOver) {
      return this.currentPlayerIndex;
    }

    if (this._activePlayerCount() <= 1) {
      return this.currentPlayerIndex;
    }

    let nextIndex = this.currentPlayerIndex;
    for (let i = 0; i < this.numPlayers; i++) {
      nextIndex = nextIndex + this.gameDirection;
      if (nextIndex >= this.numPlayers) {
        nextIndex = 0;
      } else if (nextIndex < 0) {
        nextIndex = this.numPlayers - 1;
      }

      if (!this._isPlayerFinished(nextIndex)) {
        return nextIndex;
      }
    }

    return this.currentPlayerIndex;
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
    if (this.isGameOver) {
      return false;
    }

    if (this._isPlayerFinished(playerId)) {
      return false;
    }

    if (this.currentPlayerIndex !== playerId) {
      return false;
    }

    const player = this.players[playerId];
    const topCard = this.discardPile[this.discardPile.length - 1];
    const suitToMatch = this.currentSuit || (topCard ? topCard.suit : null);

    return player.hand.some(card => {
      if (card.value === 7) return true;
      return card.value === topCard.value || card.suit === suitToMatch;
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
      isGameOver: this.isGameOver,
      currentSuit: this.currentSuit,
      pendingDrawCount: this.pendingDrawCount,
      pendingDrawType: this.pendingDrawType,
      winnerIds: this.winnerIds,
      loserId: this.loserId
    };
  }

  static fromJSON(json) {
    const numPlayers = Number(json.numPlayers);
    const cardsPerPlayer = Number(json.cardsPerPlayer);
    const game = new RondaGame(
      Number.isFinite(numPlayers) ? numPlayers : 2,
      Number.isFinite(cardsPerPlayer) ? cardsPerPlayer : 5
    );
    game.deck = Array.isArray(json.deck) ? json.deck : [];
    game.discardPile = Array.isArray(json.discardPile) ? json.discardPile : [];
    game.players = (json.players || []).map(p => ({
      ...p,
      id: Number.isFinite(Number(p.id)) ? Number(p.id) : p.id,
      id_usuario: (p.id_usuario === null || p.id_usuario === undefined) ? p.id_usuario : Number(p.id_usuario),
      cardsCount: Number.isFinite(Number(p.cardsCount)) ? Number(p.cardsCount) : 0,
      hasFinished: !!p.hasFinished
    }));
    const currentPlayerIndex = Number(json.currentPlayerIndex);
    game.currentPlayerIndex = Number.isFinite(currentPlayerIndex) ? currentPlayerIndex : 0;
    const gameDirection = Number(json.gameDirection);
    game.gameDirection = (gameDirection === -1 || gameDirection === 1) ? gameDirection : 1;
    game.isGameOver = !!json.isGameOver;
    game.currentSuit = json.currentSuit || null;
    game.pendingDrawCount = Number.isFinite(Number(json.pendingDrawCount)) ? Number(json.pendingDrawCount) : 0;
    game.pendingDrawType = json.pendingDrawType || null;

    game.winnerIds = Array.isArray(json.winnerIds)
      ? json.winnerIds.map(n => Number(n)).filter(n => Number.isFinite(n))
      : [];
    game.loserId = Number.isFinite(Number(json.loserId)) ? Number(json.loserId) : null;

    // Compatibilidad con estados antiguos: si hay jugadores con 0 cartas, marcarlos como finalizados.
    for (const p of game.players) {
      if (p && p.cardsCount === 0) {
        p.hasFinished = true;
        if (typeof p.id === 'number' && !game.winnerIds.includes(p.id)) {
          game.winnerIds.push(p.id);
        }
      }
    }

    // Si ya solo queda 1 activo, fijar perdedor y gameOver.
    game._maybeEndGame();
    return game;
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RondaGame;
}
