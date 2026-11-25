import { describe, expect, it } from 'vitest';
import {
  addDays,
  diffDays,
  formatChineseDate,
  isValidDateKey,
  toLocalDateKey,
} from '../src/utils/date';

describe('date utilities', () => {
  it('formats local date without UTC off-by-one drift around midnight', () => {
    const justAfterMidnight = new Date(2026, 10, 24, 0, 5, 0);
    const lateNight = new Date(2026, 10, 24, 23, 55, 0);
    expect(toLocalDateKey(justAfterMidnight)).toBe('2026-11-24');
    expect(toLocalDateKey(lateNight)).toBe('2026-11-24');
  });

  it('adds and subtracts days accurately across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('computes calendar day differences', () => {
    expect(diffDays('2026-12-30', '2027-01-02')).toBe(3);
    expect(diffDays('2026-11-24', '2026-11-24')).toBe(0);
    expect(diffDays('2026-11-25', '2026-11-24')).toBe(-1);
  });

  it('validates YYYY-MM-DD calendar strings strictly', () => {
    expect(isValidDateKey('2026-11-24')).toBe(true);
    expect(isValidDateKey('2026-02-29')).toBe(false);
    expect(isValidDateKey('2026-13-01')).toBe(false);
    expect(isValidDateKey('2026-11-31')).toBe(false);
    expect(isValidDateKey('not-a-date')).toBe(false);
  });

  it('formats readable Chinese date labels', () => {
    expect(formatChineseDate('2026-11-24')).toBe('2026年11月24日');
  });
});
