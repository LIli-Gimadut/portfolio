const caseCards = document.querySelectorAll('.case-grid .case');

function wrapCornerText(card) {
  const paragraph = card.querySelector('.case-summary, dl > dd:last-child');
  paragraph.style.removeProperty('max-inline-size');
  const fullWidth = paragraph.clientWidth;
  const originalHeight = paragraph.clientHeight;
  let lower = Math.ceil(fullWidth * .7);
  let upper = fullWidth;

  // Find room beside the final paragraph while preserving its number of lines.
  while (upper - lower > 3) {
    const width = Math.floor((lower + upper) / 2);
    paragraph.style.maxInlineSize = `${width}px`;
    if (paragraph.clientHeight > originalHeight) lower = width + 1;
    else upper = width;
  }

  paragraph.style.maxInlineSize = `${upper}px`;
}

function fitCaseArt(card) {
  const alignLeft = card.classList.contains('character-left');
  if (!alignLeft) wrapCornerText(card);

  const bounds = card.getBoundingClientRect();
  const art = getComputedStyle(card, '::after');
  const edge = alignLeft ? bounds.left + parseFloat(art.left) : bounds.right - parseFloat(art.right);
  const bottom = bounds.bottom - parseFloat(art.bottom);
  const clearance = 6;
  let size = Math.min(bounds.width * .29, alignLeft ? 224 : 150);
  const text = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
  const range = document.createRange();

  while (text.nextNode()) {
    if (!text.currentNode.textContent.trim()) continue;
    range.selectNodeContents(text.currentNode);

    // The illustration can clear each line alongside it or below it.
    for (const line of range.getClientRects()) {
      const sideRoom = alignLeft ? line.left - edge : edge - line.right;
      const room = Math.max(sideRoom, bottom - line.bottom) - clearance;
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
