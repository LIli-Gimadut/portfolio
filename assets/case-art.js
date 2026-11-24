const caseCards = document.querySelectorAll('.case-grid .character-left');

function fitCaseArt(card) {
  const bounds = card.getBoundingClientRect();
  const art = getComputedStyle(card, '::after');
  const edge = bounds.left + parseFloat(art.left);
  const bottom = bounds.bottom - parseFloat(art.bottom);
  const clearance = 6;
  let size = Math.min(bounds.width * .29, 224);
  const text = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
  const range = document.createRange();

  while (text.nextNode()) {
    if (!text.currentNode.textContent.trim()) continue;
    range.selectNodeContents(text.currentNode);

    // The illustration can clear each line alongside it or below it.
    for (const line of range.getClientRects()) {
      const room = Math.max(line.left - edge, bottom - line.bottom) - clearance;
      size = Math.min(size, room);
    }
  }

  card.style.setProperty('--character-size', `${Math.max(0, Math.floor(size))}px`);
}

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) fitCaseArt(entry.target);
});

for (const card of caseCards) observer.observe(card);
document.fonts.ready.then(() => caseCards.forEach(fitCaseArt));
