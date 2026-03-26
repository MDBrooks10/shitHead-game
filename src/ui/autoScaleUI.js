// ui/autoScaleUI.js

export function autoScaleUI() {
  const shell = document.querySelector(".game-shell");
  if (!shell) return;

  shell.style.transform = "scale(1)";

  const rect = shell.getBoundingClientRect();
  const availableWidth = window.innerWidth;
  const availableHeight = window.innerHeight;

  const scaleX = availableWidth / rect.width;
  const scaleY = availableHeight / rect.height;

  const scale = Math.min(scaleX, scaleY, 1) * 0.95;

  shell.style.transform = `scale(${scale})`;
}