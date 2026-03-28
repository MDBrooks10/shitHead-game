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

    if (faceDownCard && !faceUpCard) {
      const blindCardEl = renderCard(faceDownCard, {
        faceDown: true,
        selectable: isUsingFaceDown,
        selected: selectedIds.has(faceDownCard.id),
        cssClass: "stack-single"
      });

      stack.appendChild(blindCardEl);
    }

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

  const sortedHand = sortHandForDisplay(player.hand);
  const handPositions = getHandPositions(sortedHand);

  sortedHand.forEach((card, index) => {
    const cardEl = renderCard(card, {
      selectable: isUsingHand,
      selected: selectedIds.has(card.id),
      cssClass: "hand-card"
    });

    positionHandCard(cardEl, handPositions[index], index, sortedHand.length);
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
  `;

  return controls;
}

function sortHandForDisplay(hand) {
  return [...hand].sort((a, b) => {
    const rankDiff = getRankSortValue(a.rank) - getRankSortValue(b.rank);
    if (rankDiff !== 0) return rankDiff;
    return a.suit.localeCompare(b.suit);
  });
}

function getRankSortValue(rank) {
  const values = {
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
    "2": 15
  };

  return values[rank] ?? 99;
}

function getHandPositions(sortedHand) {
  const cardWidth = 100;
  const handWidth = 1200;

  const positions = [];
  let x = 0;

  for (let i = 0; i < sortedHand.length; i++) {
    positions.push(x);

    if (i < sortedHand.length - 1) {
      const current = sortedHand[i];
      const next = sortedHand[i + 1];

      const largeHand = sortedHand.length >= 10;
      const hugeHand = sortedHand.length >= 14;

      let normalGap = 42;
      let sameRankGap = 22;

      if (largeHand) {
        normalGap = 36;
        sameRankGap = 18;
      }

      if (hugeHand) {
        normalGap = 30;
        sameRankGap = 14;
      }

      x += current.rank === next.rank ? sameRankGap : normalGap;
    }
  }

  const totalWidth =
    positions.length > 0
      ? positions[positions.length - 1] + cardWidth
      : cardWidth;

  const startX = (handWidth - totalWidth) / 2;

  return positions.map((pos) => pos + startX);
}

function positionHandCard(cardEl, left, index, total) {
  const center = (total - 1) / 2;
  const offset = index - center;
  const distanceFromCenter = Math.abs(offset);

  let curveStrength = 8;
  let maxRotate = 4.5;

  if (total <= 5) {
    curveStrength = 12;
    maxRotate = 7;
  } else if (total <= 8) {
    curveStrength = 9;
    maxRotate = 5.5;
  } else if (total <= 12) {
    curveStrength = 6;
    maxRotate = 3.5;
  } else {
    curveStrength = 4;
    maxRotate = 2.2;
  }

  const top = distanceFromCenter * curveStrength;
  const rotate = offset * maxRotate;

  cardEl.style.left = `${left}px`;
  cardEl.style.top = `${top}px`;

  cardEl.style.setProperty("--card-rotate", `${rotate}deg`);
  cardEl.style.transform = `rotate(var(--card-rotate))`;

  cardEl.style.zIndex = `${index}`;
}