// rules.js

import { validateMove, isBlindPlay } from "./moveValidator.js";
import {
  playCards,
  endTurn,
  playBlindFaceDownCard,
  resolveFailedBlindPlay
} from "../game/turnManager.js";
import {
  getCurrentPlayer,
  addLogEntry,
  getRemainingPlayers,
  setLoser
} from "../game/gameState.js";
import { applyPostPlayEffects, getEffectDescription } from "./specialCards.js";

/**
 * High-level rules engine.
 * This is the main place where a "play attempt" gets resolved.
 */

export function resolveMove(gameState, selectedCards) {
  validateGameState(gameState);

  if (gameState.gameOver) {
    return {
      success: false,
      gameState,
      action: "game_over",
      reason: "The game is already over."
    };
  }

  const player = getCurrentPlayer(gameState);

  if (!player) {
    throw new Error("No current player found");
  }

  if (isBlindPlay(player, selectedCards)) {
    return resolveBlindMove(gameState, selectedCards[0].id);
  }

  const validation = validateMove(gameState, player, selectedCards);

  if (!validation.valid) {
    return {
      success: false,
      gameState,
      action: "invalid",
      reason: validation.reason
    };
  }

  const playedCardIds = selectedCards.map((card) => card.id);
  let updatedState = playCards(gameState, playedCardIds);

  const postEffects = applyPostPlayEffects(updatedState, selectedCards);
  updatedState = postEffects.gameState;

  const effectDescription = getEffectDescription(postEffects.effect);
  if (effectDescription) {
    updatedState = addLogEntry(updatedState, effectDescription);
  }

  let gameOverResult = finalizeIfShitheadFound(updatedState);
  if (gameOverResult) {
    return gameOverResult;
  }

  if (!postEffects.keepTurn) {
    updatedState = endTurn(updatedState);
  } else {
    updatedState = addLogEntry(updatedState, `${player.name} keeps the turn.`);
  }

  gameOverResult = finalizeIfShitheadFound(updatedState);
  if (gameOverResult) {
    return gameOverResult;
  }

  return {
    success: true,
    gameState: updatedState,
    action: "play",
    playedCards: selectedCards,
    effect: postEffects.effect,
    burned: postEffects.burned,
    keptTurn: postEffects.keepTurn
  };
}

export function resolveBlindMove(gameState, cardId) {
  validateGameState(gameState);

  if (gameState.gameOver) {
    return {
      success: false,
      gameState,
      action: "game_over",
      reason: "The game is already over."
    };
  }

  const originalPlayer = getCurrentPlayer(gameState);

  const blindPlayResult = playBlindFaceDownCard(gameState, cardId);
  let updatedState = blindPlayResult.gameState;
  const playedCard = blindPlayResult.card;

  const validation = validateBlindCardAgainstPreviousPile(gameState, playedCard);

  if (!validation.valid) {
    updatedState = resolveFailedBlindPlay(updatedState);
    updatedState = addLogEntry(
      updatedState,
      `${originalPlayer.name}'s face-down card was illegal: ${validation.reason}`
    );

    let gameOverResult = finalizeIfShitheadFound(updatedState);
    if (gameOverResult) {
      return gameOverResult;
    }

    updatedState = endTurn(updatedState);

    gameOverResult = finalizeIfShitheadFound(updatedState);
    if (gameOverResult) {
      return gameOverResult;
    }

    return {
      success: true,
      gameState: updatedState,
      action: "blind_fail",
      playedCards: [playedCard],
      reason: validation.reason,
      pickedUpPile: true
    };
  }

  const postEffects = applyPostPlayEffects(updatedState, [playedCard]);
  updatedState = postEffects.gameState;

  const effectDescription = getEffectDescription(postEffects.effect);
  if (effectDescription) {
    updatedState = addLogEntry(updatedState, effectDescription);
  }

  let gameOverResult = finalizeIfShitheadFound(updatedState);
  if (gameOverResult) {
    return gameOverResult;
  }

  if (!postEffects.keepTurn) {
    updatedState = endTurn(updatedState);
  } else {
    updatedState = addLogEntry(updatedState, `${originalPlayer.name} keeps the turn.`);
  }

  gameOverResult = finalizeIfShitheadFound(updatedState);
  if (gameOverResult) {
    return gameOverResult;
  }

  return {
    success: true,
    gameState: updatedState,
    action: "blind_play",
    playedCards: [playedCard],
    effect: postEffects.effect,
    burned: postEffects.burned,
    keptTurn: postEffects.keepTurn,
    pickedUpPile: false
  };
}

