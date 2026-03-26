// gameState.js

/**
 * Pure game-state creation and helpers.
 * No UI code.
 * No DOM code.
 * No rule logic beyond basic setup structure.
 */

export const PLAYER_PHASES = {
  HAND: "hand",
  FACE_UP: "face_up",
  FACE_DOWN: "face_down",
  OUT: "out"
};

export const GAME_PHASES = {
  SETUP: "setup",
  PLAYING: "playing",
  FINISHED: "finished"
};

/**
 * Creates a player object.
 */
export function createPlayer(id, name) {
  return {
    id,
    name,
    hand: [],
    faceUp: [],
    faceDown: [],
    phase: PLAYER_PHASES.HAND,
    isOut: false
  };
}

/**
 * Creates a list of players.
 */
export function createPlayers(playerCount) {
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 8) {
    throw new Error("playerCount must be an integer between 2 and 8");
  }

  const players = [];

  for (let i = 0; i < playerCount; i++) {
    players.push(createPlayer(`player-${i + 1}`, `Player ${i + 1}`));
  }

  return players;
}

/**
 * Creates the full game state object.
 */
export function createGameState(playerCount) {
  return {
    players: createPlayers(playerCount),

    drawPile: [],
    playPile: [],
    burnPile: [],

    currentPlayerIndex: 0,
    direction: 1,

    selectedCardIds: [],

    phase: GAME_PHASES.SETUP,
    winnerId: null,

    // Added for Shithead endgame
    gameOver: false,
    loserId: null,

    turn: 1,
    log: []
  };
}

/**
 * Returns the current player object.
 */
export function getCurrentPlayer(gameState) {
  validateGameState(gameState);
  return gameState.players[gameState.currentPlayerIndex];
}

/**
 * Returns a player by ID.
 */
export function getPlayerById(gameState, playerId) {
  validateGameState(gameState);
  return gameState.players.find((player) => player.id === playerId) || null;
}

/**
 * Sets the draw pile.
 */
export function setDrawPile(gameState, drawPile) {
  validateGameState(gameState);

  return {
    ...gameState,
    drawPile: [...drawPile]
  };
}

/**
 * Adds a log entry.
 */
export function addLogEntry(gameState, message) {
  validateGameState(gameState);

  return {
    ...gameState,
    log: [
      ...gameState.log,
      {
        turn: gameState.turn,
        message
      }
    ]
  };
}

/**
 * Sets selected card IDs for UI/controller use.
 */
export function setSelectedCardIds(gameState, cardIds) {
  validateGameState(gameState);

  return {
    ...gameState,
    selectedCardIds: [...cardIds]
  };
}

/**
 * Clears selected cards.
 */
export function clearSelectedCardIds(gameState) {
  validateGameState(gameState);

  return {
    ...gameState,
    selectedCardIds: []
  };
}

/**
 * Advances to the next player who is still in the game.
 */
export function advanceToNextPlayer(gameState) {
  validateGameState(gameState);

  if (gameState.gameOver) {
    return gameState;
  }

  const totalPlayers = gameState.players.length;
  let nextIndex = gameState.currentPlayerIndex;

  for (let i = 0; i < totalPlayers; i++) {
    nextIndex = (nextIndex + gameState.direction + totalPlayers) % totalPlayers;

    if (!gameState.players[nextIndex].isOut) {
      return {
        ...gameState,
        currentPlayerIndex: nextIndex,
        turn: gameState.turn + 1,
        selectedCardIds: []
      };
    }
  }

  return gameState;
}

/**
 * Replaces one player in the state.
 */
export function updatePlayer(gameState, updatedPlayer) {
  validateGameState(gameState);

  const players = gameState.players.map((player) =>
    player.id === updatedPlayer.id ? { ...updatedPlayer } : player
  );

  return {
    ...gameState,
    players
  };
}

/**
 * Marks a player as out.
 */
export function markPlayerOut(gameState, playerId) {
  validateGameState(gameState);

  const player = getPlayerById(gameState, playerId);

  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }

  const updatedPlayer = {
    ...player,
    isOut: true,
    phase: PLAYER_PHASES.OUT
  };

  return updatePlayer(gameState, updatedPlayer);
}

/**
 * Sets the winner.
 */
export function setWinner(gameState, playerId) {
  validateGameState(gameState);

  return {
    ...gameState,
    winnerId: playerId,
    phase: GAME_PHASES.FINISHED
  };
}

/**
 * Sets the loser / shithead.
 */
export function setLoser(gameState, playerId) {
  validateGameState(gameState);

  return {
    ...gameState,
    loserId: playerId,
    gameOver: true,
    phase: GAME_PHASES.FINISHED
  };
}

/**
 * Moves game from setup into active play.
 */
export function startGame(gameState) {
  validateGameState(gameState);

  return {
    ...gameState,
    phase: GAME_PHASES.PLAYING
  };
}

/**
 * Determines which card zone the player should currently use.
 * Hand first, then face-up, then face-down.
 */
export function getPlayerActiveZone(player) {
  if (!player) {
    throw new Error("player is required");
  }

  if (player.hand.length > 0) {
    return PLAYER_PHASES.HAND;
  }

  if (player.faceUp.length > 0) {
    return PLAYER_PHASES.FACE_UP;
  }

  if (player.faceDown.length > 0) {
    return PLAYER_PHASES.FACE_DOWN;
  }

  return PLAYER_PHASES.OUT;
}

/**
 * Recalculates a player's phase from their cards.
 */
export function refreshPlayerPhase(player) {
  const phase = getPlayerActiveZone(player);

  return {
    ...player,
    phase,
    isOut: phase === PLAYER_PHASES.OUT
  };
}

/**
 * Recalculates all player phases.
 */
export function refreshAllPlayerPhases(gameState) {
  validateGameState(gameState);

  const players = gameState.players.map(refreshPlayerPhase);

  return {
    ...gameState,
    players
  };
}

/**
 * Checks whether only one player remains.
 */
export function getRemainingPlayers(gameState) {
  validateGameState(gameState);
  return gameState.players.filter((player) => !player.isOut);
}

/**
 * Basic validation helper.
 */
function validateGameState(gameState) {
  if (!gameState || !Array.isArray(gameState.players)) {
    throw new Error("Invalid gameState");
  }
}