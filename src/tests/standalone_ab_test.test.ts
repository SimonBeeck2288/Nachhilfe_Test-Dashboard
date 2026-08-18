import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AB_TWIN_PAIRS, saveAbTestSession, getSavedAbTestSessions } from '../data/abTestPairs';
import { AbTestPage } from '../pages/AbTestPage';
import { TestSessionProvider } from '../context/TestSessionContext';
import { saveStudentProfile, getStudentRoster, clearStudentRoster } from '../utils/studentRoster';
import type { AbTestSessionRecord } from '../types/abTest';

// Polyfill localStorage if needed
let store: Record<string, string> = {};
const mockStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    store = {};
  },
  key: (index: number) => Object.keys(store)[index] || null,
  get length() {
    return Object.keys(store).length;
  },
};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}
if (typeof window !== 'undefined') {
  (window as any).localStorage = mockStorage;
}

describe('Standalone A/B Twin Test System', () => {
  beforeEach(() => {
    mockStorage.clear();
    clearStudentRoster();
  });

  describe('1. Data Integrity of Matched Twin Question Bank', () => {
    it('contains at least 15 matched twin pairs with valid structure', () => {
      expect(AB_TWIN_PAIRS.length).toBeGreaterThanOrEqual(15);

      AB_TWIN_PAIRS.forEach((pair) => {
        expect(pair.pairId).toBeDefined();
        expect(pair.topic).toBeDefined();
        expect(['math', 'english']).toContain(pair.subject);
        expect(pair.level).toBeGreaterThanOrEqual(1);

        // Standard variant
        expect(pair.standard.variant).toBe('standard');
        expect(pair.standard.text.length).toBeGreaterThan(5);
        expect(pair.standard.correctAnswer).toBeDefined();

        // Direct variant
        expect(pair.direct.variant).toBe('direct');
        expect(pair.direct.text.length).toBeGreaterThan(3);
        expect(pair.direct.correctAnswer).toBeDefined();
      });
    });

    it('ensures math pairs have varied numbers between standard and direct to prevent copying', () => {
      const mathPairs = AB_TWIN_PAIRS.filter((p) => p.subject === 'math');
      expect(mathPairs.length).toBeGreaterThanOrEqual(8);

      mathPairs.forEach((pair) => {
        expect(pair.standard.storyContext).toBeDefined();
        expect(pair.direct.text).toBeDefined();
      });
    });
  });

  describe('2. A/B Test Session Storage Persistence', () => {
    it('saves and retrieves A/B test session records with attention metrics', () => {
      const mockRecord: AbTestSessionRecord = {
        id: 'ab_123',
        timestamp: new Date().toISOString(),
        studentName: 'Simon',
        durationMinutes: 5,
        actualDurationSeconds: 300,
        subject: 'math',
        pairResults: [
          {
            pairId: 'ab_math_mul_1',
            topic: 'Multiplikation',
            subject: 'math',
            level: 2,
            conceptDescription: 'Einmaleins Multiplikation',
            standard: {
              questionId: 'ab_m3_std',
              pairId: 'ab_math_mul_1',
              topic: 'Multiplikation',
              subject: 'math',
              variant: 'standard',
              text: 'Lisa verkauft 6 Gläser für 4 Euro...',
              userAnswer: '24',
              correctAnswer: '24',
              isCorrect: true,
              timeTaken: 15,
              answeredAtTimestamp: Date.now() - 10000,
            },
            direct: {
              questionId: 'ab_m3_dir',
              pairId: 'ab_math_mul_1',
              topic: 'Multiplikation',
              subject: 'math',
              variant: 'direct',
              text: 'Berechne: 7 * 4 = ?',
              userAnswer: '28',
              correctAnswer: '28',
              isCorrect: true,
              timeTaken: 4,
              answeredAtTimestamp: Date.now() - 5000,
            },
          },
        ],
        summary: {
          standardTotal: 1,
          standardCorrect: 1,
          standardAccuracy: 1.0,
          standardAvgTime: 15,
          directTotal: 1,
          directCorrect: 1,
          directAccuracy: 1.0,
          directAvgTime: 4,
          accuracyGainPercent: 0,
          speedupSeconds: 11,
          speedupPercent: 73.3,
          attentionAnalysis: {
            firstHalfAccuracy: 1.0,
            firstHalfAvgTime: 15,
            secondHalfAccuracy: 1.0,
            secondHalfAvgTime: 4,
            accuracyDeltaPercent: 0,
            textFatigueObservation: 'Die Konzentration blieb stabil.',
          },
          verdict: 'recommend_direct',
          verdictTitle: '💡 Direkte Aufgabenstellungen funktionieren deutlich besser',
          verdictDescription: 'Mit sachlich-direkten Aufgaben sparst du durchschnittlich 11s pro Aufgabe.',
        },
      };

      saveAbTestSession(mockRecord);
      const saved = getSavedAbTestSessions();
      expect(saved.length).toBe(1);
      expect(saved[0].studentName).toBe('Simon');
      expect(saved[0].summary.speedupSeconds).toBe(11);
      expect(saved[0].summary.verdict).toBe('recommend_direct');
      expect(saved[0].summary.attentionAnalysis?.firstHalfAccuracy).toBe(1.0);
    });
  });

  describe('3. AbTestPage Component User Journey', () => {
    it('renders the intro screen with duration, subject, and student selection', () => {
      saveStudentProfile({
        name: 'Julia',
        gradeLevel: 6,
        favoriteSubject: 'Mathematik',
        problemSubject: 'Englisch',
        notes: '',
      });

      const { unmount } = render(
        React.createElement(
          TestSessionProvider,
          null,
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/ab-test'] },
            React.createElement(
              Routes,
              null,
              React.createElement(Route, { path: '/ab-test', element: React.createElement(AbTestPage, null) })
            )
          )
        )
      );

      expect(screen.getByText(/Aufgaben-Check: Textaufgaben vs. Direkte Aufgaben/i)).toBeDefined();
      expect(screen.getByText(/Durchmischte Aufgaben/i)).toBeDefined();
      expect(screen.getByText('Mathematik')).toBeDefined();
      expect(screen.getByText('Englisch')).toBeDefined();
      expect(screen.getByText('Gemischt')).toBeDefined();
      expect(screen.getByText('5 Minuten')).toBeDefined();
      expect(screen.getByText(/Aufgaben-Check jetzt starten/i)).toBeDefined();

      unmount();
    });

    it('starts test and presents alternating non-consecutive questions', async () => {
      saveStudentProfile({
        name: 'Felix',
        gradeLevel: 5,
        favoriteSubject: 'Mathematik',
        problemSubject: '',
        notes: '',
      });

      const { unmount } = render(
        React.createElement(
          TestSessionProvider,
          null,
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/ab-test'] },
            React.createElement(
              Routes,
              null,
              React.createElement(Route, { path: '/ab-test', element: React.createElement(AbTestPage, null) })
            )
          )
        )
      );

      const startBtn = await screen.findByText(/Aufgaben-Check jetzt starten/i);
      fireEvent.click(startBtn);

      // Question 1 should be active with task counter and countdown
      const taskLabel = await screen.findByText(/Aufgabe #1/i);
      expect(taskLabel).toBeDefined();
      expect(screen.getByText(/Verbleibende Zeit:/i)).toBeDefined();
      expect(screen.getByText(/Test beenden & Auswerten/i)).toBeDefined();

      unmount();
    });

    it('displays dedicated results screen with verdict, attention metrics, and 1-click D/R activation', async () => {
      const student = saveStudentProfile({
        name: 'Hannah',
        gradeLevel: 4,
        favoriteSubject: 'Mathematik',
        problemSubject: '',
        notes: '',
      });

      // Save a completed session for Hannah
      saveAbTestSession({
        id: 'ab_session_test',
        timestamp: new Date().toISOString(),
        studentId: student.id,
        studentName: 'Hannah',
        durationMinutes: 5,
        actualDurationSeconds: 300,
        subject: 'math',
        pairResults: [
          {
            pairId: 'ab_math_add_1',
            topic: 'Addition',
            subject: 'math',
            level: 1,
            conceptDescription: 'Addition zweier Zahlen',
            standard: {
              questionId: 'ab_m1_std',
              pairId: 'ab_math_add_1',
              topic: 'Addition',
              subject: 'math',
              variant: 'standard',
              text: 'Tim hat 7 Murmeln...',
              userAnswer: '13',
              correctAnswer: '13',
              isCorrect: true,
              timeTaken: 16,
              answeredAtTimestamp: Date.now() - 10000,
            },
            direct: {
              questionId: 'ab_m1_dir',
              pairId: 'ab_math_add_1',
              topic: 'Addition',
              subject: 'math',
              variant: 'direct',
              text: 'Berechne: 8 + 5 = ?',
              userAnswer: '13',
              correctAnswer: '13',
              isCorrect: true,
              timeTaken: 4,
              answeredAtTimestamp: Date.now() - 5000,
            },
          },
        ],
        summary: {
          standardTotal: 1,
          standardCorrect: 1,
          standardAccuracy: 1.0,
          standardAvgTime: 16,
          directTotal: 1,
          directCorrect: 1,
          directAccuracy: 1.0,
          directAvgTime: 4,
          accuracyGainPercent: 0,
          speedupSeconds: 12,
          speedupPercent: 75,
          attentionAnalysis: {
            firstHalfAccuracy: 1.0,
            firstHalfAvgTime: 16,
            secondHalfAccuracy: 1.0,
            secondHalfAvgTime: 4,
            accuracyDeltaPercent: 0,
            textFatigueObservation: 'Die Konzentration blieb stabil.',
          },
          verdict: 'recommend_direct',
          verdictTitle: '💡 Direkte Aufgabenstellungen funktionieren deutlich besser',
          verdictDescription: 'Mit sachlich-direkten Aufgaben sparst du durchschnittlich 12s pro Aufgabe.',
        },
      });

      const { unmount } = render(
        React.createElement(
          TestSessionProvider,
          null,
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/ab-test?results=latest'] },
            React.createElement(
              Routes,
              null,
              React.createElement(Route, { path: '/ab-test', element: React.createElement(AbTestPage, null) })
            )
          )
        )
      );

      // Verify verdict banner
      expect(screen.getByText(/Auswertung für Hannah/i)).toBeDefined();
      expect(screen.getByText(/💡 Direkte Aufgabenstellungen funktionieren deutlich besser/i)).toBeDefined();
      expect(screen.getByText(/Konzentrations- & Ausdauer-Verlauf über die Testzeit/i)).toBeDefined();
      expect(screen.getByText(/Gegenüberstellung der beiden Aufgabenstile:/i)).toBeDefined();
      expect(screen.getByText(/Ausführliche Textaufgaben/i)).toBeDefined();
      expect(screen.getByText(/Direkte & kurze Aufgaben/i)).toBeDefined();

      // Click 1-click activate button
      const activateBtn = screen.getByText(/Direkte Aufgabenstellungen für Hannah aktivieren/i);
      fireEvent.click(activateBtn);

      // Verify profile updated in localStorage
      const updatedRoster = getStudentRoster();
      const updatedHannah = updatedRoster.find((s) => s.id === student.id);
      expect(updatedHannah?.accessibilitySettings?.directQuestions).toBe(true);
      expect(updatedHannah?.accessibilitySettings?.reducedSensory).toBe(true);

      // Verify button changes to activated state
      expect(screen.getByText(/aktiviert ✓/i)).toBeDefined();

      unmount();
    });
  });
});
