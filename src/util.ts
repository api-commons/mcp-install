export function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function copyText(text: string, button?: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    if (button) {
      const prior = button.textContent;
      button.textContent = 'Copied ✓';
      setTimeout(() => (button.textContent = prior), 1500);
    }
  } catch {
    /* clipboard unavailable — the text is visible to select manually */
  }
}

// Wire every [data-copy] button inside root to copy its target <pre>/value.
export function wireCopyButtons(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sel = btn.getAttribute('data-copy')!;
      const target = sel.startsWith('#') ? root.querySelector(sel) : null;
      const text = target?.textContent ?? sel;
      void copyText(text, btn);
    });
  });
}
