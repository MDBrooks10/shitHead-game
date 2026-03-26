// gameSetup.js

import { createDeck, shuffleDeck, drawCards } from "../cards/deck.js";
import {
  createGameState,
  setDrawPile,
  startGame,
  updatePlayer,
  refreshAllPlayerPhases,
  addLogEntry
} from "./gameState.js";

const STARTING_HAND_SIZE = 5;
const STARTING_FACE_UP_SIZE = 3;
const STARTING_FACE_DOWN_SIZE = 3;

/**
 * Shithead setup rules:
 * 2–4 players: 1 deck
 * 5–8 players: 2 decks
 */
export function getDeckCountForPlayerCount(playerCount) {
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 8) {
    throw new Error("playerCount must be an integer between 2 and 8");
  }

  return playerCount <= 4 ? 1 : 2;
}

/**
 * Creates, shuffles, and deals a new game.
 */
export function setupNewGame(playerCount) {
  const gameState = createGameState(playerCount);
  return setupGame(gameState);
}

/**
 * Takes an existing empty/new gameState and deals cards into it.
 */
export function setupGame(gameState) {
  validateGameState(gameState);

  const playerCount = gameState.players.length;
  const deckCount = getDeckCountForPlayerCount(playerCount);

  let deck = createDeck(deckCount);
  deck = shuffleDeck(deck);

  let workingState = {
    ...gameState,
    drawPile: [],
    playPile: [],
    burnPile: [],
    currentPlayerIndex: 0,
    selectedCardIds: [],
    winnerId: null,
    turn: 1,
    log: []
  };

  // Deal 3 face-down to each player
  ({ gameState: workingState, deck } = dealCardsToAllPlayers(
    workingState,
    deck,
    "faceDown",
    STARTING_FACE_DOWN_SIZE
  ));

  // Deal 3 face-up to each player
  ({ gameState: workingState, deck } = dealCardsToAllPlayers(
    workingState,
    deck,
    "faceUp",
    STARTING_FACE_UP_SIZE
  ));

  // Deal 5 in hand to each player
  ({ gameState: workingState, deck } = dealCardsToAllPlayers(
    workingState,
    deck,
    "hand",
    STARTING_HAND_SIZE
  ));

  workingState = setDrawPile(workingState, deck);
  workingState = refreshAllPlayerPhases(workingState);
  workingState = addLogEntry(
    workingState,
    `Game setup complete with ${playerCount} players using ${deckCount} deck(s).`
  );
  workingState = startGame(workingState);

  return workingState;
}

/**
 * Deals cards to every player into a specific zone.
 * zone must be one of: "faceDown", "faceUp", "hand"
 */
export function dealCardsToAllPlayers(gameState, deck, zone, count) {
  validateGameState(gameState);
  validateZone(zone);

  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be an integer of 1 or more");
  }

  let workingState = gameState;
  let workingDeck = [...deck];

  for (const player of workingState.players) {
    const result = drawCards(workingDeck, count);
    const drawnCards = result.cards;
    workingDeck = result.deck;

    const updatedPlayer = {
      ...player,
      [zone]: [...player[zone], ...drawnCards]
    };

    workingState = updatePlayer(workingState, updatedPlayer);
  }

  return {
    gameState: workingState,
    deck: workingDeck
  };
}

/**
 * Useful debug helper.
 */
export function summarizeSetup(gameState) {
  validateGameState(gameState);

  return gameState.players.map((player) => ({
    id: player.id,
    name: player.name,
    hand: player.hand.length,
    faceUp: player.faceUp.length,
    faceDown: player.faceDown.length
  }));
}

function validateZone(zone) {
  const validZones = ["faceDown", "faceUp", "hand"];
  if (!validZones.includes(zone)) {
    throw new Error(`Invalid zone: ${zone}`);
  }
}

function validateGameState(gameState) {
  if (!gameState || !Array.isArray(gameState.players)) {
    throw new Error("Invalid gameState");
  }
}