import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { focusAndPlaceCursorAtEnd } from '../utils/focusHelper';

describe('focusHelper: focusAndPlaceCursorAtEnd', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles null element safely without throwing errors', () => {
    expect(() => focusAndPlaceCursorAtEnd(null)).not.toThrow();
  });

  it('calls focus() on the provided input element', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'Test';
    document.body.appendChild(input);

    const focusSpy = vi.spyOn(input, 'focus');
    focusAndPlaceCursorAtEnd(input);

    vi.runAllTimers();

    expect(focusSpy).toHaveBeenCalledTimes(1);
    document.body.removeChild(input);
  });

  it('positions cursor at the end of the text via setSelectionRange', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'Guten Tag';
    document.body.appendChild(input);

    const setSelectionRangeSpy = vi.spyOn(input, 'setSelectionRange');
    focusAndPlaceCursorAtEnd(input);

    vi.runAllTimers();

    expect(setSelectionRangeSpy).toHaveBeenCalledWith(9, 9);
    document.body.removeChild(input);
  });

  it('handles empty input element placing cursor at index 0', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = '';
    document.body.appendChild(input);

    const setSelectionRangeSpy = vi.spyOn(input, 'setSelectionRange');
    focusAndPlaceCursorAtEnd(input);

    vi.runAllTimers();

    expect(setSelectionRangeSpy).toHaveBeenCalledWith(0, 0);
    document.body.removeChild(input);
  });

  it('handles inputs where setSelectionRange throws gracefully', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = '123';
    input.setSelectionRange = () => {
      throw new Error('Not supported on this input type');
    };
    document.body.appendChild(input);

    const focusSpy = vi.spyOn(input, 'focus');
    expect(() => {
      focusAndPlaceCursorAtEnd(input);
      vi.runAllTimers();
    }).not.toThrow();

    expect(focusSpy).toHaveBeenCalledTimes(1);
    document.body.removeChild(input);
  });
});
