// ui/inputHandlers.js

import { renderBoard } from "./renderBoard.js";
import { resolveMove, resolveNoLegalMove } from "../rules/rules.js";
import { getCurrentPlayer } from "../game/gameState.js";
import { autoScaleUI } from "./autoScaleUI.js";

function rerender(rootEl, getGameState) {
  renderBoard(getGameState(), rootEl);
  autoScaleUI();
}

export function attachInputHandlers(
  rootEl,
  getGameState,
  setGameState,
  onStateChange = () => {}
) {
  rootEl.addEventListener("click", (event) => {
    const gameState = getGameState();
    const currentPlayer = getCurrentPlayer(gameState);

    if (gameState.gameOver) {
      return;
    }

    if (currentPlayer?.isCpu) {
      return;
    }

    const cardEl = event.target.closest(".card.selectable");
    if (cardEl) {
      handleCardClick(cardEl, rootEl, getGameState, setGameState, onStateChange);
      return;
    }

    if (event.target.id === "play-selected-btn") {
      handlePlaySelected(rootEl, getGameState, setGameState, onStateChange);
      return;
    }

    if (event.target.id === "pickup-pile-btn") {
      handlePickup(rootEl, getGameState, setGameState, onStateChange);
      return;
    }
  });
}

function handleCardClick(cardEl, rootEl, getGameState, setGameState, onStateChange) {
  const gameState = getGameState();
  const currentPlayer = getCurrentPlayer(gameState);
  const cardId = cardEl.dataset.cardId;

  const activeZone = getActiveZone(currentPlayer);

  if (activeZone === "faceDown") {
    const selectedCard = currentPlayer.faceDown.find((card) => card.id === cardId);
    if (!selectedCard) return;

    const result = resolveMove(gameState, [selectedCard]);

    if (!result.success) {
      alert(result.reason || "That move is not allowed.");
      return;
    }

    setGameState(result.gameState);
    rerender(rootEl, getGameState);
    onStateChange(result.gameState, result);

    if (result.action === "game_over" && result.loserName) {
      alert(`${result.loserName} is the shithead!`);
    }

    return;
  }

  const activeCards = getActiveCards(currentPlayer);
  const clickedCard = activeCards.find((card) => card.id === cardId);

  if (!clickedCard) {
    return;
  }

  let selected = [...(gameState.selectedCardIds || [])];
  const alreadySelected = selected.includes(cardId);

  if (alreadySelected) {
    selected = selected.filter((id) => id !== cardId);
  } else {
    if (selected.length === 0) {
      selected.push(cardId);
    } else {
      const firstSelected = activeCards.find((card) => card.id === selected[0]);

      if (firstSelected && firstSelected.rank === clickedCard.rank) {
        selected.push(cardId);
      } else {
        selected = [cardId];
      }
    }
  }

  const nextState = {
    ...gameState,
    selectedCardIds: selected
  };

  setGameState(nextState);
  rerender(rootEl, getGameState);
  onStateChange(nextState, { action: "select" });
}

function handlePlaySelected(rootEl, getGameState, setGameState, onStateChange) {
  const gameState = getGameState();
  const currentPlayer = getCurrentPlayer(gameState);
  const activeCards = getActiveCards(currentPlayer);

  const selectedCards = activeCards.filter((card) =>
    (gameState.selectedCardIds || []).includes(card.id)
  );

  if (selectedCards.length === 0) {
    return;
  }

  const result = resolveMove(gameState, selectedCards);

  if (!result.success) {
    alert(result.reason || "That move is not allowed.");
    return;
  }

  setGameState(result.gameState);
  rerender(rootEl, getGameState);
  onStateChange(result.gameState, result);

  if (result.action === "game_over" && result.loserName) {
    alert(`${result.loserName} is the shithead!`);
  }
}

function handlePickup(rootEl, getGameState, setGameState, onStateChange) {
  const gameState = getGameState();
  const result = resolveNoLegalMove(gameState);

  if (!result.success) {
    return;
  }

  setGameState(result.gameState);
  rerender(rootEl, getGameState);
  onStateChange(result.gameState, result);

  if (result.action === "game_over" && result.loserName) {
    alert(`${result.loserName} is the shithead!`);
  }
}

function getActiveZone(player) {
  if (player.hand.length > 0) return "hand";
  if (player.faceUp.length > 0) return "faceUp";
  if (player.faceDown.length > 0) return "faceDown";
  return "out";
}

function getActiveCards(player) {
  if (player.hand.length > 0) return player.hand;
  if (player.faceUp.length > 0) return player.faceUp;
  if (player.faceDown.length > 0) return player.faceDown;
  return [];
}