export function getLegalSingleCardMoves(gameState, player) {
  validateGameState(gameState);

  const activeZone = getPlayerActiveZone(player);
  if (activeZone === "out") {
    return [];
  }

  return player[activeZone].filter((card) => {
    const result = validateMove(gameState, player, [card]);
    return result.valid;
  });
}

export function getLegalGroupedMoves(gameState, player) {
  validateGameState(gameState);

  const activeZone = getPlayerActiveZone(player);
  if (activeZone === "out") {
    return [];
  }

  if (activeZone === "faceDown") {
    return player.faceDown.map((card) => [card]);
  }

  const groups = groupCardsByRank(player[activeZone]);
  const legalMoves = [];

  for (const cards of Object.values(groups)) {
    for (let size = 1; size <= cards.length; size++) {
      const move = cards.slice(0, size);
      const result = validateMove(gameState, player, move);

      if (result.valid) {
        legalMoves.push(move);
      }
    }
  }

  return legalMoves;
}

export function playerHasLegalMove(gameState, player) {
  return getLegalGroupedMoves(gameState, player).length > 0;
}

export function resolveNoLegalMove(gameState) {
  validateGameState(gameState);

  if (gameState.gameOver) {
    return {
      success: false,
      gameState,
      action: "game_over",
      pickedUpPile: false
    };
  }

  const player = getCurrentPlayer(gameState);
  let updatedState = gameState;

  updatedState = resolveFailedNormalMove(updatedState);
  updatedState = addLogEntry(updatedState, `${player.name} had no legal move.`);

  let gameOverResult = finalizeIfShitheadFound(updatedState);
  if (gameOverResult) {
    return gameOverResult;
  }

  updatedState = endTurn(updatedState);

  gameOverResult = finalizeIfShitheadFound(updatedState);
  if (gameOverResult) {
    return gameOverResult;
  }

  return {
    success: true,
    gameState: updatedState,
    action: "pickup",
    pickedUpPile: true
  };
}

export function resolveFailedNormalMove(gameState) {
  return resolveFailedBlindPlay(gameState);
}

export function validateBlindCardAgainstPreviousPile(previousGameState, card) {
  const tempGameState = {
    ...previousGameState
  };

  const player = getCurrentPlayer(previousGameState);

  return validateMove(tempGameState, player, [card]);
}

export function getPlayerActiveZone(player) {
  if (!player) {
    throw new Error("player is required");
  }

  if (player.hand.length > 0) return "hand";
  if (player.faceUp.length > 0) return "faceUp";
  if (player.faceDown.length > 0) return "faceDown";

  return "out";
}

function finalizeIfShitheadFound(gameState) {
  const remainingPlayers = getRemainingPlayers(gameState);

  if (remainingPlayers.length === 1) {
    const shithead = remainingPlayers[0];

    let updatedState = setLoser(gameState, shithead.id);
    updatedState = addLogEntry(updatedState, `${shithead.name} is the shithead.`);

    return {
      success: true,
      gameState: updatedState,
      action: "game_over",
      loserId: shithead.id,
      loserName: shithead.name
    };
  }

  return null;
}

function groupCardsByRank(cards) {
  const groups = {};

  for (const card of cards) {
    if (!groups[card.rank]) {
      groups[card.rank] = [];
    }
    groups[card.rank].push(card);
  }

  return groups;
}

function validateGameState(gameState) {
  if (!gameState || !Array.isArray(gameState.players)) {
    throw new Error("Invalid gameState");
  }
}