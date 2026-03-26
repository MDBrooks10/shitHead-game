// turnManager.js

import {
  getCurrentPlayer,
  updatePlayer,
  advanceToNextPlayer,
  clearSelectedCardIds,
  refreshAllPlayerPhases,
  addLogEntry
} from "./gameState.js";

const TARGET_HAND_SIZE = 5;

/**
 * Plays one or more cards from the current player's active zone.
 * This file manages turn flow, not move legality.
 * Assume validation is handled elsewhere.
 */
export function playCards(gameState, cardIds) {
  validateGameState(gameState);

  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    throw new Error("cardIds must be a non-empty array");
  }

  const player = getCurrentPlayer(gameState);
  const zone = getActiveZoneName(player);

  let removedCards = [];
  let updatedPlayer = { ...player };
  let updatedState = gameState;

  if (zone === "hand") {
    const result = playFromHandPreserveSlots(gameState, player, cardIds);
    removedCards = result.removedCards;
    updatedPlayer = result.updatedPlayer;
    updatedState = result.updatedState;
  } else {
    const { removedCards: zoneRemovedCards, updatedZoneCards } = removeCardsFromZone(
      player[zone],
      cardIds
    );

    if (zoneRemovedCards.length !== cardIds.length) {
      throw new Error("One or more selected cards were not found in the active zone");
    }

    removedCards = zoneRemovedCards;
    updatedPlayer = {
      ...player,
      [zone]: updatedZoneCards
    };

    updatedState = updatePlayer(gameState, updatedPlayer);
  }

  updatedState = appendToPlayPile(updatedState, removedCards);
  updatedState = clearSelectedCardIds(updatedState);
  updatedState = refreshAllPlayerPhases(updatedState);

  updatedState = addLogEntry(
    updatedState,
    `${player.name} played ${removedCards.map(formatCardLabel).join(", ")}`
  );

  return updatedState;
}

/**
 * Current player picks up the full play pile into their hand.
 */
export function pickupPlayPile(gameState) {
  validateGameState(gameState);

  const player = getCurrentPlayer(gameState);

  if (gameState.playPile.length === 0) {
    return addLogEntry(gameState, `${player.name} tried to pick up an empty pile.`);
  }

  const updatedPlayer = {
    ...player,
    hand: [...player.hand, ...gameState.playPile]
  };

  let updatedState = updatePlayer(gameState, updatedPlayer);

  updatedState = {
    ...updatedState,
    playPile: [],
    selectedCardIds: []
  };

  updatedState = refreshAllPlayerPhases(updatedState);
  updatedState = addLogEntry(updatedState, `${player.name} picked up the play pile.`);

  return updatedState;
}

/**
 * Burns the current play pile into the burn pile.
 */
export function burnPlayPile(gameState, reason = "Pile burned") {
  validateGameState(gameState);

  if (gameState.playPile.length === 0) {
    return gameState;
  }

  const burnedCards = [...gameState.playPile];

  let updatedState = {
    ...gameState,
    burnPile: [...gameState.burnPile, ...burnedCards],
    playPile: []
  };

  updatedState = addLogEntry(updatedState, reason);

  return updatedState;
}

/**
 * Ends the current player's turn and advances to the next active player.
 */
export function endTurn(gameState) {
  validateGameState(gameState);

  let updatedState = clearSelectedCardIds(gameState);
  updatedState = refreshAllPlayerPhases(updatedState);
  updatedState = advanceToNextPlayer(updatedState);

  const nextPlayer = getCurrentPlayer(updatedState);

  updatedState = addLogEntry(updatedState, `Turn passed to ${nextPlayer.name}.`);

  return updatedState;
}

/**
 * Plays cards, optionally burns, then either keeps turn or advances.
 * - If pile burns, current player keeps the turn.
 * - Otherwise next player gets the turn.
 */
export function resolvePlayedTurn(gameState, cardIds, options = {}) {
  validateGameState(gameState);

  const { shouldBurn = false, burnReason = "Pile burned" } = options;

  let updatedState = playCards(gameState, cardIds);

  if (shouldBurn) {
    updatedState = burnPlayPile(updatedState, burnReason);
    return updatedState;
  }

  return endTurn(updatedState);
}

/**
 * Current player attempts a blind face-down play.
 * Returns the played card as well so rules can inspect it.
 */
