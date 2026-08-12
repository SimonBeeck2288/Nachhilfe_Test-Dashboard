import { describe, it, expect } from 'vitest';
import { calculateSoftScore } from '../utils/evaluation';
import { ACCESSORIES, BADGES } from '../data/accessories';

describe('M3 Gamification & UX Utilities', () => {
  describe('calculateSoftScore', () => {
    it('returns 0 for incorrect answers', () => {
      expect(calculateSoftScore(false, 10, 30)).toBe(0);
    });

    it('returns full 100 points when answered within target time', () => {
      expect(calculateSoftScore(true, 15, 30)).toBe(100);
      expect(calculateSoftScore(true, 30, 30)).toBe(100);
    });

    it('decays points smoothly when target time is exceeded', () => {
      // 10s overtime -> 10 * 0.02 = 0.2 penalty -> 80 pts
      expect(calculateSoftScore(true, 40, 30)).toBe(80);
      // 20s overtime -> 20 * 0.02 = 0.4 penalty -> 60 pts
      expect(calculateSoftScore(true, 50, 30)).toBe(60);
    });

    it('caps point decay at 50% maximum penalty (min 50 pts)', () => {
      // 60s overtime -> max 50% penalty -> 50 pts
      expect(calculateSoftScore(true, 90, 30)).toBe(50);
    });
  });

  describe('Accessories & Badges Catalog', () => {
    it('contains valid hats, pets, and themes', () => {
      const hats = ACCESSORIES.filter((a) => a.category === 'hat');
      const pets = ACCESSORIES.filter((a) => a.category === 'pet');
      const themes = ACCESSORIES.filter((a) => a.category === 'theme');

      expect(hats.length).toBeGreaterThanOrEqual(4);
      expect(pets.length).toBeGreaterThanOrEqual(4);
      expect(themes.length).toBeGreaterThanOrEqual(4);
    });

    it('contains required achievement badges', () => {
      const badgeIds = BADGES.map((b) => b.id);
      expect(badgeIds).toContain('math_whiz');
      expect(badgeIds).toContain('fast_thinker');
      expect(badgeIds).toContain('streak_master');
      expect(badgeIds).toContain('vocab_master');
      expect(badgeIds).toContain('star_student');
    });
  });
});
