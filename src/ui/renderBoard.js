// ui/renderBoard.js

import { renderCard } from "./renderCard.js";

export function renderBoard(gameState, rootEl) {
  if (!rootEl) {
    throw new Error("rootEl is required");
  }

  rootEl.innerHTML = "";

  const appEl = document.createElement("div");
  appEl.className = "game-shell";

  const headerEl = renderHeader(gameState);
  const tableEl = renderTable(gameState);
  const currentPlayerEl = renderCurrentPlayerArea(gameState);
  const controlsEl = renderControls(gameState);

  appEl.appendChild(headerEl);
  appEl.appendChild(tableEl);
  appEl.appendChild(currentPlayerEl);
  appEl.appendChild(controlsEl);

  rootEl.appendChild(appEl);
}

function renderHeader(gameState) {
  const header = document.createElement("div");
  header.className = "game-header";

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  header.innerHTML = `
    <div class="header-box">Turn: ${gameState.turn}</div>
    <div class="header-box">Current Player: ${currentPlayer.name}</div>
    <div class="header-box">Draw Pile: ${gameState.drawPile.length}</div>
    <div class="header-box">Play Pile: ${gameState.playPile.length}</div>
    <div class="header-box">Burn Pile: ${gameState.burnPile.length}</div>
  `;

  return header;
}

function renderTable(gameState) {
  const table = document.createElement("div");
  table.className = "table-area";

  const drawPileEl = document.createElement("div");
  drawPileEl.className = "pile-block";

  drawPileEl.innerHTML = `
    <div class="pile-label">Draw Pile</div>
    <div class="pile-slot"></div>
  `;

  if (gameState.drawPile.length > 0) {
    const pileSlot = drawPileEl.querySelector(".pile-slot");
    pileSlot.appendChild(renderCard(null, { faceDown: true }));
  }

  const playPileEl = document.createElement("div");
  playPileEl.className = "pile-block";

  playPileEl.innerHTML = `
    <div class="pile-label">Play Pile</div>
    <div class="pile-slot"></div>
  `;

  const playSlot = playPileEl.querySelector(".pile-slot");
  const topCard = gameState.playPile[gameState.playPile.length - 1];

  if (topCard) {
    playSlot.appendChild(renderCard(topCard));
  }

  table.appendChild(drawPileEl);
  table.appendChild(playPileEl);

  return table;
}

function renderCurrentPlayerArea(gameState) {
  const player = gameState.players[gameState.currentPlayerIndex];
  const selectedIds = new Set(gameState.selectedCardIds || []);

  const isUsingHand = player.hand.length > 0;
  const isUsingFaceUp = player.hand.length === 0 && player.faceUp.length > 0;
  const isUsingFaceDown =
    player.hand.length === 0 &&
    player.faceUp.length === 0 &&
    player.faceDown.length > 0;

  const wrapper = document.createElement("div");
  wrapper.className = "current-player-area";

  const title = document.createElement("h2");
  title.className = "player-title";
  title.textContent = player.name;
  wrapper.appendChild(title);

  const stacksRow = document.createElement("div");
  stacksRow.className = "table-cards";

  for (let i = 0; i < 3; i++) {
    const stack = document.createElement("div");
    stack.className = "stack";

    const faceDownCard = player.faceDown[i];
    const faceUpCard = player.faceUp[i];

    // Face-down only
    if (faceDownCard && !faceUpCard) {
      const blindCardEl = renderCard(faceDownCard, {
        faceDown: true,
        selectable: isUsingFaceDown,
        selected: selectedIds.has(faceDownCard.id),
        cssClass: "stack-single"
      });

      stack.appendChild(blindCardEl);
    }

    // Both face-down and face-up
    if (faceDownCard && faceUpCard) {
      const backEl = renderCard(faceDownCard, {
        faceDown: true,
        selectable: false,
        cssClass: "stack-back"
      });
      stack.appendChild(backEl);

      const frontEl = renderCard(faceUpCard, {
        selectable: isUsingFaceUp,
        selected: selectedIds.has(faceUpCard.id),
        cssClass: "stack-front"
      });
      stack.appendChild(frontEl);
    }

    stacksRow.appendChild(stack);
  }

  wrapper.appendChild(stacksRow);

  const handArea = document.createElement("div");
  handArea.className = "hand-area";

  player.hand.forEach((card, index) => {
    const cardEl = renderCard(card, {
      selectable: isUsingHand,
      selected: selectedIds.has(card.id),
      cssClass: "hand-card"
    });

    positionHandCard(cardEl, index, player.hand.length);
    handArea.appendChild(cardEl);
  });

  if (isUsingFaceDown) {
    const blindLabel = document.createElement("div");
    blindLabel.className = "blind-play-label";
    blindLabel.textContent = "Click a face-down card to reveal and play it";
    wrapper.appendChild(blindLabel);
  }

  wrapper.appendChild(handArea);

  return wrapper;
}

function renderControls(gameState) {
  const player = gameState.players[gameState.currentPlayerIndex];
  const isUsingFaceDown =
    player.hand.length === 0 &&
    player.faceUp.length === 0 &&
    player.faceDown.length > 0;

  const controls = document.createElement("div");
  controls.className = "controls";

  controls.innerHTML = `
    <button id="play-selected-btn" ${isUsingFaceDown ? "disabled" : ""}>Play Selected</button>
    <button id="pickup-pile-btn">Pick Up Pile</button>
    <button id="sort-hand-btn">Sort Hand</button>
  `;

  return controls;
}

function positionHandCard(cardEl, index, total) {
  const spread = 80;
  const center = (total - 1) / 2;
  const offset = index - center;

  const left = 220 + offset * spread;
  const top = Math.abs(offset) * 18;
  const rotate = offset * 10;

  cardEl.style.left = `${left}px`;
  cardEl.style.top = `${top}px`;
  cardEl.style.transform = `rotate(${rotate}deg)`;
}