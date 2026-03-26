// cardDefinitions.js

/**
 * Core definitions for cards.
 * No game state, no UI — just pure definitions.
 */

export const SUITS = {
  CLUBS: "clubs",
  DIAMONDS: "diamonds",
  HEARTS: "hearts",
  SPADES: "spades"
};

export const SUIT_LIST = Object.values(SUITS);

export const SUIT_SYMBOLS = {
  [SUITS.CLUBS]: "♣",
  [SUITS.DIAMONDS]: "♦",
  [SUITS.HEARTS]: "♥",
  [SUITS.SPADES]: "♠"
};

export const SUIT_COLORS = {
  [SUITS.CLUBS]: "black",
  [SUITS.SPADES]: "black",
  [SUITS.DIAMONDS]: "red",
  [SUITS.HEARTS]: "red"
};

export const RANKS = {
  TWO: "2",
  THREE: "3",
  FOUR: "4",
  FIVE: "5",
  SIX: "6",
  SEVEN: "7",
  EIGHT: "8",
  NINE: "9",
  TEN: "10",
  JACK: "J",
  QUEEN: "Q",
  KING: "K",
  ACE: "A"
};

export const RANK_LIST = Object.values(RANKS);

/**
 * Numeric strength values.
 * Useful for comparing cards.
 */
export const RANK_VALUES = {
  [RANKS.TWO]: 2,
  [RANKS.THREE]: 3,
  [RANKS.FOUR]: 4,
  [RANKS.FIVE]: 5,
  [RANKS.SIX]: 6,
  [RANKS.SEVEN]: 7,
  [RANKS.EIGHT]: 8,
  [RANKS.NINE]: 9,
  [RANKS.TEN]: 10,
  [RANKS.JACK]: 11,
  [RANKS.QUEEN]: 12,
  [RANKS.KING]: 13,
  [RANKS.ACE]: 14
};

/**
 * Special rules for Shithead.
 * Keeps rule meaning separate from logic.
 */
export const SPECIAL_CARDS = {
  [RANKS.TWO]: {
    name: "reset",
    description: "Resets the pile (can play anything next)"
  },
  [RANKS.SEVEN]: {
    name: "reverse_requirement",
    description: "Next card must be LOWER than 7"
  },
  [RANKS.TEN]: {
    name: "burn",
    description: "Burns the pile (removes it from the game)"
  }
};

/**
 * Returns true if the card has a special rule.
 */
export function isSpecialCard(rank) {
  return Boolean(SPECIAL_CARDS[rank]);
}

/**
 * Get special rule info for a card rank.
 */
export function getSpecialCard(rank) {
  return SPECIAL_CARDS[rank] || null;
}

/**
 * Converts rank to asset-friendly name.
 * (for your future sprite decks)
 */
export function rankToAssetName(rank) {
  switch (rank) {
    case RANKS.ACE:
      return "ace";
    case RANKS.KING:
      return "king";
    case RANKS.QUEEN:
      return "queen";
    case RANKS.JACK:
      return "jack";
    default:
      return rank;
  }
}

/**
 * Builds a consistent asset filename.
 */
export function getCardAssetFileName(rank, suit) {
  return `${rankToAssetName(rank)}_of_${suit}.png`;
}

/**
 * Back-of-card asset (for themed decks later)
 */
export function getBackAssetFileName() {
  return "back.png";
}