export function playBlindFaceDownCard(gameState, cardId) {
  validateGameState(gameState);

  const player = getCurrentPlayer(gameState);

  if (getActiveZoneName(player) !== "faceDown") {
    throw new Error("Player is not currently playing from faceDown cards");
  }

  const card = player.faceDown.find((c) => c.id === cardId);

  if (!card) {
    throw new Error("Card not found in faceDown zone");
  }

  const updatedFaceDown = player.faceDown.filter((c) => c.id !== cardId);

  let updatedState = updatePlayer(gameState, {
    ...player,
    faceDown: updatedFaceDown
  });

  updatedState = appendToPlayPile(updatedState, [card]);
  updatedState = clearSelectedCardIds(updatedState);
  updatedState = refreshAllPlayerPhases(updatedState);
  updatedState = addLogEntry(updatedState, `${player.name} played a face-down card.`);

  return {
    gameState: updatedState,
    card
  };
}

/**
 * If a blind face-down card was illegal, player picks up the pile.
 * The face-down card remains in the pile because it was played.
 */
export function resolveFailedBlindPlay(gameState) {
  validateGameState(gameState);
  return pickupPlayPile(gameState);
}

/**
 * Returns the top card of the play pile.
 */
export function getTopPlayPileCard(gameState) {
  validateGameState(gameState);

  if (gameState.playPile.length === 0) {
    return null;
  }

  return gameState.playPile[gameState.playPile.length - 1];
}

/**
 * Returns the last N cards from the play pile.
 */
export function getTopPlayPileCards(gameState, count) {
  validateGameState(gameState);

  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be an integer of 1 or more");
  }

  return gameState.playPile.slice(-count);
}

/**
 * Returns true if the play pile is empty.
 */
export function isPlayPileEmpty(gameState) {
  validateGameState(gameState);
  return gameState.playPile.length === 0;
}

/**
 * Returns the active zone name for a player:
 * "hand", "faceUp", or "faceDown"
 */
export function getActiveZoneName(player) {
  if (!player) {
    throw new Error("player is required");
  }

  if (player.hand.length > 0) return "hand";
  if (player.faceUp.length > 0) return "faceUp";
  if (player.faceDown.length > 0) return "faceDown";

  return "out";
}

/**
 * Play from hand while preserving hand positions.
 * Played card slots get refilled from the draw pile in the same indexes.
 * If there are not enough cards to refill, the empty slots are removed.
 * Then the hand is topped up to 5 while draw pile remains.
 */
function playFromHandPreserveSlots(gameState, player, cardIds) {
  const hand = [...player.hand];
  const idSet = new Set(cardIds);

  const removedCards = [];
  const playedIndexes = [];

  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    if (idSet.has(card.id)) {
      removedCards.push(card);
      playedIndexes.push(i);
      hand[i] = null;
    }
  }

  if (removedCards.length !== cardIds.length) {
    throw new Error("One or more selected cards were not found in the hand");
  }

  let drawPile = [...gameState.drawPile];

  // Replace in the same slots first
  for (const index of playedIndexes) {
    if (drawPile.length > 0) {
      hand[index] = drawPile.pop();
    }
  }

  // Remove empty gaps if we couldn't refill all played slots
  const compactedHand = hand.filter(Boolean);

  // Top back up to 5 while draw pile remains
  while (compactedHand.length < TARGET_HAND_SIZE && drawPile.length > 0) {
    compactedHand.push(drawPile.pop());
  }

  const updatedPlayer = {
    ...player,
    hand: compactedHand
  };

  const updatedState = updatePlayer(
    {
      ...gameState,
      drawPile
    },
    updatedPlayer
  );

  return {
    removedCards,
    updatedPlayer,
    updatedState
  };
}

/**
 * Helper to move cards onto the play pile.
 */
function appendToPlayPile(gameState, cards) {
  return {
    ...gameState,
    playPile: [...gameState.playPile, ...cards]
  };
}

/**
 * Removes specific cards by ID from a zone.
 */
function removeCardsFromZone(zoneCards, cardIds) {
  const idSet = new Set(cardIds);
  const removedCards = [];
  const updatedZoneCards = [];

  for (const card of zoneCards) {
    if (idSet.has(card.id)) {
      removedCards.push(card);
    } else {
      updatedZoneCards.push(card);
    }
  }

  return { removedCards, updatedZoneCards };
}

/**
 * Human-readable card label for logs.
 */
function formatCardLabel(card) {
  return `${card.rank}${card.symbol ?? ""}`;
}

function validateGameState(gameState) {
  if (!gameState || !Array.isArray(gameState.players)) {
    throw new Error("Invalid gameState");
  }
}