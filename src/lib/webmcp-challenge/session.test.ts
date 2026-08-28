import { describe, expect, it } from 'vitest';
import { createInitialChallengeState } from './lifecycle';
import {
  createChallengeSession,
  signChallengeState,
  verifyChallengeSession,
  verifyChallengeState,
} from './session';

describe('WebMCP Challenge signed session boundary', () => {
  it('accepts state only for the session that issued it', () => {
    const first = createChallengeSession(1_000);
    const second = createChallengeSession(1_000);
    const stateToken = signChallengeState(createInitialChallengeState(first.session.id));

    expect(verifyChallengeState(stateToken, first.session)?.sessionId).toBe(first.session.id);
    expect(verifyChallengeState(stateToken, second.session)).toBeNull();
    expect(verifyChallengeState(`${stateToken.slice(0, -1)}x`, first.session)).toBeNull();
  });

  it('rejects tampered and expired session tokens', () => {
    const issued = createChallengeSession(1_000);
    const tampered = `${issued.token.slice(0, -1)}x`;

    expect(verifyChallengeSession(tampered, 2_000)).toBeNull();
    expect(verifyChallengeSession(issued.token, 1_000 + 2 * 60 * 60 * 1_000 + 1)).toBeNull();
  });
});
