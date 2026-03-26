// specialCards.js

import { RANKS } from "../cards/cardDefinitions.js";
import { burnPlayPile, getTopPlayPileCards } from "../game/turnManager.js";

/**
 * Special-card and pile-effect helpers.
 * This file decides what special effects should happen
 * after cards have been played.
 * It does not validate whether the move was legal.
 */

/**
 * Returns the effect of a rank, if any.
 */
export function getSpecialEffect(rank) {
  switch (rank) {
    case RANKS.TWO:
      return "reset";
    case RANKS.SEVEN:
      return "lower_than_seven";
    case RANKS.TEN:
      return "burn";
    default:
      return null;
  }
}

/**
 * True if the rank has a special effect.
 */
export function isSpecialRank(rank) {
  return getSpecialEffect(rank) !== null;
}

/**
 * Applies the immediate effect of the played rank.
 *
 * Notes:
 * - 2 resets the pile requirement, but does not change the pile itself.
 * - 7 changes the requirement for the next play.
 * - 10 burns the pile immediately.
 */
export function applyPlayedCardEffect(gameState, playedCards) {
  validatePlayedCards(playedCards);

  const playedRank = playedCards[0].rank;
  const effect = getSpecialEffect(playedRank);

  if (effect === "burn") {
    return {
      gameState: burnPlayPile(gameState, "Pile burned by 10."),
      effect: "burn"
    };
  }

  if (effect === "reset") {
    return {
      gameState,
      effect: "reset"
    };
  }

  if (effect === "lower_than_seven") {
    return {
      gameState,
      effect: "lower_than_seven"
    };
  }

  return {
    gameState,
    effect: null
  };
}

/**
 * Checks whether the top four cards of the pile are the same rank.
 * In your rules, that burns the pile.
 */
export function isFourOfAKindBurn(gameState) {
  const topFour = getTopPlayPileCards(gameState, 4);

  if (topFour.length < 4) {
    return false;
  }

  const firstRank = topFour[0].rank;
  return topFour.every((card) => card.rank === firstRank);
}

/**
 * Burns the pile if the top four cards match.
 */
export function applyFourOfAKindBurn(gameState) {
  if (!isFourOfAKindBurn(gameState)) {
    return {
      gameState,
      burned: false
    };
  }

  return {
    gameState: burnPlayPile(gameState, "Pile burned by four of a kind."),
    burned: true
  };
}

/**
 * Applies all post-play pile effects in sensible order.
 *
 * Current order:
 * 1. rank effect
 * 2. four-of-a-kind burn
 *
 * Burns now PASS THE TURN.
 */
export function applyPostPlayEffects(gameState, playedCards) {
  validatePlayedCards(playedCards);

  const rankEffectResult = applyPlayedCardEffect(gameState, playedCards);
  let updatedState = rankEffectResult.gameState;

  // If 10 already burned the pile, no need to check four of a kind
  if (rankEffectResult.effect === "burn") {
    return {
      gameState: updatedState,
      burned: true,
      effect: "burn",
      keepTurn: false
    };
  }

  const fourKindResult = applyFourOfAKindBurn(updatedState);
  updatedState = fourKindResult.gameState;

  if (fourKindResult.burned) {
    return {
      gameState: updatedState,
      burned: true,
      effect: "four_of_a_kind",
      keepTurn: false
    };
  }

  return {
    gameState: updatedState,
    burned: false,
    effect: rankEffectResult.effect,
    keepTurn: false
  };
}

/**
 * Helper for UI/logging/debugging.
 */
export function getEffectDescription(effect) {
  switch (effect) {
    case "reset":
      return "Pile reset by 2.";
    case "lower_than_seven":
      return "Next card must be lower than 7.";
    case "burn":
      return "Pile burned by 10.";
    case "four_of_a_kind":
      return "Pile burned by four of a kind.";
    default:
      return null;
  }
}

function validatePlayedCards(playedCards) {
  if (!Array.isArray(playedCards) || playedCards.length === 0) {
    throw new Error("playedCards must be a non-empty array");
  }

  const firstRank = playedCards[0].rank;
  const sameRank = playedCards.every((card) => card.rank === firstRank);

  if (!sameRank) {
    throw new Error("All playedCards must be the same rank");
  }
}