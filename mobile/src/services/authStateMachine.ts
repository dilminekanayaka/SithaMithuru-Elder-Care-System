/**
 * authStateMachine.ts — SithaMithuru Guardian Authentication Architecture v1.0
 *
 * Explicit Security State Machine (Replaces naive boolean `isLoggedIn` flags):
 *  • UNAUTHENTICATED: Fresh install or logged out
 *  • REGISTERING: User completing registration details
 *  • OTP_PENDING: Email / Phone OTP verification required
 *  • AUTHENTICATED: Tokens issued, role verified
 *  • PAIRING: First-time login requiring elder linkage
 *  • ACTIVE: Authenticated, paired, workspace ready
 *  • TOKEN_REFRESHING: Access token expired (15m), silent refresh in progress
 *  • OFFLINE_AUTHENTICATED: Offline startup with valid cached credentials
 *  • SESSION_EXPIRED: Refresh token expired (30d) or revoked
 *  • LOGGED_OUT: Session destroyed, keys cleared
 */

export type AuthStateType =
  | 'UNAUTHENTICATED'
  | 'REGISTERING'
  | 'OTP_PENDING'
  | 'AUTHENTICATED'
  | 'PAIRING'
  | 'ACTIVE'
  | 'TOKEN_REFRESHING'
  | 'OFFLINE_AUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'LOGGED_OUT';

export interface AuthState {
  currentState: AuthStateType;
  user: any | null;
  token: string | null;
  refreshToken: string | null;
  isOnline: boolean;
  biometricEnabled: boolean;
  deviceId: string | null;
  lastSyncAt: string | null;
}

const ALLOWED_TRANSITIONS: Record<AuthStateType, AuthStateType[]> = {
  UNAUTHENTICATED: ['REGISTERING', 'AUTHENTICATED', 'OFFLINE_AUTHENTICATED', 'OTP_PENDING'],
  REGISTERING: ['OTP_PENDING', 'UNAUTHENTICATED'],
  OTP_PENDING: ['AUTHENTICATED', 'PAIRING', 'UNAUTHENTICATED'],
  AUTHENTICATED: ['PAIRING', 'ACTIVE', 'TOKEN_REFRESHING', 'LOGGED_OUT'],
  PAIRING: ['ACTIVE', 'LOGGED_OUT'],
  ACTIVE: ['TOKEN_REFRESHING', 'OFFLINE_AUTHENTICATED', 'SESSION_EXPIRED', 'LOGGED_OUT'],
  TOKEN_REFRESHING: ['ACTIVE', 'SESSION_EXPIRED', 'LOGGED_OUT'],
  OFFLINE_AUTHENTICATED: ['ACTIVE', 'TOKEN_REFRESHING', 'SESSION_EXPIRED', 'LOGGED_OUT'],
  SESSION_EXPIRED: ['UNAUTHENTICATED', 'LOGGED_OUT'],
  LOGGED_OUT: ['UNAUTHENTICATED'],
};

/**
 * Validates whether a state machine transition is permitted under security rules.
 */
export const canTransition = (from: AuthStateType, to: AuthStateType): boolean => {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
};
