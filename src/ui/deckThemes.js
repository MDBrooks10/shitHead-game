// ui/deckThemes.js

export const DECK_THEMES = {
  text: {
    id: "text",
    name: "Text Deck"
  }
};

let activeTheme = DECK_THEMES.text.id;

export function getActiveTheme() {
  return activeTheme;
}

export function setActiveTheme(themeId) {
  activeTheme = themeId;
}