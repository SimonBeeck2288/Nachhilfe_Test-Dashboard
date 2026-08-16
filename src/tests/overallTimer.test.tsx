import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { OverallProgressBar } from '../components/OverallProgressBar';
import { ModuleTimeUpBanner } from '../components/ModuleTimeUpBanner';
import { TimeUpBanner } from '../components/TimeUpBanner';

describe('OverallProgressBar Component Tests', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with role="progressbar" and appropriate ARIA attributes', () => {
    render(<OverallProgressBar elapsedMs={150000} totalMs={300000} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeDefined();
    expect(bar.getAttribute('aria-label')).toBe('Gesamtfortschritt der Testzeit');
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('calculates progress accurately when progress prop is provided directly', () => {
    render(<OverallProgressBar progress={75} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('75');
  });

  it('clamps progress to 0% and 100% on out-of-range values', () => {
    const { rerender } = render(<OverallProgressBar elapsedMs={400000} totalMs={300000} />);
    let bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('100');

    rerender(<OverallProgressBar elapsedMs={-5000} totalMs={300000} />);
    bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('handles Infinity or 0 totalMs gracefully without errors or NaN', () => {
    const { rerender } = render(<OverallProgressBar elapsedMs={10000} totalMs={Infinity} />);
    let bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');

    rerender(<OverallProgressBar elapsedMs={10000} totalMs={0} />);
    bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('does NOT contain any visible number/digit text (discreet visual requirement)', () => {
    const { container } = render(<OverallProgressBar elapsedMs={150000} totalMs={300000} />);
    expect(container.textContent?.trim()).toBe('');
  });
});

describe('ModuleTimeUpBanner Component Tests', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders banner with default message and two action buttons', () => {
    const onFinishNow = vi.fn();
    const onFinishCurrentQuestion = vi.fn();

    render(
      <ModuleTimeUpBanner
        onFinishNow={onFinishNow}
        onFinishCurrentQuestion={onFinishCurrentQuestion}
      />
    );

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText(/Die Testzeit für dieses Modul ist abgelaufen/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Diese Frage noch fertig machen/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Jetzt beenden/i })).toBeDefined();
  });

  it('calls onFinishNow callback when "Jetzt beenden" is clicked', () => {
    const onFinishNow = vi.fn();
    render(<ModuleTimeUpBanner onFinishNow={onFinishNow} />);

    const finishBtn = screen.getByRole('button', { name: /Jetzt beenden/i });
    fireEvent.click(finishBtn);

    expect(onFinishNow).toHaveBeenCalledTimes(1);
  });

  it('calls onFinishCurrentQuestion callback when "Diese Frage noch fertig machen" is clicked', () => {
    const onFinishNow = vi.fn();
    const onFinishCurrentQuestion = vi.fn();

    render(
      <ModuleTimeUpBanner
        onFinishNow={onFinishNow}
        onFinishCurrentQuestion={onFinishCurrentQuestion}
      />
    );

    const finishCurrentBtn = screen.getByRole('button', { name: /Diese Frage noch fertig machen/i });
    fireEvent.click(finishCurrentBtn);

    expect(onFinishCurrentQuestion).toHaveBeenCalledTimes(1);
  });

  it('displays modified feedback message and hides "Diese Frage noch fertig machen" button when isFinishingCurrent is true', () => {
    const onFinishNow = vi.fn();
    const onFinishCurrentQuestion = vi.fn();

    render(
      <ModuleTimeUpBanner
        onFinishNow={onFinishNow}
        onFinishCurrentQuestion={onFinishCurrentQuestion}
        isFinishingCurrent={true}
      />
    );

    expect(screen.getByText(/Du beantwortest noch diese Frage/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Diese Frage noch fertig machen/i })).toBeNull();
    expect(screen.getByRole('button', { name: /Jetzt beenden/i })).toBeDefined();
  });
});

describe('TimeUpBanner Backward Compatibility Tests', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders classic recommendation pill when no onFinishNow prop is provided', () => {
    render(<TimeUpBanner />);
    expect(screen.getByText(/Richtzeit überschritten/i)).toBeDefined();
  });

  it('delegates to ModuleTimeUpBanner when onFinishNow prop is passed', () => {
    const onFinishNow = vi.fn();
    render(<TimeUpBanner onFinishNow={onFinishNow} />);
    expect(screen.getByRole('button', { name: /Jetzt beenden/i })).toBeDefined();
  });
});
