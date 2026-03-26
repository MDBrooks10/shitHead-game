// main.js

import { setupNewGame } from "./game/gameSetup.js";
import { getCurrentPlayer } from "./game/gameState.js";
import { renderBoard } from "./ui/renderBoard.js";
import { attachInputHandlers } from "./ui/inputHandlers.js";
import { autoScaleUI } from "./ui/autoScaleUI.js";
import { performCpuTurn } from "./ai/aiPlayer.js";

const rootEl = document.getElementById("app");

let gameState = setupNewGame(2);
let cpuTurnInProgress = false;

gameState = configurePlayers(gameState);

function configurePlayers(state) {
  return {
    ...state,
    players: state.players.map((player, index) => ({
      ...player,
      name: index === 0 ? "You" : `CPU ${index}`,
      isCpu: index !== 0
    }))
  };
}

function getGameState() {
  return gameState;
}

function setGameState(nextState) {
  gameState = nextState;
}

function rerender() {
  renderBoard(gameState, rootEl);
  autoScaleUI();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCpuTurns() {
  if (cpuTurnInProgress) return;
  cpuTurnInProgress = true;

  try {
    while (!gameState.gameOver) {
      const currentPlayer = getCurrentPlayer(gameState);

      if (!currentPlayer?.isCpu) {
        break;
      }

      await sleep(700);

      const result = performCpuTurn(gameState);

      if (!result.success) {
        break;
      }

      setGameState(result.gameState);
      rerender();

      if (result.action === "game_over" && result.loserName) {
        alert(`${result.loserName} is the shithead!`);
        break;
      }
    }
  } finally {
    cpuTurnInProgress = false;
  }
}

function handleStateChange() {
  runCpuTurns();
}

rerender();

attachInputHandlers(rootEl, getGameState, setGameState, handleStateChange);

window.addEventListener("resize", autoScaleUI);

runCpuTurns();