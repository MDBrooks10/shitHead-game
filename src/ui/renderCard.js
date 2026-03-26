// ui/renderCard.js

export function renderCard(card, options = {}) {
  const {
    faceDown = false,
    selectable = false,
    selected = false,
    cssClass = ""
  } = options;

  const cardEl = document.createElement("div");
  cardEl.className = `card ${faceDown ? "back" : "front"} ${cssClass}`.trim();

  if (!faceDown && card?.color) {
    cardEl.classList.add(card.color);
  }

  if (selectable) {
    cardEl.classList.add("selectable");
  }

  if (selected) {
    cardEl.classList.add("selected");
  }

  if (card?.id) {
    cardEl.dataset.cardId = card.id;
    cardEl.dataset.rank = card.rank;
    cardEl.dataset.suit = card.suit;
  }

  if (faceDown) {
    cardEl.innerHTML = `<div class="card-back-pattern"></div>`;
    return cardEl;
  }

  cardEl.innerHTML = `
    <div class="corner top-left">
      <div class="rank">${card.rank}</div>
      <div class="suit">${card.symbol}</div>
    </div>

    <div class="card-center">
      <div class="card-center-rank">${card.rank}</div>
      <div class="card-center-suit">${card.symbol}</div>
    </div>

    <div class="corner bottom-right">
      <div class="rank">${card.rank}</div>
      <div class="suit">${card.symbol}</div>
    </div>
  `;

  return cardEl;
}