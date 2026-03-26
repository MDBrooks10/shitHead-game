// ai/aiPlayer.js

import { getCurrentPlayer } from "../game/gameState.js";
import { getLegalGroupedMoves, resolveMove, resolveNoLegalMove } from "../rules/rules.js";

export function performCpuTurn(gameState) {
  const player = getCurrentPlayer(gameState);

  if (!player || !player.isCpu || gameState.gameOver) {
    return {
      success: false,
      gameState,
      action: "idle"
    };
  }

  const legalMoves = getLegalGroupedMoves(gameState, player);

  if (legalMoves.length === 0) {
    return resolveNoLegalMove(gameState);
  }

  const chosenMove = chooseBestMove(legalMoves);

  return resolveMove(gameState, chosenMove);
}

function chooseBestMove(moves) {
  const scoredMoves = moves.map((move) => ({
    move,
    score: scoreMove(move)
  }));

  scoredMoves.sort((a, b) => a.score - b.score);

  return scoredMoves[0].move;
}

function scoreMove(move) {
  const firstCard = move[0];
  const rankScore = getRankScore(firstCard.rank);
  const groupBonus = move.length * 0.4;

  return rankScore - groupBonus;
}

function getRankScore(rank) {
  const rankOrder = {
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "8": 8,
    "9": 9,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14,
    "7": 20,
    "10": 21,
    "2": 22
  };

  return rankOrder[rank] ?? 999;
}