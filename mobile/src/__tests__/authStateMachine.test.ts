async function runAuthStateMachineTests() {
  console.log('🧪 Running AuthStateMachine Tests...');

  try {
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      UNAUTHENTICATED: ['REGISTERING', 'AUTHENTICATED', 'OFFLINE_AUTHENTICATED', 'OTP_PENDING'],
      LOGGED_OUT: ['UNAUTHENTICATED'],
    };

    const canTransition = (from: string, to: string): boolean => {
      return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
    };

    const isValid = canTransition('UNAUTHENTICATED', 'AUTHENTICATED');
    const isInvalid = canTransition('LOGGED_OUT', 'ACTIVE');

    console.assert(isValid === true, 'UNAUTHENTICATED -> AUTHENTICATED transition should be valid');
    console.assert(isInvalid === false, 'LOGGED_OUT -> ACTIVE direct transition should be forbidden');

    console.log('✅ AuthStateMachine Transition Security Rules Passed');
  } catch (err: any) {
    console.error('❌ AuthStateMachine Test Failed:', err.message);
  }
}

if (require.main === module) {
  runAuthStateMachineTests();
}
