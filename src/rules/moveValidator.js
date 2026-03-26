// moveValidator.js

import { RANKS, RANK_VALUES } from "../cards/cardDefinitions.js";
import { getTopPlayPileCard } from "../game/turnManager.js";

/**
 * Validates whether a proposed move is legal.
 * This file decides legality only.
 * It does not mutate game state.
 */

/**
 * Main entry point.
 * selectedCards should be the exact cards the player wants to play this turn.
 */
export function validateMove(gameState, player, selectedCards) {
  if (!gameState) {
    throw new Error("gameState is required");
  }

  if (!player) {
    throw new Error("player is required");
  }

  if (!Array.isArray(selectedCards) || selectedCards.length === 0) {
    return invalid("No cards selected.");
  }

  const sameRankCheck = validateSameRankSelection(selectedCards);
  if (!sameRankCheck.valid) {
    return sameRankCheck;
  }

  const activeZoneCheck = validateCardsAreFromActiveZone(player, selectedCards);
  if (!activeZoneCheck.valid) {
    return activeZoneCheck;
  }

  const pileContext = getPileContext(gameState);
  const cardToCompare = selectedCards[0];

  const legalPlayCheck = validateCardAgainstPile(cardToCompare, pileContext);
  if (!legalPlayCheck.valid) {
    return legalPlayCheck;
  }

  return valid({
    selectedRank: cardToCompare.rank,
    selectedCount: selectedCards.length,
    activeRule: legalPlayCheck.rule
  });
}

/**
 * All selected cards must be the same rank.
 */
export function validateSameRankSelection(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return invalid("No cards selected.");
  }

  const firstRank = cards[0].rank;
  const allSameRank = cards.every((card) => card.rank === firstRank);

  if (!allSameRank) {
    return invalid("You can only play cards of the same rank together.");
  }

  return valid();
}

/**
 * Cards must come from the player's current active zone.
 * Hand first, then face-up, then face-down.
 *
 * For face-down play, only one blind card should be played at a time.
 */
export function validateCardsAreFromActiveZone(player, selectedCards) {
  const activeZone = getPlayerActiveZoneName(player);

  if (activeZone === "out") {
    return invalid("This player has no cards left.");
  }

  const zoneCards = player[activeZone];
  const zoneCardIds = new Set(zoneCards.map((card) => card.id));
  const allInZone = selectedCards.every((card) => zoneCardIds.has(card.id));

  if (!allInZone) {
    return invalid(`Selected cards are not all in the player's ${activeZone} zone.`);
  }

  if (activeZone === "faceDown" && selectedCards.length !== 1) {
    return invalid("You can only play one face-down card at a time.");
  }

  return valid({ activeZone });
}

/**
 * Checks whether a card rank is legal against the pile.
 */
export function validateCardAgainstPile(card, pileContext) {
  if (!card) {
    return invalid("No card provided.");
  }

  if (!pileContext) {
    throw new Error("pileContext is required");
  }

  // Empty pile: anything can be played
  if (!pileContext.topRelevantCard) {
    return valid({ rule: "empty_pile" });
  }

  // Special cards are always legal
  if (isAlwaysPlayable(card.rank)) {
    return valid({ rule: "special_always_playable" });
  }

  // If the active requirement is "play lower than 7"
  if (pileContext.requirement === "lower_than_seven") {
    if (RANK_VALUES[card.rank] < RANK_VALUES[RANKS.SEVEN]) {
      return valid({ rule: "lower_than_seven" });
    }

    return invalid("You must play a card lower than 7.");
  }

  // Normal rule: equal or higher than the top relevant card
  if (RANK_VALUES[card.rank] >= RANK_VALUES[pileContext.topRelevantCard.rank]) {
    return valid({ rule: "equal_or_higher" });
  }

  return invalid(
    `You must play a card equal to or higher than ${formatCardLabel(pileContext.topRelevantCard)}.`
  );
}

/**
 * Builds the current pile context.
 * We look at the top relevant card and whether a 7 is currently setting the rule.
 */
export function getPileContext(gameState) {
  const playPile = gameState.playPile ?? [];

  if (playPile.length === 0) {
    return {
      topRelevantCard: null,
      requirement: "normal"
    };
  }

  const topCard = getTopPlayPileCard(gameState);

  if (topCard.rank === RANKS.SEVEN) {
    return {
      topRelevantCard: topCard,
      requirement: "lower_than_seven"
    };
  }

  return {
    topRelevantCard: topCard,
    requirement: "normal"
  };
}

/**
 * In your rules:
 * - 2 resets
 * - 10 burns
 * - 7 changes the next requirement
 * All of these are always legal to play.
 */
export function isAlwaysPlayable(rank) {
  return rank === RANKS.TWO || rank === RANKS.SEVEN || rank === RANKS.TEN;
}

/**
 * Determines which zone the player should play from.
 */
export function getPlayerActiveZoneName(player) {
  if (!player) {
    throw new Error("player is required");
  }

  if (player.hand.length > 0) return "hand";
  if (player.faceUp.length > 0) return "faceUp";
  if (player.faceDown.length > 0) return "faceDown";

  return "out";
}

/**
 * Returns whether the selected move is a face-down blind play.
 */
export function isBlindPlay(player, selectedCards) {
  const zone = getPlayerActiveZoneName(player);
  return zone === "faceDown" && selectedCards.length === 1;
}

/**
 * Helper to compare multiple selected cards.
 * Assumes same-rank validation has already happened.
 */
export function getSelectedRank(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return null;
  }

  return cards[0].rank;
}

/**
 * Structured result helpers.
 */
function valid(extra = {}) {
  return {
    valid: true,
    reason: null,
    ...extra
  };
}

function invalid(reason) {
  return {
    valid: false,
    reason
  };
}

function formatCardLabel(card) {
  return `${card.rank}${card.symbol ?? ""}`;
}