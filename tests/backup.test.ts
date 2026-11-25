import { describe, expect, it } from 'vitest';
import { createSampleAppState } from '../src/utils/seedData';
import { createBackupPayload, parseAndValidateBackup } from '../src/utils/backup';

describe('JSON backup serializer and validator', () => {
  it('round-trips a valid app state cleanly', () => {
    const sample = createSampleAppState(1_732_500_000_000);
    const json = createBackupPayload(sample);
    const parsed = parseAndValidateBackup(json);

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.summary).toEqual({
        goals: sample.goals.length,
        tasks: sample.tasks.length,
        sessions: sample.sessions.length,
      });
      expect(parsed.state.schemaVersion).toBe(1);
      expect(parsed.state.tasks[0].title).toBe(sample.tasks[0].title);
    }
  });

  it('rejects malformed JSON, unsupported schemaVersion, invalid dates, and negative durations', () => {
    expect(parseAndValidateBackup('{broken').ok).toBe(false);

    const wrongVersion = JSON.stringify({
      schemaVersion: 2,
      data: { schemaVersion: 2, goals: [], tasks: [], sessions: [] },
    });
    const wrongVerRes = parseAndValidateBackup(wrongVersion);
    expect(wrongVerRes.ok).toBe(false);

    const sample = createSampleAppState();
    const badDate = JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        ...sample,
        tasks: [{ ...sample.tasks[0], date: '2026-13-45' }],
      },
    });
    expect(parseAndValidateBackup(badDate).ok).toBe(false);

    const negDuration = JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        ...sample,
        sessions: [{ ...sample.sessions[0], durationMinutes: -10 }],
      },
    });
    expect(parseAndValidateBackup(negDuration).ok).toBe(false);
  });
});
