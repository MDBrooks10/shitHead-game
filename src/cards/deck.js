// deck.js

export const SUITS = ["clubs", "diamonds", "hearts", "spades"];

export const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A"
];

export const SUIT_SYMBOLS = {
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠"
};

export const SUIT_COLORS = {
  clubs: "black",
  spades: "black",
  diamonds: "red",
  hearts: "red"
};

export const RANK_VALUES = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  "J": 11,
  "Q": 12,
  "K": 13,
  "A": 14
};

/**
 * Creates a single card object.
 * This is pure card data — no UI stuff here.
 */
export function createCard(rank, suit, deckNumber = 0, index = 0) {
  if (!RANKS.includes(rank)) {
    throw new Error(`Invalid rank: ${rank}`);
  }

  if (!SUITS.includes(suit)) {
    throw new Error(`Invalid suit: ${suit}`);
  }

  return {
    id: `${deckNumber}-${rank}-${suit}-${index}`,
    rank,
    suit,
    value: RANK_VALUES[rank],
    color: SUIT_COLORS[suit],
    symbol: SUIT_SYMBOLS[suit]
  };
}

/**
 * Creates one standard 52-card deck.
 */
export function createStandardDeck(deckNumber = 0) {
  const deck = [];
  let index = 0;

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(rank, suit, deckNumber, index));
      index++;
    }
  }

  return deck;
}

/**
 * Creates multiple combined standard decks.
 * Example:
 * createDeck(1) => 52 cards
 * createDeck(2) => 104 cards
 */
export function createDeck(numberOfDecks = 1) {
  if (!Number.isInteger(numberOfDecks) || numberOfDecks < 1) {
    throw new Error("numberOfDecks must be an integer of 1 or more");
  }

  const deck = [];

  for (let i = 0; i < numberOfDecks; i++) {
    deck.push(...createStandardDeck(i));
  }

  return deck;
}

/**
 * Fisher-Yates shuffle.
 * Returns a new shuffled array without mutating the original.
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Draws one card from the top of a deck.
 * Assumes the top card is at the end of the array.
 */
export function drawCard(deck) {
  if (!Array.isArray(deck)) {
    throw new Error("deck must be an array");
  }

  if (deck.length === 0) {
    return { card: null, deck: [] };
  }

  const newDeck = [...deck];
  const card = newDeck.pop();

  return { card, deck: newDeck };
}

/**
 * Draw multiple cards.
 */
export function drawCards(deck, count = 1) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be an integer of 1 or more");
  }

  const newDeck = [...deck];
  const cards = [];

  for (let i = 0; i < count; i++) {
    if (newDeck.length === 0) break;
    cards.push(newDeck.pop());
  }

  return { cards, deck: newDeck };
}

/**
 * Returns a readable label, useful for logs/debugging.
 */
export function getCardLabel(card) {
  return `${card.rank}${card.symbol}`;
}

/**
 * Useful later when swapping to sprite decks.
 * Example output:
 * classic/10_of_diamonds.png
 */
export function getCardAssetName(card) {
  const rankName = normalizeRankForAsset(card.rank);
  return `${rankName}_of_${card.suit}.png`;
}

/**
 * Back image path helper for themed decks.
 */
export function getBackAssetName() {
  return "back.png";
}

function normalizeRankForAsset(rank) {
  switch (rank) {
    case "A":
      return "ace";
    case "K":
      return "king";
    case "Q":
      return "queen";
    case "J":
      return "jack";
    default:
      return rank;
  }
}