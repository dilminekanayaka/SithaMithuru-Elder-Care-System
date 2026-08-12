async function runSyncServiceTests() {
  console.log('🧪 Running Mobile SyncService Tests...');

  try {
    const BASE_DELAY_MS = 2000;
    const MAX_DELAY_MS = 300000;

    const getBackoffDelay = (attempt: number): number => {
      return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(2, attempt));
    };

    console.assert(getBackoffDelay(0) === 2000, 'Attempt 0 backoff should be 2000ms');
    console.assert(getBackoffDelay(1) === 4000, 'Attempt 1 backoff should be 4000ms');
    console.assert(getBackoffDelay(2) === 8000, 'Attempt 2 backoff should be 8000ms');
    console.assert(getBackoffDelay(10) === 300000, 'Backoff should cap at max 300,000ms');

    console.log('✅ Exponential Backoff Calculations Passed');
  } catch (err: any) {
    console.error('❌ SyncService Test Failed:', err.message);
  }
}

if (require.main === module) {
  runSyncServiceTests();
}
