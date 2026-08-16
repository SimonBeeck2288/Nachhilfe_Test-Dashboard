/**
 * Utility function to focus an HTML input or textarea element and position the cursor at the end of the text.
 * Uses requestAnimationFrame (with setTimeout fallback) to ensure execution occurs cleanly after React rendering cycles.
 *
 * @param element HTMLInputElement or HTMLTextAreaElement to focus
 */
export function focusAndPlaceCursorAtEnd(element: HTMLInputElement | HTMLTextAreaElement | null): void {
  if (!element) return;

  const performFocus = () => {
    try {
      element.focus();
      const val = element.value;
      if (typeof val === 'string' && typeof element.setSelectionRange === 'function') {
        const len = val.length;
        try {
          element.setSelectionRange(len, len);
        } catch {
          // Some HTML5 input types (e.g. number/email) throw on setSelectionRange
        }
      }
    } catch {
      // Safe fallback if element is not focusable or detached from DOM
    }
  };

  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      performFocus();
    });
  } else {
    setTimeout(performFocus, 0);
  }
}
